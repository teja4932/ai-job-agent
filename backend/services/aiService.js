const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const extractSkills = async (resumeText) => {

  try {

    const completion = await groq.chat.completions.create({

      messages: [
        {
          role: 'system',
          content: `
          Extract technical skills from this resume.

          Return ONLY comma separated skills.

          Example:
          React, Node.js, MongoDB, AWS
          `
        },
        {
          role: 'user',
          content: resumeText
        }
      ],

      model: 'llama-3.3-70b-versatile',

      temperature: 0
    });

    return completion.choices[0].message.content;

  } catch (error) {

    console.log("GROQ ERROR:", error);

    return "";
  }
};

const generateJobRecommendations = async (skills) => {

  try {

    const completion = await groq.chat.completions.create({

      messages: [
        {
          role: 'system',
          content: `
          Based on these skills,
          suggest best software/AI/cloud/cybersecurity job roles.

          Return ONLY comma separated roles.

          Example:
          Frontend Developer, MERN Stack Developer
          `
        },
        {
          role: 'user',
          content: skills
        }
      ],

      model: 'llama-3.3-70b-versatile',

      temperature: 0.3
    });

    return completion.choices[0].message.content;

  } catch (error) {

    console.log("JOB RECOMMEND ERROR:", error);

    return "";
  }
};

module.exports = {
  extractSkills,
  generateJobRecommendations
};