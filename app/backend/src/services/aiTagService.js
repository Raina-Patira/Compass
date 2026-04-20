const OpenAI = require("openai");

// ✅ Use Groq base URL
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const extractTags = async (text) => {
  try {
    const response = await client.chat.completions.create({
      // ✅ FIXED MODEL (important)
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `
You are a tag extraction engine.

Output ONLY a valid JSON array of tags.
Do NOT include explanations, sentences, or any extra text.

Rules:
- Only high-level tech tags (languages, frameworks, tools)
- No generic phrases
- No duplicates
- Max 5-6 tags

Example output:
["Python", "React", "Node.js"]
`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.2,
    });

    const content = response.choices[0].message.content;

    // ✅ Safe parsing
    const match = content.match(/\[.*\]/s);
    return match ? JSON.parse(match[0]) : [];
  } catch (error) {
    console.error("AI error:", error);

    // ✅ FALLBACK (VERY IMPORTANT)
    const lower = text.toLowerCase();

    // if (lower.includes("primary key")) return ["database", "sql"];
    // if (lower.includes("react")) return ["react", "frontend"];
    // if (lower.includes("api")) return ["backend", "api"];

    // return ["general"];
  }
};

module.exports = { extractTags };
