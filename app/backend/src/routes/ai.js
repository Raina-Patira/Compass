const express = require('express');
const { User, UserExpertise, ExpertiseTag, Question, Answer } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Mock AI service (in production, integrate with OpenAI, Claude, etc.)
const mockAI = {
  // Extract tags from question content
  extractTags: async (title, content) => {
    const allTags = await ExpertiseTag.findAll();
    const tagNames = allTags.map(t => t.name.toLowerCase());
    
    const combinedText = (title + ' ' + content).toLowerCase();
    const extractedTags = [];
    
    // Simple keyword matching (in production, use NLP/LLM)
    tagNames.forEach(tagName => {
      if (combinedText.includes(tagName) || 
          tagName.split(' ').some(word => combinedText.includes(word))) {
        const tag = allTags.find(t => t.name.toLowerCase() === tagName);
        if (tag) {
          extractedTags.push({
            id: tag.id,
            name: tag.name,
            confidence: 0.85
          });
        }
      }
    });

    // Also suggest new tags based on common keywords
    const commonTechTerms = [
      'javascript', 'python', 'react', 'node.js', 'sql', 'docker', 'kubernetes',
      'aws', 'azure', 'machine learning', 'ai', 'data science', 'devops',
      'frontend', 'backend', 'fullstack', 'mobile', 'ios', 'android',
      'security', 'cloud', 'database', 'api', 'microservices'
    ];

    commonTechTerms.forEach(term => {
      if (combinedText.includes(term) && !extractedTags.find(t => t.name.toLowerCase() === term)) {
        extractedTags.push({
          id: null,
          name: term,
          confidence: 0.75,
          isNew: true
        });
      }
    });

    return extractedTags.slice(0, 5);
  },

  // Find matching experts for a question
  findExperts: async (tagIds, questionContent) => {
    const experts = await User.findAll({
      where: { isActive: true },
      include: [{
        model: UserExpertise,
        where: {
          tagId: { [Op.in]: tagIds }
        },
        include: [ExpertiseTag]
      }],
      order: [['reputationScore', 'DESC']],
      limit: 10
    });

    return experts.map(expert => {
      const matchingTags = expert.UserExpertise.filter(ue => 
        tagIds.includes(ue.tagId)
      );
      
      const avgProficiency = matchingTags.reduce((sum, ue) => 
        sum + ue.proficiencyLevel, 0
      ) / matchingTags.length;

      const matchScore = (
        (avgProficiency / 5) * 40 +
        (Math.min(expert.reputationScore, 1000) / 1000) * 30 +
        (Math.min(expert.answersAccepted, 50) / 50) * 30
      );

      return {
        id: expert.id,
        firstName: expert.firstName,
        lastName: expert.lastName,
        avatarUrl: expert.avatarUrl,
        jobTitle: expert.jobTitle,
        reputationScore: expert.reputationScore,
        matchScore: Math.round(matchScore * 100) / 100,
        matchingExpertise: matchingTags.map(ue => ({
          name: ue.ExpertiseTag?.name,
          level: ue.proficiencyLevel
        })),
        reason: `Expert in ${matchingTags.map(t => t.ExpertiseTag?.name).join(', ')} with ${expert.answersAccepted} accepted answers`
      };
    }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
  },

  // Generate suggested answer
  suggestAnswer: async (questionTitle, questionContent) => {
    // In production, this would call an LLM API
    const suggestions = [
      "Based on your question, I'd recommend checking the official documentation for best practices.",
      "This is a common issue. Have you tried looking at similar questions in our knowledge base?",
      "Consider breaking this down into smaller components to isolate the problem.",
      "You might want to review the recent updates to this technology as there have been some changes."
    ];

    return {
      suggestion: suggestions[Math.floor(Math.random() * suggestions.length)],
      confidence: 0.72,
      relatedResources: [
        { title: 'Documentation', url: '#' },
        { title: 'Similar Questions', url: '#' }
      ]
    };
  },

  // Find similar questions
  findSimilarQuestions: async (title, content, excludeId = null) => {
    const where = {
      status: 'answered'
    };
    
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    // Simple text matching (in production, use embeddings)
    const keywords = title.toLowerCase().split(' ').filter(w => w.length > 3);
    
    where[Op.or] = keywords.map(keyword => ({
      title: { [Op.iLike]: `%${keyword}%` }
    }));

    const similar = await Question.findAll({
      where,
      include: [{
        model: User,
        as: 'author',
        attributes: ['firstName', 'lastName']
      }],
      order: [['upvotes', 'DESC']],
      limit: 5
    });

    return similar.map(q => ({
      id: q.id,
      title: q.title,
      upvotes: q.upvotes,
      answerCount: q.answersCount || 0,
      author: q.author ? `${q.author.firstName} ${q.author.lastName}` : 'Unknown'
    }));
  },

  // Generate quiz questions from knowledge base
  generateQuiz: async (topic, difficulty = 'medium', questionCount = 5) => {
    // In production, this would generate questions using LLM
    const sampleQuestions = [
      {
        question: `What is the primary purpose of ${topic}?`,
        options: ['To improve performance', 'To ensure security', 'To simplify development', 'All of the above'],
        correctAnswer: 'All of the above',
        explanation: 'This technology serves multiple purposes in modern development.'
      },
      {
        question: `Which of the following is a best practice when using ${topic}?`,
        options: ['Regular updates', 'Proper documentation', 'Testing', 'All of the above'],
        correctAnswer: 'All of the above',
        explanation: 'Best practices include all of these important aspects.'
      }
    ];

    return {
      title: `${topic} Knowledge Quiz`,
      difficulty,
      questions: sampleQuestions.slice(0, questionCount)
    };
  }
};

// Extract tags from question
router.post('/extract-tags', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const tags = await mockAI.extractTags(title, content);

    res.json({
      tags,
      count: tags.length
    });
  } catch (error) {
    console.error('Extract tags error:', error);
    res.status(500).json({ error: 'Failed to extract tags' });
  }
});

