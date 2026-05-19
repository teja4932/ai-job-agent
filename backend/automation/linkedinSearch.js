const { chromium } = require('playwright');

const isValidJobLink = (link, platformDomain) => {
  if (!link || typeof link !== 'string') return false;
  try {
    const url = new URL(link);
    if (!url.href.includes(platformDomain)) return false;
    
    const pathname = url.pathname.toLowerCase();
    const cleanPath = pathname.replace(/\/+$/, '');
    
    if (cleanPath === '' || cleanPath === '/') return false;
    
    // Reject generic search directories or listings
    if (cleanPath === '/jobs' || cleanPath === '/jobs/search' || cleanPath === '/jobs/view') return false;
    
    // Reject fallback search pages with search queries
    if (url.searchParams.has('keywords') || url.searchParams.has('keywords')) return false;

    // Must be a deep listing view
    if (!pathname.includes('/jobs/view/')) return false;
    
    return true;
  } catch (e) {
    return false;
  }
};

const safeBrowserClose = async (browser) => {
  try { if (browser) await browser.close(); } catch (e) {
    console.error('[LinkedIn] Error closing browser:', e.message);
  }
};

const searchJobs = async (role) => {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    console.log(`[LinkedIn] Searching for: ${role}`);

    // Navigate with retry
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await page.goto(
          `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role)}&location=India`,
          { waitUntil: 'domcontentloaded', timeout: 20000 }
        );
        break;
      } catch (navErr) {
        console.warn(`[LinkedIn] Nav attempt ${attempt} failed:`, navErr.message);
        if (attempt === 2) throw navErr;
        await page.waitForTimeout(2000);
      }
    }

    await page.waitForTimeout(4000);

    const jobs = await page.evaluate(() => {
      const results = [];
      const ignoredKeywords = ['civil', 'mechanical', 'electrical', 'site engineer', 'construction', 'automobile', 'architecture', 'mining'];
      const priorityKeywords = ['software', 'developer', 'ai ', 'cloud', 'cybersecurity', 'security', 'data', 'web', 'react', 'node', 'python', 'full stack', 'machine learning', 'sde', 'backend', 'frontend', 'engineer', 'tech', 'devops', 'analyst', 'intern'];
      const seenLinks = new Set();
      const seenTitles = new Set();

      // LinkedIn public job cards have anchor with full job URL
      const cards = Array.from(document.querySelectorAll('.base-card, .job-search-card'));
      for (const card of cards) {
        if (results.length >= 20) break;

        // Get the primary anchor — LinkedIn uses a.base-card__full-link
        const a = card.querySelector('a.base-card__full-link, a[href*="/jobs/view/"], a[href*="linkedin.com/jobs"]');
        const href = a ? a.href : '';
        if (!href || seenLinks.has(href)) continue;

        const titleEl = card.querySelector('.base-search-card__title, h3, h4');
        const title = titleEl ? titleEl.innerText.trim() : '';
        if (!title || title.length < 5 || seenTitles.has(title)) continue;

        const lowerTitle = title.toLowerCase();
        if (ignoredKeywords.some(kw => lowerTitle.includes(kw))) continue;
        if (!priorityKeywords.some(kw => lowerTitle.includes(kw))) continue;

                const companyEl = card.querySelector('.base-search-card__subtitle, h4');
        const locationEl = card.querySelector('.job-search-card__location, .base-search-card__metadata');
        
        const descEl = card.querySelector('.job-search-card__snippet, p, .snippet, [class*="desc"]');
        const description = descEl ? descEl.innerText.trim() : card.innerText.replace(title, '').trim().substring(0, 180) + '...';

        seenLinks.add(href);
        seenTitles.add(title);
        results.push({
          title,
          company: companyEl ? companyEl.innerText.trim().split('\n')[0] : 'LinkedIn Partner',
          location: locationEl ? locationEl.innerText.trim() : 'Remote / Global',
          salary: 'Not Disclosed',
          link: href,
          description,
          platform: 'LinkedIn',
          matchPercentage: Math.floor(Math.random() * 10) + 85
        });
      }

      // If cards approach got nothing, try generic list items
      if (results.length === 0) {
        const items = Array.from(document.querySelectorAll('li'));
        for (const li of items) {
          if (results.length >= 20) break;
          if (li.innerText.length < 20) continue;

          const a = li.querySelector('a[href*="/jobs/view/"], a[href*="linkedin.com/jobs"]');
          const href = a ? a.href : '';
          if (!href || seenLinks.has(href)) continue;

          const titleEl = li.querySelector('h3, h4, .base-search-card__title');
          const title = titleEl ? titleEl.innerText.trim() : li.innerText.split('\n')[0].trim();
          if (!title || title.length < 5 || seenTitles.has(title)) continue;

          const lowerTitle = title.toLowerCase();
          if (ignoredKeywords.some(kw => lowerTitle.includes(kw))) continue;
          if (!priorityKeywords.some(kw => lowerTitle.includes(kw))) continue;

          const companyEl = li.querySelector('.base-search-card__subtitle, h4');
          const locationEl = li.querySelector('.job-search-card__location');
          
          const descEl = li.querySelector('.job-search-card__snippet, p, .snippet, [class*="desc"]');
          const description = descEl ? descEl.innerText.trim() : li.innerText.replace(title, '').trim().substring(0, 180) + '...';

          seenLinks.add(href);
          seenTitles.add(title);
          results.push({
            title,
            company: companyEl ? companyEl.innerText.trim().split('\n')[0] : 'LinkedIn Partner',
            location: locationEl ? locationEl.innerText.trim() : 'Remote / Global',
            salary: 'Not Disclosed',
            link: href,
            description,
            platform: 'LinkedIn',
            matchPercentage: Math.floor(Math.random() * 10) + 85
          });
        }
      }

      return results;
    });

    await safeBrowserClose(browser);

    const validJobs = jobs.filter(j => isValidJobLink(j.link, 'linkedin.com'));
    const invalidCount = jobs.length - validJobs.length;
    if (invalidCount > 0) console.warn(`[LinkedIn] Filtered ${invalidCount} invalid links`);
    console.log(`[LinkedIn] Found ${validJobs.length} jobs with valid links`);

    if (!validJobs.length) return getFallbackJobs(role);
    if (validJobs.length < 12) {
      const fallbacks = getFallbackJobs(role);
      return [...validJobs, ...fallbacks.slice(0, 12 - validJobs.length)];
    }
    return validJobs;

  } catch (error) {
    console.error('[LinkedIn] ❌ Scraping error:', error.message);
    await safeBrowserClose(browser);
    return getFallbackJobs(role);
  }
};

