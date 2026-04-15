const express = require('express');
const { Quiz, QuizQuestion, QuizAttempt, User, ExpertiseTag, ActivityLog, PointsHistory } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get all quizzes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      difficulty,
      category,
      search
    } = req.query;
    
    const offset = (page - 1) * limit;

    const where = { isActive: true };
    
    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }

    const include = [
      {
        model: ExpertiseTag,
        as: 'category',
        attributes: ['id', 'name'],
        where: category ? { id: category } : {}
      }
    ];

    const { count, rows: quizzes } = await Quiz.findAndCountAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // Get user's attempts for these quizzes
    const quizIds = quizzes.map(q => q.id);
    const userAttempts = await QuizAttempt.findAll({
      where: {
        userId: req.user.userId,
        quizId: { [Op.in]: quizIds }
      }
    });

    const attemptsMap = new Map(userAttempts.map(a => [a.quizId, a]));

    res.json({
      quizzes: quizzes.map(q => {
        const attempt = attemptsMap.get(q.id);
        return {
          id: q.id,
          title: q.title,
          description: q.description,
          difficulty: q.difficulty,
          timeLimitMinutes: q.timeLimitMinutes,
          category: q.category ? {
            id: q.category.id,
            name: q.category.name
          } : null,
          attempted: !!attempt,
          bestScore: attempt?.score || null,
          completedAt: attempt?.completedAt,
          createdAt: q.createdAt
        };
      }),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ error: 'Failed to get quizzes' });
  }
});

// Get quiz by ID (with questions for taking)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [
        {
          model: QuizQuestion,
          order: [['orderIndex', 'ASC']]
        },
        {
          model: ExpertiseTag,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!quiz || !quiz.isActive) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Get user's previous attempts
    const attempts = await QuizAttempt.findAll({
      where: {
        userId: req.user.userId,
        quizId: quiz.id
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        timeLimitMinutes: quiz.timeLimitMinutes,
        category: quiz.category ? {
          id: quiz.category.id,
          name: quiz.category.name
        } : null,
        questions: quiz.QuizQuestions?.map(q => ({
          id: q.id,
          question: q.question,
          questionType: q.questionType,
          options: q.options,
          points: q.points
        })) || [],
        totalQuestions: quiz.QuizQuestions?.length || 0,
        totalPoints: quiz.QuizQuestions?.reduce((sum, q) => sum + q.points, 0) || 0
      },
      previousAttempts: attempts.map(a => ({
        id: a.id,
        score: a.score,
        totalPoints: a.totalPoints,
        correctAnswers: a.correctAnswers,
        totalQuestions: a.totalQuestions,
        timeTakenSeconds: a.timeTakenSeconds,
        completedAt: a.completedAt
      }))
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ error: 'Failed to get quiz' });
  }
});

// Start quiz attempt
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);

    if (!quiz || !quiz.isActive) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Create new attempt
    const attempt = await QuizAttempt.create({
      userId: req.user.userId,
      quizId: quiz.id
    });

    res.json({
      message: 'Quiz attempt started',
      attempt: {
        id: attempt.id,
        startedAt: attempt.createdAt
      }
    });
  } catch (error) {
    console.error('Start quiz error:', error);
    res.status(500).json({ error: 'Failed to start quiz' });
  }
});

