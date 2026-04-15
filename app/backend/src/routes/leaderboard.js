const express = require('express');
const { User, UserBadge, Badge } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

const router = express.Router();

// Get leaderboard
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      timeframe = 'all-time', // daily, weekly, monthly, all-time
      category = 'points', // points, reputation, answers, accepted
      page = 1,
      limit = 20
    } = req.query;
    
    const offset = (page - 1) * limit;

    let order = [];
    let where = { isActive: true };

    // Set ordering based on category
    switch (category) {
      case 'points':
        order = [['totalPoints', 'DESC']];
        break;
      case 'reputation':
        order = [['reputationScore', 'DESC']];
        break;
      case 'answers':
        order = [['questionsAnswered', 'DESC']];
        break;
      case 'accepted':
        order = [['answersAccepted', 'DESC']];
        break;
      case 'streak':
        order = [['quizStreak', 'DESC']];
        break;
      default:
        order = [['totalPoints', 'DESC']];
    }

    // For time-based leaderboards, we'd typically use activity logs
    // For now, we'll use the all-time stats

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: [
        'id', 'firstName', 'lastName', 'avatarUrl', 'jobTitle', 'department',
        'totalPoints', 'reputationScore', 'questionsAnswered', 'answersAccepted',
        'quizStreak', 'totalUpvotesReceived'
      ],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get current user's rank
    let userRank = null;
    if (req.user) {
      const allUsers = await User.findAll({
        where: { isActive: true },
        order,
        attributes: ['id']
      });
      
      const userIndex = allUsers.findIndex(u => u.id === req.user.userId);
      if (userIndex !== -1) {
        userRank = userIndex + 1;
      }
    }

    res.json({
      leaderboard: users.map((user, index) => ({
        rank: offset + index + 1,
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        jobTitle: user.jobTitle,
        department: user.department,
        totalPoints: user.totalPoints,
        reputationScore: user.reputationScore,
        questionsAnswered: user.questionsAnswered,
        answersAccepted: user.answersAccepted,
        quizStreak: user.quizStreak,
        totalUpvotesReceived: user.totalUpvotesReceived
      })),
      userRank,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      },
      timeframe,
      category
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Get user's rank and stats
router.get('/my-rank', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: [
        'id', 'firstName', 'lastName', 'avatarUrl',
        'totalPoints', 'reputationScore', 'questionsAnswered', 
        'answersAccepted', 'quizStreak', 'longestQuizStreak'
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate ranks
    const pointsRank = await User.count({
      where: {
        isActive: true,
        totalPoints: { [Op.gt]: user.totalPoints }
      }
    });

    const reputationRank = await User.count({
      where: {
        isActive: true,
        reputationScore: { [Op.gt]: user.reputationScore }
      }
    });

    const answersRank = await User.count({
      where: {
        isActive: true,
        questionsAnswered: { [Op.gt]: user.questionsAnswered }
      }
    });

    res.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        totalPoints: user.totalPoints,
        reputationScore: user.reputationScore,
        questionsAnswered: user.questionsAnswered,
        answersAccepted: user.answersAccepted,
        quizStreak: user.quizStreak,
        longestQuizStreak: user.longestQuizStreak
      },
      ranks: {
        points: pointsRank + 1,
        reputation: reputationRank + 1,
        answers: answersRank + 1
      }
    });
  } catch (error) {
    console.error('Get my rank error:', error);
    res.status(500).json({ error: 'Failed to get rank' });
  }
});

// Get badges leaderboard
router.get('/badges', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get users with most badges
    const users = await User.findAll({
      where: { isActive: true },
      include: [{
        model: UserBadge,
        include: [Badge]
      }],
      order: [['totalPoints', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const badgeLeaderboard = users.map((user, index) => ({
      rank: offset + index + 1,
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      badgeCount: user.UserBadges?.length || 0,
      badges: user.UserBadges?.map(ub => ({
        name: ub.Badge?.name,
        iconUrl: ub.Badge?.iconUrl,
        category: ub.Badge?.category
      })) || []
    }));

    // Sort by badge count
    badgeLeaderboard.sort((a, b) => b.badgeCount - a.badgeCount);

    res.json({
      leaderboard: badgeLeaderboard.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }))
    });
  } catch (error) {
    console.error('Get badges leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get badges leaderboard' });
  }
});

// Get department leaderboard
router.get('/departments', authenticateToken, async (req, res) => {
  try {
    // Aggregate stats by department
    const departmentStats = await User.findAll({
      where: { 
        isActive: true,
        department: { [Op.not]: null }
      },
      attributes: [
        'department',
        [sequelize.fn('COUNT', sequelize.col('id')), 'memberCount'],
        [sequelize.fn('SUM', sequelize.col('total_points')), 'totalPoints'],
        [sequelize.fn('SUM', sequelize.col('reputation_score')), 'totalReputation'],
        [sequelize.fn('SUM', sequelize.col('questions_answered')), 'totalAnswers']
      ],
      group: ['department'],
      order: [[sequelize.fn('SUM', sequelize.col('total_points')), 'DESC']]
    });

    res.json({
      departments: departmentStats.map((dept, index) => ({
        rank: index + 1,
        name: dept.department,
        memberCount: parseInt(dept.getDataValue('memberCount')),
        totalPoints: parseInt(dept.getDataValue('totalPoints')) || 0,
        totalReputation: parseInt(dept.getDataValue('totalReputation')) || 0,
        totalAnswers: parseInt(dept.getDataValue('totalAnswers')) || 0
      }))
    });
  } catch (error) {
    console.error('Get department leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get department leaderboard' });
  }
});

module.exports = router;