// Find experts for question
router.post('/find-experts', authenticateToken, async (req, res) => {
  try {
    const { tagIds, questionContent } = req.body;

    if (!tagIds || tagIds.length === 0) {
      return res.status(400).json({ error: 'Tag IDs are required' });
    }

    const experts = await mockAI.findExperts(tagIds, questionContent);

    res.json({
      experts,
      count: experts.length
    });
  } catch (error) {
    console.error('Find experts error:', error);
    res.status(500).json({ error: 'Failed to find experts' });
  }
});

// Suggest answer for question
router.post('/suggest-answer', authenticateToken, async (req, res) => {
  try {
    const { questionTitle, questionContent } = req.body;

    if (!questionTitle || !questionContent) {
      return res.status(400).json({ error: 'Question title and content are required' });
    }

    const suggestion = await mockAI.suggestAnswer(questionTitle, questionContent);

    res.json(suggestion);
  } catch (error) {
    console.error('Suggest answer error:', error);
    res.status(500).json({ error: 'Failed to suggest answer' });
  }
});

// Find similar questions
router.post('/similar-questions', authenticateToken, async (req, res) => {
  try {
    const { title, content, excludeId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const similar = await mockAI.findSimilarQuestions(title, content, excludeId);

    res.json({
      questions: similar,
      count: similar.length
    });
  } catch (error) {
    console.error('Find similar questions error:', error);
    res.status(500).json({ error: 'Failed to find similar questions' });
  }
});

// Generate quiz
router.post('/generate-quiz', authenticateToken, async (req, res) => {
  try {
    const { topic, difficulty, questionCount } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const quiz = await mockAI.generateQuiz(topic, difficulty, questionCount);

    res.json(quiz);
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Chatbot endpoint
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Simple response patterns (in production, use LLM)
    const responses = {
      'hello': 'Hello! How can I help you with knowledge sharing today?',
      'help': 'I can help you find experts, answer questions, or navigate the platform. What would you like to do?',
      'expert': 'I can help you find experts. What topic are you looking for help with?',
      'points': 'You earn points by asking questions, providing answers, and getting upvotes. Check the leaderboard to see top contributors!',
      'badge': 'Badges are earned by reaching milestones. Keep participating to unlock them!'
    };

    const lowerMessage = message.toLowerCase();
    let response = "I'm here to help! You can ask me about finding experts, earning points, or navigating the platform.";

    for (const [key, value] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        response = value;
        break;
      }
    }

    res.json({
      response,
      suggestions: [
        'How do I find experts?',
        'How do I earn points?',
        'What are badges?'
      ]
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

module.exports = router;
