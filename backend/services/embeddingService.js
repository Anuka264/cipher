const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateUserEmbedding(text) {
  // We use the 'text-embedding-004' model which outputs 768 dimensions
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  
  const result = await model.embedContent(text);
  const embedding = result.embedding.values; // This is your array of 768 numbers
  
  return embedding;
}

module.exports = { generateUserEmbedding };