const express = require('express');
const { body, validationResult } = require('express-validator');
const { Answer, Question, User, Vote, ActivityLog, Notification, PointsHistory, sequelize } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create answer
router.post('/', authenticateToken, [
  body('questionId').isUUID(),
  body('content').trim().isLength({ min: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { questionId, content } = req.body;

    // Check if question exists
    const question = await Question.findByPk(questionId, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.status === 'closed') {
      return res.status(400).json({ error: 'Question is closed' });
    }

    // Create answer
    const answer = await Answer.create({
      questionId,
      authorId: req.user.userId,
      content
    });

    // Update user's answer count
    await User.increment('questionsAnswered', {
      where: { id: req.user.userId }
    });

    // Log activity
    await ActivityLog.create({
      userId: req.user.userId,
      actionType: 'answer_posted',
      description: `Answered question: ${question.title.substring(0, 100)}`,
      metadata: { questionId, answerId: answer.id }
    });

    // Award points for answering
    await sequelize.query(
      `UPDATE users SET total_points = total_points + 10 WHERE id = :userId`,
      { replacements: { userId: req.user.userId } }
    );

    await PointsHistory.create({
      userId: req.user.userId,
      points: 10,
      actionType: 'answer_posted',
      description: 'Posted an answer',
      referenceType: 'answer',
      referenceId: answer.id
    });

    // Notify question author
    if (question.authorId !== req.user.userId) {
      await Notification.create({
        userId: question.authorId,
        type: 'answer_received',
        title: 'New Answer',
        message: `${req.user.firstName} ${req.user.lastName} answered your question`,
        referenceType: 'question',
        referenceId: question.id
      });

      // Real-time notification
      req.io.to(`user:${question.authorId}`).emit('notification', {
        type: 'answer_received',
        message: `${req.user.firstName} ${req.user.lastName} answered your question`
      });
    }

    res.status(201).json({
      message: 'Answer created successfully',
      answer: {
        id: answer.id,
        content: answer.content,
        upvotes: answer.upvotes,
        isAccepted: answer.isAccepted,
        createdAt: answer.createdAt
      }
    });
  } catch (error) {
    console.error('Create answer error:', error);
    res.status(500).json({ error: 'Failed to create answer' });
  }
});

// Update answer
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    
    const answer = await Answer.findByPk(req.params.id);
    
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (answer.authorId !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to edit this answer' });
    }

    await answer.update({ content });

    res.json({
      message: 'Answer updated successfully',
      answer: {
        id: answer.id,
        content: answer.content,
        updatedAt: answer.updatedAt
      }
    });
  } catch (error) {
    console.error('Update answer error:', error);
    res.status(500).json({ error: 'Failed to update answer' });
  }
});

// Delete answer
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const answer = await Answer.findByPk(req.params.id);
    
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (answer.authorId !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this answer' });
    }

    await answer.destroy();

    // Decrement user's answer count
    await User.decrement('questionsAnswered', {
      where: { id: answer.authorId }
    });

    res.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    console.error('Delete answer error:', error);
    res.status(500).json({ error: 'Failed to delete answer' });
  }
});

// Vote on answer
router.post('/:id/vote', authenticateToken, async (req, res) => {
  try {
    const { voteType } = req.body;
    
    if (![1, -1].includes(voteType)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    const answer = await Answer.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'author'
      }]
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    const existingVote = await Vote.findOne({
      where: {
        userId: req.user.userId,
        targetType: 'answer',
        targetId: answer.id
      }
    });

    let pointChange = 0;

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        await existingVote.destroy();
        await answer.increment('upvotes', { by: -voteType });
        pointChange = -voteType;
      } else {
        await existingVote.update({ voteType });
        await answer.increment('upvotes', { by: voteType * 2 });
        pointChange = voteType * 2;
      }
    } else {
      await Vote.create({
        userId: req.user.userId,
        targetType: 'answer',
        targetId: answer.id,
        voteType
      });
      await answer.increment('upvotes', { by: voteType });
      pointChange = voteType;
    }

    // Update author's reputation
    if (answer.author) {
      await User.increment('totalUpvotesReceived', {
        by: pointChange,
        where: { id: answer.authorId }
      });
      
      await User.increment('reputationScore', {
        by: pointChange,
        where: { id: answer.authorId }
      });

      // Award points for upvotes
      if (pointChange > 0) {
        await sequelize.query(
          `UPDATE users SET total_points = total_points + :points WHERE id = :userId`,
          { replacements: { points: pointChange * 2, userId: answer.authorId } }
        );

        await PointsHistory.create({
          userId: answer.authorId,
          points: pointChange * 2,
          actionType: 'upvote_received',
          description: 'Received upvotes on answer',
          referenceType: 'answer',
          referenceId: answer.id
        });
      }
    }

    await answer.reload();

    res.json({
      message: 'Vote recorded',
      upvotes: answer.upvotes,
      userVote: existingVote?.voteType === voteType ? null : voteType
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Accept answer
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const answer = await Answer.findByPk(req.params.id, {
      include: [{
        model: Question,
        as: 'question'
      }]
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (!answer.question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Only question author can accept answer
    if (answer.question.authorId !== req.user.userId) {
      return res.status(403).json({ error: 'Only question author can accept answers' });
    }

    // Unaccept previous answer if exists
    if (answer.question.acceptedAnswerId) {
      await Answer.update(
        { isAccepted: false },
        { where: { id: answer.question.acceptedAnswerId } }
      );
    }

    // Accept new answer
    await answer.update({ isAccepted: true });
    await answer.question.update({ 
      acceptedAnswerId: answer.id,
      status: 'answered'
    });

    // Update author's stats
    await User.increment('answersAccepted', {
      where: { id: answer.authorId }
    });

    // Award bonus points for accepted answer
    await sequelize.query(
      `UPDATE users SET total_points = total_points + 25, reputation_score = reputation_score + 15 WHERE id = :userId`,
      { replacements: { userId: answer.authorId } }
    );

    await PointsHistory.create({
      userId: answer.authorId,
      points: 25,
      actionType: 'answer_accepted',
      description: 'Answer was accepted',
      referenceType: 'answer',
      referenceId: answer.id
    });

    // Notify answer author
    await Notification.create({
      userId: answer.authorId,
      type: 'answer_accepted',
      title: 'Answer Accepted!',
      message: 'Your answer was accepted as the best solution',
      referenceType: 'question',
      referenceId: answer.question.id
    });

    req.io.to(`user:${answer.authorId}`).emit('notification', {
      type: 'answer_accepted',
      message: 'Your answer was accepted as the best solution!'
    });

    res.json({
      message: 'Answer accepted successfully',
      answer: {
        id: answer.id,
        isAccepted: true
      }
    });
  } catch (error) {
    console.error('Accept answer error:', error);
    res.status(500).json({ error: 'Failed to accept answer' });
  }
});

module.exports = router;
