const express = require('express');
const router = express.Router();

const { searchJobs: searchUnstop } = require('../automation/jobSearch');
const { searchJobs: searchInternshala } = require('../automation/internshalaSearch');
const { searchJobs: searchNaukri } = require('../automation/naukriSearch');
const { searchJobs: searchLinkedIn } = require('../automation/linkedinSearch');

const domainKeywords = {
  cybersecurity: [
    'cybersecurity', 'security', 'cyber', 'soc', 'siem', 'splunk', 'threat', 'incident', 'vulnerability', 'penetration', 'pentest', 'owasp', 'firewall', 'ips', 'ids', 'malware', 'edr', 'soar'
  ],
  grc: [
    'grc', 'compliance', 'governance', 'risk', 'audit', 'iso 27001', 'gdpr', 'hipaa', 'sox', 'nist', 'pci-dss', 'policy', 'policies', 'controls', 'frameworks', 'iam', 'identity', 'access management'
  ],
  cloud: [
    'cloud', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'k8s', 'terraform', 'infrastructure', 'devops', 'serverless', 'ec2', 's3', 'lambda', 'cloud security'
  ],
  aiml: [
    'ai', 'ml', 'machine learning', 'deep learning', 'neural', 'nlp', 'pytorch', 'tensorflow', 'python', 'scikit', 'llm', 'computer vision', 'opencv', 'training', 'inference', 'keras'
  ],
  frontend: [
    'frontend', 'react', 'next.js', 'vue', 'angular', 'javascript', 'typescript', 'tailwind', 'css', 'html', 'webpack', 'ui/ux', 'sass', 'vite', 'redux'
  ],
  backend: [
    'backend', 'node', 'express', 'django', 'flask', 'springboot', 'java', 'golang', 'python', 'ruby', 'php', 'database', 'sql', 'mongodb', 'postgresql', 'api', 'rest', 'graphql'
  ],
  data_analyst: [
    'data analyst', 'analyst', 'sql', 'excel', 'tableau', 'powerbi', 'power bi', 'visualization', 'bi', 'dashboards', 'reporting', 'analytics', 'statistics', 'pandas'
  ],
  devops: [
    'devops', 'ci/cd', 'jenkins', 'github actions', 'docker', 'kubernetes', 'terraform', 'ansible', 'monitoring', 'prometheus', 'grafana', 'bash', 'scripting', 'linux', 'sysadmin'
  ],
  networking: [
    'networking', 'network', 'router', 'switch', 'cisco', 'ccna', 'ccnp', 'dns', 'dhcp', 'ip', 'tcp', 'udp', 'vpn', 'routing', 'switching', 'wan', 'lan', 'packet'
  ]
};

const relatedDomains = [
  ['cybersecurity', 'grc', 'cloud'],
  ['frontend', 'backend', 'devops', 'cloud'],
  ['aiml', 'data_analyst'],
  ['networking', 'devops', 'cloud']
];

