const express = require('express');
const { body, validationResult } = require('express-validator');
const { Question, Answer, User, ExpertiseTag, QuestionTag, Vote, ActivityLog, Notification, ExpertRequest, sequelize } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get all questions (with filters and pagination)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      tag, 
      status = 'open',
      sortBy = 'newest',
      author
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    const where = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (author) {
      where.authorId = author;
    }

    const include = [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'jobTitle']
      },
      {
        model: QuestionTag,
        include: [{
          model: ExpertiseTag,
          attributes: ['id', 'name']
        }]
      },
      {
        model: Answer,
        attributes: ['id'],
        required: false
      }
    ];

    // Search in title and content
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by tag
    if (tag) {
      include[1].where = {
        '$QuestionTags.ExpertiseTag.name$': { [Op.iLike]: `%${tag}%` }
      };
    }

    // Sort options
    let order = [['createdAt', 'DESC']];
    if (sortBy === 'popular') {
      order = [['upvotes', 'DESC'], ['viewCount', 'DESC']];
    } else if (sortBy === 'unanswered') {
      where.status = 'open';
      order = [['createdAt', 'ASC']];
    }

    const { count, rows: questions } = await Question.findAndCountAll({
      where,
      include,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.json({
      questions: questions.map(q => ({
        id: q.id,
        title: q.title,
        content: q.content.substring(0, 300) + (q.content.length > 300 ? '...' : ''),
        status: q.status,
        viewCount: q.viewCount,
        upvotes: q.upvotes,
        answerCount: q.Answers?.length || 0,
        createdAt: q.createdAt,
        author: q.author ? {
          id: q.author.id,
          firstName: q.author.firstName,
          lastName: q.author.lastName,
          avatarUrl: q.author.avatarUrl,
          jobTitle: q.author.jobTitle
        } : null,
        tags: q.QuestionTags?.map(qt => ({
          id: qt.ExpertiseTag?.id,
          name: qt.ExpertiseTag?.name
        })) || []
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to get questions' });
  }
});

// Get question by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'jobTitle', 'reputationScore']
        },
        {
          model: QuestionTag,
          include: [{
            model: ExpertiseTag,
            attributes: ['id', 'name', 'description']
          }]
        },
        {
          model: Answer,
          include: [{
            model: User,
            as: 'author',
            attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'jobTitle', 'reputationScore']
          }],
          order: [['upvotes', 'DESC'], ['createdAt', 'DESC']]
        }
      ]
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Increment view count
    await question.increment('viewCount');

    // Check if user has voted
    const userVote = await Vote.findOne({
      where: {
        userId: req.user.userId,
        targetType: 'question',
        targetId: question.id
      }
    });

    res.json({
      question: {
        id: question.id,
        title: question.title,
        content: question.content,
        status: question.status,
        viewCount: question.viewCount + 1,
        upvotes: question.upvotes,
        aiExtractedTags: question.aiExtractedTags,
        isAiGenerated: question.isAiGenerated,
        acceptedAnswerId: question.acceptedAnswerId,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        author: question.author ? {
          id: question.author.id,
          firstName: question.author.firstName,
          lastName: question.author.lastName,
          avatarUrl: question.author.avatarUrl,
          jobTitle: question.author.jobTitle,
          reputationScore: question.author.reputationScore
        } : null,
        tags: question.QuestionTags?.map(qt => ({
          id: qt.ExpertiseTag?.id,
          name: qt.ExpertiseTag?.name,
          description: qt.ExpertiseTag?.description
        })) || [],
        answers: question.Answers?.map(a => ({
          id: a.id,
          content: a.content,
          upvotes: a.upvotes,
          isAiGenerated: a.isAiGenerated,
          isAccepted: a.isAccepted,
          createdAt: a.createdAt,
          author: a.author ? {
            id: a.author.id,
            firstName: a.author.firstName,
            lastName: a.author.lastName,
            avatarUrl: a.author.avatarUrl,
            jobTitle: a.author.jobTitle,
            reputationScore: a.author.reputationScore
          } : null
        })) || [],
        userVote: userVote ? userVote.voteType : null
      }
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Failed to get question' });
  }
});

