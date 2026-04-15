const express = require('express');
const { User, UserExpertise, ExpertiseTag, UserBadge, Badge, PointsHistory, ActivityLog } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get all users (with pagination and search)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, department, expertise } = req.query;
    const offset = (page - 1) * limit;

    const where = { isActive: true };
    
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (department) {
      where.department = department;
    }

    const include = [
      {
        model: UserExpertise,
        include: [ExpertiseTag],
        where: expertise ? {} : undefined
      }
    ];

    if (expertise) {
      include[0].where = {
        '$UserExpertise.ExpertiseTag.name$': { [Op.iLike]: `%${expertise}%` }
      };
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      include,
      order: [['reputationScore', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.json({
      users: users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        jobTitle: user.jobTitle,
        department: user.department,
        reputationScore: user.reputationScore,
        totalPoints: user.totalPoints,
        questionsAnswered: user.questionsAnswered,
        answersAccepted: user.answersAccepted,
        expertise: user.UserExpertise?.map(ue => ({
          name: ue.ExpertiseTag?.name,
          level: ue.proficiencyLevel
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
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user by ID (profile)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: UserExpertise,
          include: [ExpertiseTag]
        },
        {
          model: UserBadge,
          include: [Badge]
        }
      ]
    });

    if (!user || !user.isActive) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recent activity
    const recentActivity = await ActivityLog.findAll({
      where: { userId: user.id },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Get points history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pointsHistory = await PointsHistory.findAll({
      where: {
        userId: user.id,
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        jobTitle: user.jobTitle,
        department: user.department,
        bio: user.bio,
        reputationScore: user.reputationScore,
        totalPoints: user.totalPoints,
        quizStreak: user.quizStreak,
        longestQuizStreak: user.longestQuizStreak,
        questionsAsked: user.questionsAsked,
        questionsAnswered: user.questionsAnswered,
        answersAccepted: user.answersAccepted,
        totalUpvotesReceived: user.totalUpvotesReceived,
        lastActiveAt: user.lastActiveAt,
        createdAt: user.createdAt,
        expertise: user.UserExpertise?.map(ue => ({
          id: ue.ExpertiseTag?.id,
          name: ue.ExpertiseTag?.name,
          level: ue.proficiencyLevel,
          verifiedCount: ue.verifiedCount
        })) || [],
        badges: user.UserBadges?.map(ub => ({
          id: ub.Badge?.id,
          name: ub.Badge?.name,
          description: ub.Badge?.description,
          iconUrl: ub.Badge?.iconUrl,
          category: ub.Badge?.category,
          earnedAt: ub.earnedAt
        })) || []
      },
      recentActivity: recentActivity.map(a => ({
        type: a.actionType,
        description: a.description,
        metadata: a.metadata,
        createdAt: a.createdAt
      })),
      pointsHistory: pointsHistory.map(p => ({
        points: p.points,
        actionType: p.actionType,
        description: p.description,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user expertise
router.put('/expertise', authenticateToken, async (req, res) => {
  try {
    const { expertise } = req.body; // Array of { tagId, level }
    const userId = req.user.userId;

    // Remove existing expertise
    await UserExpertise.destroy({ where: { userId } });

    // Add new expertise
    if (expertise && expertise.length > 0) {
      await UserExpertise.bulkCreate(
        expertise.map(e => ({
          userId,
          tagId: e.tagId,
          proficiencyLevel: e.level
        }))
      );
    }

    // Log activity
    await ActivityLog.create({
      userId,
      actionType: 'expertise_updated',
      description: 'Updated expertise tags',
      metadata: { expertiseCount: expertise?.length || 0 }
    });

    res.json({ message: 'Expertise updated successfully' });
  } catch (error) {
    console.error('Update expertise error:', error);
    res.status(500).json({ error: 'Failed to update expertise' });
  }
});

// Get user stats
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findByPk(userId, {
      attributes: [
        'questionsAsked',
        'questionsAnswered',
        'answersAccepted',
        'totalUpvotesReceived',
        'totalPoints',
        'reputationScore',
        'quizStreak',
        'longestQuizStreak'
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get activity heatmap data (last 365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const activityData = await ActivityLog.findAll({
      where: {
        userId,
        createdAt: { [Op.gte]: oneYearAgo }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))]
    });

    res.json({
      stats: {
        questionsAsked: user.questionsAsked,
        questionsAnswered: user.questionsAnswered,
        answersAccepted: user.answersAccepted,
        totalUpvotesReceived: user.totalUpvotesReceived,
        totalPoints: user.totalPoints,
        reputationScore: user.reputationScore,
        quizStreak: user.quizStreak,
        longestQuizStreak: user.longestQuizStreak,
        acceptanceRate: user.questionsAnswered > 0 
          ? Math.round((user.answersAccepted / user.questionsAnswered) * 100) 
          : 0
      },
      activityHeatmap: activityData.map(a => ({
        date: a.getDataValue('date'),
        count: parseInt(a.getDataValue('count'))
      }))
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
});

module.exports = router;
