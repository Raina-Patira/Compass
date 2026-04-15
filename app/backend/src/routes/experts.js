const express = require('express');
const { User, UserExpertise, ExpertiseTag, Question, Answer } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get all experts (users with expertise)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      tag,
      minReputation = 0,
      sortBy = 'reputation'
    } = req.query;
    
    const offset = (page - 1) * limit;

    const where = { 
      isActive: true,
      reputationScore: { [Op.gte]: minReputation }
    };

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { jobTitle: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const include = [
      {
        model: UserExpertise,
        required: tag ? true : false,
        include: [{
          model: ExpertiseTag,
          where: tag ? { name: { [Op.iLike]: `%${tag}%` } } : {},
          required: tag ? true : false
        }]
      }
    ];

    // Sort options
    let order = [];
    if (sortBy === 'reputation') {
      order = [['reputationScore', 'DESC']];
    } else if (sortBy === 'answers') {
      order = [['questionsAnswered', 'DESC']];
    } else if (sortBy === 'points') {
      order = [['totalPoints', 'DESC']];
    }

    const { count, rows: experts } = await User.findAndCountAll({
      where,
      include,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.json({
      experts: experts.map(expert => ({
        id: expert.id,
        firstName: expert.firstName,
        lastName: expert.lastName,
        avatarUrl: expert.avatarUrl,
        jobTitle: expert.jobTitle,
        department: expert.department,
        reputationScore: expert.reputationScore,
        totalPoints: expert.totalPoints,
        questionsAnswered: expert.questionsAnswered,
        answersAccepted: expert.answersAccepted,
        expertise: expert.UserExpertise?.map(ue => ({
          id: ue.ExpertiseTag?.id,
          name: ue.ExpertiseTag?.name,
          level: ue.proficiencyLevel,
          verifiedCount: ue.verifiedCount
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
    console.error('Get experts error:', error);
    res.status(500).json({ error: 'Failed to get experts' });
  }
});

// Get expert by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const expert = await User.findByPk(req.params.id, {
      include: [
        {
          model: UserExpertise,
          include: [ExpertiseTag]
        }
      ]
    });

    if (!expert || !expert.isActive) {
      return res.status(404).json({ error: 'Expert not found' });
    }

    // Get recent answers
    const recentAnswers = await Answer.findAll({
      where: { authorId: expert.id },
      include: [{
        model: Question,
        attributes: ['id', 'title']
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Get expertise distribution
    const expertiseStats = expert.UserExpertise?.map(ue => ({
      name: ue.ExpertiseTag?.name,
      level: ue.proficiencyLevel,
      verifiedCount: ue.verifiedCount,
      category: ue.ExpertiseTag?.category
    })) || [];

    res.json({
      expert: {
        id: expert.id,
        firstName: expert.firstName,
        lastName: expert.lastName,
        avatarUrl: expert.avatarUrl,
        jobTitle: expert.jobTitle,
        department: expert.department,
        bio: expert.bio,
        reputationScore: expert.reputationScore,
        totalPoints: expert.totalPoints,
        questionsAnswered: expert.questionsAnswered,
        answersAccepted: expert.answersAccepted,
        totalUpvotesReceived: expert.totalUpvotesReceived,
        expertise: expertiseStats,
        recentAnswers: recentAnswers.map(a => ({
          id: a.id,
          content: a.content ? a.content.substring(0, 200) + '...' : '',
          upvotes: a.upvotes,
          isAccepted: a.isAccepted,
          createdAt: a.createdAt,
          question: a.Question ? {
            id: a.Question.id,
            title: a.Question.title
          } : null
        }))
      }
    });
  } catch (error) {
    console.error('yes Get expert error:', error);
    res.status(500).json({ error: 'Failed to get expert' });
  }
});

// Get all expertise tags
router.get('/tags/all', authenticateToken, async (req, res) => {
  try {
    const { search, category } = req.query;
    
    const where = {};
    
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    
    if (category) {
      where.category = category;
    }

    const tags = await ExpertiseTag.findAll({
      where,
      order: [['name', 'ASC']]
    });

    // Get expert count for each tag
    const tagStats = await Promise.all(
      tags.map(async (tag) => {
        const expertCount = await UserExpertise.count({
          where: { tagId: tag.id }
        });
        return {
          id: tag.id,
          name: tag.name,
          description: tag.description,
          category: tag.category,
          expertCount
        };
      })
    );

    res.json({ tags: tagStats });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to get expertise tags' });
  }
});

// Find experts for a question (AI-powered matching)
router.post('/match', authenticateToken, async (req, res) => {
  try {
    const { questionId, tagIds } = req.body;

    if (!tagIds || tagIds.length === 0) {
      return res.status(400).json({ error: 'No tags provided' });
    }

    // Find experts with matching expertise
    const experts = await User.findAll({
      where: { isActive: true },
      include: [
        {
          model: UserExpertise,
          where: {
            tagId: { [Op.in]: tagIds }
          },
          include: [ExpertiseTag]
        }
      ],
      order: [
        ['reputationScore', 'DESC'],
        [UserExpertise, 'proficiencyLevel', 'DESC']
      ],
      limit: 10
    });

    // Calculate match scores
    const matchedExperts = experts.map(expert => {
      const matchingExpertise = expert.UserExpertise.filter(ue => 
        tagIds.includes(ue.tagId)
      );
      
      const avgProficiency = matchingExpertise.reduce((sum, ue) => 
        sum + ue.proficiencyLevel, 0
      ) / matchingExpertise.length;

      const matchScore = (
        (avgProficiency / 5) * 40 + // Proficiency weight: 40%
        (Math.min(expert.reputationScore, 1000) / 1000) * 30 + // Reputation weight: 30%
        (Math.min(expert.answersAccepted, 50) / 50) * 30 // Acceptance rate weight: 30%
      );

      return {
        id: expert.id,
        firstName: expert.firstName,
        lastName: expert.lastName,
        avatarUrl: expert.avatarUrl,
        jobTitle: expert.jobTitle,
        reputationScore: expert.reputationScore,
        matchScore: Math.round(matchScore * 100) / 100,
        matchingExpertise: matchingExpertise.map(ue => ({
          name: ue.ExpertiseTag?.name,
          level: ue.proficiencyLevel
        }))
      };
    });

    // Sort by match score
    matchedExperts.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      experts: matchedExperts.slice(0, 5),
      totalMatches: matchedExperts.length
    });
  } catch (error) {
    console.error('Match experts error:', error);
    res.status(500).json({ error: 'Failed to match experts' });
  }
});

// Request expert help
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { questionId, expertIds, reason } = req.body;

    const requests = await Promise.all(
      expertIds.map(async (expertId) => {
        return await ExpertRequest.create({
          questionId,
          expertId,
          reason,
          status: 'pending'
        });
      })
    );

    // Notify experts
    expertIds.forEach(expertId => {
      req.io.to(`user:${expertId}`).emit('expert_request', {
        questionId,
        message: 'You have been requested to answer a question'
      });
    });

    res.json({
      message: 'Expert requests sent successfully',
      requests: requests.map(r => ({
        id: r.id,
        expertId: r.expertId,
        status: r.status
      }))
    });
  } catch (error) {
    console.error('Request expert error:', error);
    res.status(500).json({ error: 'Failed to request expert' });
  }
});

module.exports = router;