const escapeRegExp = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const calculateSmartMatchScore = (job, userSkillsStr, searchRole) => {
  const title = (job.title || '').toLowerCase();
  const desc = (job.description || '').toLowerCase();
  const role = (searchRole || '').toLowerCase();

  // If no user skills provided, return default/fallback scoring
  if (!userSkillsStr || userSkillsStr.trim() === '') {
    return {
      score: Math.floor(Math.random() * 10) + 85,
      matchedSkills: []
    };
  }

  // Parse skills
  const skills = userSkillsStr.split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // 1. Identify user's dominant domain based on skills & search query
  let candidateDomain = 'frontend';
  let maxDomainOverlap = -1;

  Object.entries(domainKeywords).forEach(([domain, kwList]) => {
    let overlap = 0;
    
    // Check skills overlap with domain keywords
    skills.forEach(skill => {
      const sLower = skill.toLowerCase();
      if (kwList.some(kw => sLower.includes(kw) || kw.includes(sLower))) {
        overlap += 2;
      }
    });

    // Check search role overlap with domain keywords
    if (role) {
      kwList.forEach(kw => {
        if (role.includes(kw)) {
          overlap += 5;
        }
      });
    }

    if (overlap > maxDomainOverlap) {
      maxDomainOverlap = overlap;
      candidateDomain = domain;
    }
  });

  // 2. Job Description Relevance (45%)
  let descRelevanceCount = 0;
  const targetKws = domainKeywords[candidateDomain] || [];
  targetKws.forEach(kw => {
    const regex = new RegExp(escapeRegExp(kw), 'i');
    if (regex.test(desc)) {
      descRelevanceCount++;
    }
  });
  const descRelevance = Math.min((descRelevanceCount / 5) * 100, 100);

  // 3. Skills Overlap (30%)
  const matchedSkills = [];
  skills.forEach(skill => {
    const escaped = escapeRegExp(skill);
    const regex = /^[a-zA-Z0-9#+.]+$/.test(skill) 
      ? new RegExp('\\b' + escaped + '\\b', 'i')
      : new RegExp(escaped, 'i');
      
    if (regex.test(desc) || regex.test(title)) {
      matchedSkills.push(skill);
    }
  });
  const skillMatch = Math.min((matchedSkills.length / Math.min(skills.length, 5)) * 100, 100);

  // 4. Domain Similarity (15%)
  let jobDomain = 'frontend';
  let maxJobOverlap = -1;
  Object.entries(domainKeywords).forEach(([domain, kwList]) => {
    let overlap = 0;
    kwList.forEach(kw => {
      const regex = new RegExp(escapeRegExp(kw), 'i');
      if (regex.test(title)) overlap += 3;
      if (regex.test(desc)) overlap += 1;
    });
    if (overlap > maxJobOverlap) {
      maxJobOverlap = overlap;
      jobDomain = domain;
    }
  });

  let domainSimilarity = 0;
  if (jobDomain === candidateDomain) {
    domainSimilarity = 100;
  } else {
    const areRelated = relatedDomains.some(group => group.includes(jobDomain) && group.includes(candidateDomain));
    if (areRelated) {
      domainSimilarity = 65;
    } else {
      domainSimilarity = 20;
    }
  }

  // 5. Job Title Match (10%)
  let titleMatch = 0;
  if (role) {
    const roleWords = role.split(/\s+/).filter(w => w.length > 2);
    let matchingWords = 0;
    roleWords.forEach(word => {
      if (title.includes(word)) {
        matchingWords++;
      }
    });
    titleMatch = roleWords.length > 0 ? (matchingWords / roleWords.length) * 100 : 50;
  } else {
    titleMatch = 80;
  }

  // Final Weighted Score Calculation:
  // Description relevance = 45%, Skills overlap = 30%, Domain similarity = 15%, Title match = 10%
  const finalScore = (descRelevance * 0.45) + (skillMatch * 0.30) + (domainSimilarity * 0.15) + (titleMatch * 0.10);

  const score = Math.max(50, Math.min(99, Math.round(finalScore)));

  return {
    score,
    matchedSkills: Array.from(new Set(matchedSkills)).slice(0, 4) // Deduplicate and limit to 4 skills
  };
};

/**
 * Create an endpoint for job searching
 */
const createEndpoint = (path, searchFunction, platformName) => {
  router.get(path, async (req, res) => {
    try {
      const { role, skills } = req.query;

      // Validate role parameter
      if (!role || typeof role !== 'string' || role.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Role parameter is required and must be a non-empty string'
        });
      }

      console.log(`🔍 Searching for "${role}" jobs on ${platformName}...`);
      
      const rawJobs = await searchFunction(role.trim());

      // Deduplicate and validate jobs by URL to prevent duplicates or homepage fallbacks
      const seenLinks = new Set();
      const uniqueJobs = [];

      for (const job of rawJobs) {
        if (!job.link || typeof job.link !== 'string') continue;
        
        // Clean and normalize link
        const trimmed = job.link.trim();
        const normalized = trimmed.toLowerCase().replace(/\/+$/, '');

        // Reject duplicates
        if (seenLinks.has(normalized)) continue;

        // Reject generic main pages
        if (
          normalized === 'https://unstop.com' ||
          normalized === 'https://unstop.com/jobs' ||
          normalized === 'https://unstop.com/job' ||
          normalized === 'https://unstop.com/opportunity' ||
          normalized === 'https://unstop.com/o' ||
          normalized === 'https://linkedin.com' ||
          normalized === 'https://www.linkedin.com' ||
          normalized === 'https://www.linkedin.com/jobs' ||
          normalized === 'https://www.linkedin.com/jobs/search' ||
          normalized === 'https://internshala.com' ||
          normalized === 'https://internshala.com/internships' ||
          normalized === 'https://internshala.com/jobs' ||
          normalized === 'https://naukri.com' ||
          normalized === 'https://www.naukri.com' ||
          normalized === 'https://www.naukri.com/jobs-in-india' ||
          normalized === 'https://www.naukri.com/job-listings'
        ) {
          continue;
        }

        seenLinks.add(normalized);
        uniqueJobs.push(job);
      }

      // Perform Description-First Smart Scoring and Match Percentage Overwrite
      const scoredJobs = uniqueJobs.map(job => {
        const matchResult = calculateSmartMatchScore(job, skills, role);
        return {
          ...job,
          matchPercentage: matchResult.score,
          matchedSkills: matchResult.matchedSkills
        };
      });

      // Sort by Match Percentage descending
      scoredJobs.sort((a, b) => b.matchPercentage - a.matchPercentage);

      console.log(`✅ Found and ranked ${scoredJobs.length} unique jobs on ${platformName} (Filtered down from ${rawJobs.length})`);

      return res.json({
        success: true,
        platform: platformName,
        role: role,
        jobCount: scoredJobs.length,
        jobs: scoredJobs
      });
    } catch (error) {
      console.error(`❌ Error searching ${platformName}:`, {
        message: error.message,
        role: req.query.role
      });

      return res.status(500).json({
        success: false,
        platform: platformName,
        message: `Failed to search jobs on ${platformName}. Please try again later.`,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
};

// Register endpoints for all platforms
createEndpoint('/unstop', searchUnstop, 'Unstop');
createEndpoint('/internshala', searchInternshala, 'Internshala');
createEndpoint('/naukri', searchNaukri, 'Naukri');
createEndpoint('/linkedin', searchLinkedIn, 'LinkedIn');

module.exports = router;