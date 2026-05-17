const Groq = require('groq-sdk');

// Initialize Groq client
const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }
  return new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
};

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const EXTRACTION_TIMEOUT = 30000; // 30 seconds timeout

/**
 * Extract technical skills from resume text using Groq LLM
 * @param {string} resumeText - The extracted text from resume
 * @returns {Promise<string>} Comma-separated skills
 */
const extractSkills = async (resumeText) => {
  try {
    if (!resumeText || resumeText.trim().length === 0) {
      return '';
    }

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Extract technical skills from this resume. Return ONLY comma separated skills. Example: React, Node.js, MongoDB, AWS`
        },
        {
          role: 'user',
          content: resumeText.substring(0, 8000) // Limit input size
        }
      ],
      model: GROQ_MODEL,
      temperature: 0,
      max_tokens: 500
    });

    const skills = completion.choices[0].message.content.trim();
    console.log('✅ Skills extracted successfully');
    return skills;
  } catch (error) {
    console.error('❌ Error extracting skills:', {
      message: error.message,
      code: error.code,
      status: error.status
    });
    return '';
  }
};

/**
 * Generate job recommendations based on extracted skills
 * @param {string} skills - Comma-separated skills
 * @returns {Promise<string>} Comma-separated job recommendations
 */
const generateJobRecommendations = async (skills) => {
  try {
    if (!skills || skills.trim().length === 0) {
      return 'Software Engineer, Full Stack Developer';
    }

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Based on these skills, suggest best software/AI/cloud/cybersecurity job roles. Return ONLY comma separated roles. Example: Frontend Developer, MERN Stack Developer`
        },
        {
          role: 'user',
          content: skills.substring(0, 2000) // Limit input size
        }
      ],
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 500
    });

    const jobs = completion.choices[0].message.content.trim();
    console.log('✅ Job recommendations generated successfully');
    return jobs;
  } catch (error) {
    console.error('❌ Error generating job recommendations:', {
      message: error.message,
      code: error.code,
      status: error.status
    });
    return 'Software Engineer, Full Stack Developer';
  }
};

module.exports = {
  extractSkills,
  generateJobRecommendations
};