// Create question
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 10, max: 500 }),
  body('content').trim().isLength({ min: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, tags } = req.body;

    const question = await Question.create({
      title,
      content,
      authorId: req.user.userId,
      status: 'open'
    });

    // Add tags if provided
    if (tags && tags.length > 0) {
      await QuestionTag.bulkCreate(
        tags.map(tagId => ({
          questionId: question.id,
          tagId
        }))
      );
    }

    // Update user's questions count
    await User.increment('questionsAsked', {
      where: { id: req.user.userId }
    });

    // Log activity
    await ActivityLog.create({
      userId: req.user.userId,
      actionType: 'question_asked',
      description: `Asked question: ${title.substring(0, 100)}`,
      metadata: { questionId: question.id }
    });

    // Award points for asking question
    await sequelize.query(
      `UPDATE users SET total_points = total_points + 5 WHERE id = :userId`,
      { replacements: { userId: req.user.userId } }
    );

    await PointsHistory.create({
      userId: req.user.userId,
      points: 5,
      actionType: 'question_asked',
      description: 'Asked a question',
      referenceType: 'question',
      referenceId: question.id
    });

    res.status(201).json({
      message: 'Question created successfully',
      question: {
        id: question.id,
        title: question.title,
        content: question.content,
        status: question.status,
        createdAt: question.createdAt
      }
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Update question
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    
    const question = await Question.findByPk(req.params.id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check ownership
    if (question.authorId !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to edit this question' });
    }

    await question.update({
      title: title || question.title,
      content: content || question.content
    });

    // Update tags if provided
    if (tags) {
      await QuestionTag.destroy({ where: { questionId: question.id } });
      if (tags.length > 0) {
        await QuestionTag.bulkCreate(
          tags.map(tagId => ({
            questionId: question.id,
            tagId
          }))
        );
      }
    }

    res.json({
      message: 'Question updated successfully',
      question: {
        id: question.id,
        title: question.title,
        content: question.content,
        updatedAt: question.updatedAt
      }
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete question
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.authorId !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this question' });
    }

    await question.destroy();

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Vote on question
router.post('/:id/vote', authenticateToken, async (req, res) => {
  try {
    const { voteType } = req.body; // 1 or -1
    
    if (![1, -1].includes(voteType)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    const question = await Question.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check existing vote
    const existingVote = await Vote.findOne({
      where: {
        userId: req.user.userId,
        targetType: 'question',
        targetId: question.id
      }
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote if same
        await existingVote.destroy();
        await question.increment('upvotes', { by: -voteType });
      } else {
        // Change vote
        await existingVote.update({ voteType });
        await question.increment('upvotes', { by: voteType * 2 });
      }
    } else {
      // New vote
      await Vote.create({
        userId: req.user.userId,
        targetType: 'question',
        targetId: question.id,
        voteType
      });
      await question.increment('upvotes', { by: voteType });
    }

    await question.reload();

    res.json({
      message: 'Vote recorded',
      upvotes: question.upvotes,
      userVote: existingVote?.voteType === voteType ? null : voteType
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Get related questions
router.get('/:id/related', authenticateToken, async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id, {
      include: [{
        model: QuestionTag,
        include: [ExpertiseTag]
      }]
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const tagIds = question.QuestionTags?.map(qt => qt.tagId) || [];

    const relatedQuestions = await Question.findAll({
      where: {
        id: { [Op.ne]: question.id },
        status: 'open'
      },
      include: [
        {
          model: QuestionTag,
          where: tagIds.length > 0 ? { tagId: { [Op.in]: tagIds } } : {},
          include: [ExpertiseTag]
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'avatarUrl']
        }
      ],
      order: [['upvotes', 'DESC']],
      limit: 5
    });

    res.json({
      relatedQuestions: relatedQuestions.map(q => ({
        id: q.id,
        title: q.title,
        upvotes: q.upvotes,
        answerCount: q.Answers?.length || 0,
        createdAt: q.createdAt,
        author: q.author ? {
          id: q.author.id,
          firstName: q.author.firstName,
          lastName: q.author.lastName,
          avatarUrl: q.author.avatarUrl
        } : null,
        tags: q.QuestionTags?.map(qt => ({
          name: qt.ExpertiseTag?.name
        })) || []
      }))
    });
  } catch (error) {
    console.error('Get related questions error:', error);
    res.status(500).json({ error: 'Failed to get related questions' });
  }
});

module.exports = router;
