const { User, UserExpertise, ExpertiseTag, Question } = require("../models");
const { Op } = require("sequelize");
const { extractTags: aiExtractTags } = require("./aiTagService");

const aiService = {
  extractTags: async (title, content) => {
    const combinedText = `${title} ${content}`;

    const aiTags = await aiExtractTags(combinedText);

    // const normalizedTags = [...new Set(
    //   aiTags.map(t => t.trim().toLowerCase())
    // )]

    const results = [];

    for (const tag of aiTags) {
      let existing = await ExpertiseTag.findOne({
        where: { name: tag },
      });

      if (!existing) {
        existing = await ExpertiseTag.create({
          name: tag,
          description: "AI generated tag",
          category: "dynamic",
        });
      }

      results.push({
        id: existing.id,
        name: existing.name,
      });
    }
    console.log("YES ", results);
    return results.slice(0, 5);
  },
};

module.exports = aiService;