// Submit quiz answers
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { attemptId, answers, timeTakenSeconds } = req.body;
    // answers: [{ questionId, answer }]

    const quiz = await Quiz.findByPk(req.params.id, {
      include: [QuizQuestion]
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const attempt = await QuizAttempt.findOne({
      where: {
        id: attemptId,
        userId: req.user.userId,
        quizId: quiz.id
      }
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    if (attempt.completedAt) {
      return res.status(400).json({ error: 'Quiz already completed' });
    }

    // Calculate score
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    const questionsMap = new Map(quiz.QuizQuestions.map(q => [q.id, q]));

    answers.forEach(({ questionId, answer }) => {
      const question = questionsMap.get(questionId);
      if (question) {
        totalPoints += question.points;
        const isCorrect = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        if (isCorrect) {
          correctAnswers++;
          earnedPoints += question.points;
        }
      }
    });

    const score = Math.round((earnedPoints / totalPoints) * 100);

    // Update attempt
    await attempt.update({
      score,
      totalPoints: earnedPoints,
      correctAnswers,
      totalQuestions: quiz.QuizQuestions.length,
      timeTakenSeconds,
      completedAt: new Date()
    });

    // Update user's quiz streak
    const user = await User.findByPk(req.user.userId);
    const newStreak = user.quizStreak + 1;
    const longestStreak = Math.max(newStreak, user.longestQuizStreak);
    
    await user.update({
      quizStreak: newStreak,
      longestQuizStreak: longestStreak
    });

    // Award points based on score
    const basePoints = Math.round(score / 10);
    const streakBonus = Math.min(newStreak * 2, 20); // Max 20 bonus points
    const totalEarnedPoints = basePoints + streakBonus;

    await User.increment('totalPoints', {
      by: totalEarnedPoints,
      where: { id: req.user.userId }
    });

    await PointsHistory.create({
      userId: req.user.userId,
      points: totalEarnedPoints,
      actionType: 'quiz_completed',
      description: `Completed quiz: ${quiz.title}`,
      referenceType: 'quiz',
      referenceId: quiz.id
    });

    // Log activity
    await ActivityLog.create({
      userId: req.user.userId,
      actionType: 'quiz_completed',
      description: `Completed quiz: ${quiz.title} with score ${score}%`,
      metadata: { quizId: quiz.id, score, attemptId }
    });

    res.json({
      message: 'Quiz submitted successfully',
      result: {
        score,
        correctAnswers,
        totalQuestions: quiz.QuizQuestions.length,
        earnedPoints: totalEarnedPoints,
        streakBonus,
        currentStreak: newStreak,
        timeTakenSeconds
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Get daily quiz
router.get('/daily/today', authenticateToken, async (req, res) => {
  try {
    // Get or create daily quiz
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dailyQuiz = await Quiz.findOne({
      where: {
        title: { [Op.iLike]: '%Daily Quiz%' },
        createdAt: { [Op.gte]: today }
      },
      include: [
        {
          model: QuizQuestion,
          order: [['orderIndex', 'ASC']]
        }
      ]
    });

    // If no daily quiz exists, create one (in production, this would be scheduled)
    if (!dailyQuiz) {
      // Return a random quiz as daily
      dailyQuiz = await Quiz.findOne({
        where: { isActive: true },
        include: [QuizQuestion],
        order: sequelize.literal('RANDOM()')
      });
    }

    if (!dailyQuiz) {
      return res.status(404).json({ error: 'No daily quiz available' });
    }

    // Check if user has already taken today's quiz
    const todayAttempt = await QuizAttempt.findOne({
      where: {
        userId: req.user.userId,
        quizId: dailyQuiz.id,
        completedAt: { [Op.gte]: today }
      }
    });

    res.json({
      quiz: {
        id: dailyQuiz.id,
        title: dailyQuiz.title,
        description: dailyQuiz.description,
        difficulty: dailyQuiz.difficulty,
        timeLimitMinutes: dailyQuiz.timeLimitMinutes,
        questions: dailyQuiz.QuizQuestions?.map(q => ({
          id: q.id,
          question: q.question,
          questionType: q.questionType,
          options: q.options,
          points: q.points
        })) || []
      },
      alreadyTaken: !!todayAttempt,
      todayAttempt: todayAttempt ? {
        score: todayAttempt.score,
        completedAt: todayAttempt.completedAt
      } : null
    });
  } catch (error) {
    console.error('Get daily quiz error:', error);
    res.status(500).json({ error: 'Failed to get daily quiz' });
  }
});

// Get quiz history
router.get('/history/my', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: attempts } = await QuizAttempt.findAndCountAll({
      where: {
        userId: req.user.userId,
        completedAt: { [Op.not]: null }
      },
      include: [{
        model: Quiz,
        attributes: ['id', 'title', 'difficulty']
      }],
      order: [['completedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      attempts: attempts.map(a => ({
        id: a.id,
        quiz: a.Quiz ? {
          id: a.Quiz.id,
          title: a.Quiz.title,
          difficulty: a.Quiz.difficulty
        } : null,
        score: a.score,
        correctAnswers: a.correctAnswers,
        totalQuestions: a.totalQuestions,
        timeTakenSeconds: a.timeTakenSeconds,
        completedAt: a.completedAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get quiz history error:', error);
    res.status(500).json({ error: 'Failed to get quiz history' });
  }
});

module.exports = router;
