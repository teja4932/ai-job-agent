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
 * Wrap a promise with a timeout
 */
const withTimeout = (promise, ms, label = 'Operation') => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    )
  ]);
};

/**
 * Fallback regex-based skill extraction when AI is unavailable
 * Covers software, cybersecurity, cloud, AI/ML, data fields
 */
const fallbackSkillExtraction = (resumeText) => {
  const knownSkills = [
    // Programming Languages
    'Python', 'JavaScript', 'TypeScript', 'Java', 'C\\+\\+', 'C#', 'Go', 'Rust', 'Ruby', 'PHP',
    'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Shell', 'Bash', 'PowerShell', 'SQL',
    // Web & Frontend
    'React', 'Angular', 'Vue\\.js', 'Next\\.js', 'Node\\.js', 'Express', 'Django', 'Flask',
    'Spring Boot', 'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'SASS', 'jQuery',
    // Databases
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Cassandra', 'DynamoDB', 'Firebase', 'Supabase',
    'Oracle', 'SQL Server', 'Elasticsearch',
    // Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'Ansible',
    'Jenkins', 'CI/CD', 'GitHub Actions', 'GitLab CI', 'CloudFormation', 'Serverless',
    'Lambda', 'EC2', 'S3', 'CloudFront', 'ECS', 'EKS', 'Helm',
    // AI / ML / Data
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn',
    'NLP', 'Computer Vision', 'OpenCV', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn',
    'Tableau', 'Power BI', 'Apache Spark', 'Hadoop', 'Airflow', 'Kafka', 'ETL',
    'Data Analysis', 'Data Engineering', 'Data Visualization', 'Statistics',
    'LLM', 'GPT', 'Generative AI', 'RAG', 'LangChain', 'Hugging Face',
    // Cybersecurity
    'Cybersecurity', 'Penetration Testing', 'VAPT', 'SIEM', 'SOC', 'Splunk', 'Wireshark',
    'Nmap', 'Burp Suite', 'Metasploit', 'Nessus', 'OWASP', 'Firewall', 'IDS', 'IPS',
    'Incident Response', 'Threat Intelligence', 'Malware Analysis', 'Digital Forensics',
    'ISO 27001', 'NIST', 'Compliance', 'Encryption', 'PKI', 'IAM', 'Zero Trust',
    'Vulnerability Assessment', 'Network Security', 'Endpoint Security', 'SOAR',
    // Tools & Misc
    'Git', 'GitHub', 'GitLab', 'Jira', 'Confluence', 'Figma', 'Linux', 'Unix',
    'REST API', 'GraphQL', 'gRPC', 'Microservices', 'Agile', 'Scrum',
    'Playwright', 'Selenium', 'Cypress', 'Jest', 'Mocha',
    'RPA', 'Automation', 'Blockchain', 'Solidity', 'Web3'
  ];

  const found = new Set();
  const upperText = resumeText.toUpperCase();

  for (const skill of knownSkills) {
    const regex = new RegExp(`\\b${skill}\\b`, 'i');
    if (regex.test(resumeText)) {
      // Normalize the match to proper casing
      const match = resumeText.match(regex);
      found.add(match ? match[0] : skill.replace(/\\\+/g, '+').replace(/\\\./g, '.'));
    }
  }

  return Array.from(found).join(', ');
};

/**
 * Extract technical skills from resume text using Groq LLM
 * Supports: software, cybersecurity, cloud, AI/ML, data fields
 * @param {string} resumeText - The extracted text from resume
 * @returns {Promise<string>} Comma-separated skills
 */
