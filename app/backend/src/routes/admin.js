const express = require('express');
const { User, Question, Answer, Quiz, QuizAttempt, ActivityLog, PointsHistory, ExpertiseTag, sequelize } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // User stats
    const totalUsers = await User.count({ where: { isActive: true } });
    const newUsersToday = await User.count({
      where: {
        isActive: true,
        createdAt: { [Op.gte]: today }
      }
    });

    // Question stats
    const totalQuestions = await Question.count();
    const questionsToday = await Question.count({
      where: { createdAt: { [Op.gte]: today } }
    });
    const openQuestions = await Question.count({ where: { status: 'open' } });
    const answeredQuestions = await Question.count({ where: { status: 'answered' } });

    // Answer stats
    const totalAnswers = await Answer.count();
    const answersToday = await Answer.count({
      where: { createdAt: { [Op.gte]: today } }
    });

    // Quiz stats
    const totalQuizzes = await Quiz.count({ where: { isActive: true } });
    const quizAttempts = await QuizAttempt.count({
      where: { completedAt: { [Op.not]: null } }
    });

    // Activity stats (last 30 days)
    const dailyActivity = await ActivityLog.findAll({
      where: { createdAt: { [Op.gte]: thirtyDaysAgo } },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
    });

    // Top contributors (last 30 days)
    const topContributors = await PointsHistory.findAll({
      where: { createdAt: { [Op.gte]: thirtyDaysAgo } },
      attributes: [
        'userId',
        [sequelize.fn('SUM', sequelize.col('points')), 'totalPoints']
      ],
      group: ['userId'],
      order: [[sequelize.fn('SUM', sequelize.col('points')), 'DESC']],
      limit: 10,
      include: [{
        model: User,
        attributes: ['firstName', 'lastName', 'avatarUrl']
      }]
    });

    // Knowledge gaps (tags with many questions but few answers)
    const knowledgeGaps = await sequelize.query(`
      SELECT 
        et.name as tag_name,
        COUNT(DISTINCT q.id) as question_count,
        COUNT(DISTINCT a.id) as answer_count
      FROM expertise_tags et
      LEFT JOIN question_tags qt ON et.id = qt.tag_id
      LEFT JOIN questions q ON qt.question_id = q.id
      LEFT JOIN answers a ON q.id = a.question_id
      GROUP BY et.id, et.name
      HAVING COUNT(DISTINCT q.id) > 0
      ORDER BY (COUNT(DISTINCT a.id)::float / NULLIF(COUNT(DISTINCT q.id), 0)) ASC
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });

    res.json({
      overview: {
        totalUsers,
        newUsersToday,
        totalQuestions,
        questionsToday,
        openQuestions,
        answeredQuestions,
        totalAnswers,
        answersToday,
        totalQuizzes,
        quizAttempts,
        answerRate: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
      },
      dailyActivity: dailyActivity.map(d => ({
        date: d.getDataValue('date'),
        count: parseInt(d.getDataValue('count'))
      })),
      topContributors: topContributors.map(c => ({
        userId: c.userId,
        firstName: c.User?.firstName,
        lastName: c.User?.lastName,
        avatarUrl: c.User?.avatarUrl,
        points: parseInt(c.getDataValue('totalPoints'))
      })),
      knowledgeGaps: knowledgeGaps.map(kg => ({
        tagName: kg.tag_name,
        questionCount: parseInt(kg.question_count),
        answerCount: parseInt(kg.answer_count),
        coverageRate: kg.question_count > 0 
          ? Math.round((parseInt(kg.answer_count) / parseInt(kg.question_count)) * 100) 
          : 0
      }))
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to get admin stats' });
  }
});

// Get all users (admin view)
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) {
      where.isActive = status === 'active';
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        avatarUrl: u.avatarUrl,
        jobTitle: u.jobTitle,
        department: u.department,
        isAdmin: u.isAdmin,
        isActive: u.isActive,
        reputationScore: u.reputationScore,
        totalPoints: u.totalPoints,
        createdAt: u.createdAt,
        lastActiveAt: u.lastActiveAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Update user status
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive, isAdmin } = req.body;
    
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({
      isActive: isActive !== undefined ? isActive : user.isActive,
      isAdmin: isAdmin !== undefined ? isAdmin : user.isAdmin
    });

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        isActive: user.isActive,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get content moderation queue
router.get('/moderation', async (req, res) => {
  try {
    const { type = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let items = [];

    if (type === 'all' || type === 'questions') {
      const flaggedQuestions = await Question.findAll({
        where: {
          // In a real app, you'd have a flagged/status field
          createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        },
        include: [{
          model: User,
          as: 'author',
          attributes: ['firstName', 'lastName']
        }],
        limit: parseInt(limit),
        order: [['createdAt', 'DESC']]
      });

      items.push(...flaggedQuestions.map(q => ({
        id: q.id,
        type: 'question',
        title: q.title,
        content: q.content.substring(0, 200),
        author: q.author ? `${q.author.firstName} ${q.author.lastName}` : 'Unknown',
        createdAt: q.createdAt
      })));
    }

    res.json({
      items: items.slice(offset, offset + parseInt(limit)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: items.length,
        totalPages: Math.ceil(items.length / limit)
      }
    });
  } catch (error) {
    console.error('Get moderation queue error:', error);
    res.status(500).json({ error: 'Failed to get moderation queue' });
  }
});

// Create expertise tag
router.post('/tags', async (req, res) => {
  try {
    const { name, description, category } = req.body;

    const existingTag = await ExpertiseTag.findOne({ where: { name } });
    if (existingTag) {
      return res.status(400).json({ error: 'Tag already exists' });
    }

    const tag = await ExpertiseTag.create({
      name,
      description,
      category
    });

    res.status(201).json({
      message: 'Tag created successfully',
      tag: {
        id: tag.id,
        name: tag.name,
        description: tag.description,
        category: tag.category
      }
    });
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// System settings (placeholder)
router.get('/settings', async (req, res) => {
  try {
    res.json({
      settings: {
        registration: {
          openRegistration: true,
          requireApproval: false
        },
        gamification: {
          pointsEnabled: true,
          badgesEnabled: true,
          leaderboardEnabled: true
        },
        ai: {
          tagExtractionEnabled: true,
          expertMatchingEnabled: true,
          suggestedAnswersEnabled: true
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true
        }
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

module.exports = router;
