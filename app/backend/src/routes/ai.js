const express = require('express')
const {
  User,
  UserExpertise,
  ExpertiseTag,
  Question,
  Answer
} = require('../models')
const { authenticateToken } = require('../middleware/auth')
const { Op } = require('sequelize')
const aiService = require('../services/aiService')

// ✅ AI service import
const { extractTags: aiExtractTags } = require('../services/aiTagService')

const router = express.Router()

// ✅ ROUTE (unchanged)
router.post('/extract-tags', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body

    const tags = await aiService.extractTags(title, content)

    res.json({
      tags,
      count: tags.length
    })
  } catch (error) {
    console.error('Extract tags error:', error)
    res.status(500).json({ error: 'Failed to extract tags' })
  }
})

module.exports = router