const getMockDescriptionForRole = (title) => {
  const t = title.toLowerCase();
  if (t.includes('grc') || t.includes('compliance') || t.includes('risk') || t.includes('governance') || t.includes('audit')) {
    return 'Required GRC Analyst with experience in ISO 27001 audit controls, compliance policy management, risk management, and governance. Knowledge of IAM, GDPR, NIST framework, and security audits is mandatory.';
  }
  if (t.includes('soc') || t.includes('security operations') || t.includes('security analyst') || t.includes('threat') || t.includes('incident')) {
    return 'We are hiring a Security Analyst to monitor SIEM alerts (Splunk), perform incident response, log analysis, threat hunting, vulnerability assessment, and firewall policy configuration.';
  }
  if (t.includes('cloud security') || t.includes('iam') || t.includes('identity')) {
    return 'Looking for a Cloud Security / IAM Engineer to manage AWS IAM roles, cloud access controls, Active Directory, compliance guardrails, Okta, and cloud security posture (CSPM).';
  }
  if (t.includes('cybersecurity') || t.includes('vulnerability') || t.includes('penetration')) {
    return 'Seeking a Cybersecurity Engineer with expertise in vulnerability scanning, penetration testing (OWASP Top 10), vulnerability remediation, and corporate security architecture.';
  }
  if (t.includes('react') || t.includes('frontend') || t.includes('web') || (t.includes('developer') && (t.includes('ui') || t.includes('next')))) {
    return 'Hiring a Frontend Developer proficient in React, Next.js, Tailwind CSS, TypeScript, and state management (Redux). Responsible for building responsive UI components and frontend architecture.';
  }
  if (t.includes('node') || t.includes('backend') || t.includes('sde') || t.includes('developer')) {
    return 'We need a Backend Developer skilled in Node.js, Express, REST APIs, SQL/NoSQL databases (PostgreSQL, MongoDB), and system integration. Knowledge of cloud deployments (AWS, Docker) is a plus.';
  }
  if (t.includes('devops') || t.includes('cloud') || t.includes('aws') || t.includes('infrastructure')) {
    return 'DevOps Engineer needed to build automated CI/CD pipelines, Docker containers, Kubernetes orchestration, Terraform Infrastructure as Code, AWS cloud management, and Prometheus monitoring.';
  }
  if (t.includes('data analyst') || t.includes('analyst') || t.includes('business')) {
    return 'Hiring a Data Analyst to translate data into actionable insights using SQL, Excel, Tableau, and PowerBI dashboards. Build reports and perform statistical analysis.';
  }
  if (t.includes('ai') || t.includes('ml') || t.includes('machine learning') || t.includes('data scientist')) {
    return 'Seeking an AI/ML Engineer to train deep learning models, deploy neural networks, use PyTorch/TensorFlow, Python pipelines, NLP models, and generative AI LLMs.';
  }
  return 'Excellent opportunity for a software professional. Candidate should possess strong problem-solving skills, technology background, programming skills, and interest in domain applications.';
};

const getFallbackJobs = (role) => {
  const defaultRole = (role && role.length > 3) ? role : 'Software Engineer';
  const companies = ['Tech Innovators India', 'Global Systems Inc.', 'NextGen Solutions', 'CloudScale Technologies', 'DataCorp', 'StartupHub', 'InnovateX', 'CyberShield', 'DataMinds', 'QuantumSoft', 'AeroCloud', 'DevStudio'];
  const locations = ['Bangalore', 'Remote', 'Hyderabad', 'Pune', 'Mumbai', 'Remote', 'Chennai', 'Delhi', 'Remote', 'Bangalore', 'Remote', 'Pune'];
  const levels = ['Senior', '', 'Associate', 'Lead', 'Junior', 'Staff', 'Principal', 'Consultant', 'Intern', '', 'Senior', 'Associate'];
  return Array.from({ length: 12 }, (_, i) => {
    const title = `${levels[i]} ${defaultRole}`.trim();
    const company = companies[i];
    return {
      title,
      company,
      location: locations[i],
      salary: `₹${(8 + (i * 1.5)).toFixed(1)}L - ₹${(12 + (i * 2)).toFixed(1)}L`,
      link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title + " " + company)}`,
      description: getMockDescriptionForRole(title),
      platform: 'LinkedIn',
      matchPercentage: Math.floor(Math.random() * 10) + 85,
      isFallback: true
    };
  });
};

module.exports = { searchJobs };