const extractSkills = async (resumeText) => {
  try {
    if (!resumeText || resumeText.trim().length === 0) {
      return '';
    }

    const groq = getGroqClient();

    const completion = await withTimeout(
      groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a resume skill extractor. Extract ALL technical skills, tools, technologies, certifications, and domain expertise from the resume text.

Include skills from ALL fields:
- Software Development: programming languages, frameworks, databases, APIs
- Cybersecurity: penetration testing, SIEM, SOC, compliance frameworks, security tools
- Cloud Computing: AWS, Azure, GCP, DevOps, infrastructure tools
- AI/ML: machine learning, deep learning, NLP, data science libraries
- Data Analytics: BI tools, data engineering, ETL, visualization
- Networking: protocols, firewalls, network management
- Certifications: AWS Certified, CEH, CISSP, CompTIA, etc.

Return ONLY a comma-separated list of skills. No explanations, no categories, no numbering.
Example: React, Node.js, AWS, Docker, Python, Penetration Testing, Splunk, ISO 27001`
          },
          {
            role: 'user',
            content: resumeText.substring(0, 10000) // Increased limit for complex resumes
          }
        ],
        model: GROQ_MODEL,
        temperature: 0,
        max_tokens: 800
      }),
      EXTRACTION_TIMEOUT,
      'Skill extraction'
    );

    const skills = completion.choices[0].message.content.trim();
    console.log(`✅ Skills extracted successfully (${skills.split(',').length} skills)`);
    return skills;
  } catch (error) {
    console.error('❌ Error extracting skills:', {
      message: error.message,
      code: error.code,
      status: error.status
    });

    // Fallback: regex-based extraction
    console.log('⚠️ Attempting fallback regex-based skill extraction...');
    const fallbackSkills = fallbackSkillExtraction(resumeText);
    if (fallbackSkills) {
      console.log(`✅ Fallback extracted ${fallbackSkills.split(',').length} skills`);
      return fallbackSkills;
    }

    return '';
  }
};

/**
 * Generate job recommendations based on extracted skills
 * Supports diverse career fields
 * @param {string} skills - Comma-separated skills
 * @returns {Promise<string>} Comma-separated job recommendations
 */
const generateJobRecommendations = async (skills) => {
  try {
    if (!skills || skills.trim().length === 0) {
      return 'Software Engineer, Full Stack Developer';
    }

    const groq = getGroqClient();

    const completion = await withTimeout(
      groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Based on the given skills, suggest the best matching job roles.
You MUST suggest a diverse set of job roles within the candidate's field (at least 6-8 distinct, non-repetitive titles).
Avoid repeating similar names (e.g., do not return "Software Engineer, Senior Software Engineer, Junior Software Engineer"). 
Instead, provide distinct specialized roles (e.g., "Frontend Developer, React Developer, UI Engineer, JavaScript Developer").

Examples for domains:
- Cybersecurity: SOC Analyst, GRC Analyst, Vulnerability Analyst, Security Engineer, IAM Specialist, Penetration Tester, Cloud Security Engineer, Compliance Analyst
- Frontend: Frontend Developer, React Developer, UI Engineer, JavaScript Developer, Web Developer
- Backend: Backend Developer, Node.js Developer, API Engineer, Python Developer, Database Administrator
- Cloud/DevOps: Cloud Engineer, DevOps Engineer, SRE, Platform Engineer, Cloud Architect, Systems Administrator
- AI/ML: Machine Learning Engineer, AI Developer, Data Scientist, NLP Engineer, Python Engineer, Computer Vision Engineer
- Data: Data Analyst, Data Engineer, BI Analyst, Analytics Engineer, Data Specialist
- Mixed: Full Stack Developer, Software Engineer, Tech Lead

Return ONLY a comma-separated list of these role titles. Do not include numbering, explanations, bullet points, or markup.
Example output: SOC Analyst, GRC Analyst, Vulnerability Analyst, Security Engineer, Cloud Security Engineer, Penetration Tester`
          },
          {
            role: 'user',
            content: skills.substring(0, 3000)
          }
        ],
        model: GROQ_MODEL,
        temperature: 0.3,
        max_tokens: 500
      }),
      EXTRACTION_TIMEOUT,
      'Job recommendation'
    );

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