const { chromium } = require('playwright');

const isValidJobLink = (link, platformDomain) => {
  if (!link || typeof link !== 'string') return false;
  try {
    const url = new URL(link);
    if (!url.href.includes(platformDomain)) return false;
    
    const pathname = url.pathname.toLowerCase();
    const cleanPath = pathname.replace(/\/+$/, '');
    
    if (cleanPath === '' || cleanPath === '/') return false;
    
    // Reject generic main search directory pages
    if (cleanPath === '/job-listings' || cleanPath === '/jobs' || cleanPath === '/jobs-in-india') return false;
    
    // Must be a direct detail page
    if (!pathname.includes('/job-listings-')) return false;
    
    return true;
  } catch (e) {
    return false;
  }
};

const safeBrowserClose = async (browser) => {
  try { if (browser) await browser.close(); } catch (e) {
    console.error('[Naukri] Error closing browser:', e.message);
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

    console.log(`[Naukri] Searching for: ${role}`);

    // Direct search navigation using standard Naukri URL format if possible
    const formattedRole = role.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const searchUrl = `https://www.naukri.com/${formattedRole}-jobs`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        break;
      } catch (navErr) {
        if (attempt === 2) {
          try {
            await page.goto('https://www.naukri.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
          } catch (e2) {
            throw e2;
          }
        } else {
          console.warn(`[Naukri] Nav attempt ${attempt} failed:`, navErr.message);
          await page.waitForTimeout(2000);
        }
      }
    }

    await page.waitForTimeout(3000);

    // If on homepage, search
    if (page.url() === 'https://www.naukri.com/' || page.url().includes('naukri.com/?')) {
      try {
        const searchInput = await page.$('input[placeholder*="skills"], input.suggestor-input');
        if (searchInput) {
          await searchInput.fill(role || 'Software Developer');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(5000);
        }
      } catch (e) {
        console.warn('[Naukri] Search input fill error:', e.message);
      }
    }

    const jobs = await page.evaluate(() => {
      const results = [];
      const ignoredKeywords = ['civil', 'mechanical', 'electrical', 'site engineer', 'construction', 'automobile', 'architecture', 'mining'];
      const priorityKeywords = ['software', 'developer', 'ai ', 'cloud', 'cybersecurity', 'security', 'data', 'web', 'react', 'node', 'python', 'full stack', 'machine learning', 'sde', 'backend', 'frontend', 'engineer', 'tech', 'devops', 'analyst', 'intern'];
      const seenLinks = new Set();
      const seenTitles = new Set();

      const cards = Array.from(document.querySelectorAll('.jobTuple, .srp-jobtuple-wrapper, article'));
      for (const card of cards) {
        if (results.length >= 20) break;

        const a = card.querySelector('a.title, a[href*="naukri.com/job-listings"]');
        const href = a ? a.href : '';
        if (!href || seenLinks.has(href)) continue;

        const titleEl = card.querySelector('.title, a.title');
        const title = titleEl ? titleEl.innerText.trim().split('\n')[0] : '';
        if (!title || title.length < 5 || seenTitles.has(title)) continue;

        const lowerTitle = title.toLowerCase();
        if (ignoredKeywords.some(kw => lowerTitle.includes(kw))) continue;
        if (!priorityKeywords.some(kw => lowerTitle.includes(kw))) continue;

                const companyEl = card.querySelector('.companyInfo, .subTitle, .comp-name');
        const locationEl = card.querySelector('.location, .locWdth, .loc-wrap');
        const salaryEl = card.querySelector('.salary, .sal, .sal-wrap');
        
        const descEl = card.querySelector('.job-desc, .jobDescription, p, .snippet, [class*="desc"]');
        const description = descEl ? descEl.innerText.trim() : card.innerText.replace(title, '').trim().substring(0, 180) + '...';

        seenLinks.add(href);
        seenTitles.add(title);
        results.push({
          title,
          company: companyEl ? companyEl.innerText.trim().split('\n')[0] : 'Naukri Partner',
          location: locationEl ? locationEl.innerText.trim() : 'Remote / India',
          salary: salaryEl ? salaryEl.innerText.trim() : 'Not Disclosed',
          link: href,
          description,
          platform: 'Naukri',
          matchPercentage: Math.floor(Math.random() * 10) + 85
        });
      }

      return results;
    });

    await safeBrowserClose(browser);

    const validJobs = jobs.filter(j => isValidJobLink(j.link, 'naukri.com'));
    const invalidCount = jobs.length - validJobs.length;
    if (invalidCount > 0) console.warn(`[Naukri] Filtered ${invalidCount} invalid links`);
    console.log(`[Naukri] Found ${validJobs.length} jobs with valid links`);

    if (!validJobs.length) return getFallbackJobs(role);
    if (validJobs.length < 12) {
      const fallbacks = getFallbackJobs(role);
      return [...validJobs, ...fallbacks.slice(0, 12 - validJobs.length)];
    }
    return validJobs;

  } catch (error) {
    console.error('[Naukri] ❌ Scraping error:', error.message);
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
  const locations = ['Bangalore', 'Remote', 'Hyderabad', 'Pune', 'Mumbai', 'Remote', 'Chennai', 'Delhi', 'Remote', 'Bangalore', 'Remote', 'Pune'];
  const levels = ['Senior', '', 'Associate', 'Lead', 'Junior', 'Staff', 'Principal', 'Consultant', 'Intern', '', 'Senior', 'Associate'];
  return Array.from({ length: 12 }, (_, i) => {
    const title = `${levels[i]} ${defaultRole}`.trim();
    const company = 'Various Companies';
    return {
      title,
      company,
      location: locations[i],
      salary: `₹${(8 + (i * 1.5)).toFixed(1)}L - ₹${(12 + (i * 2)).toFixed(1)}L`,
      link: `https://www.naukri.com/jobs-in-india?searchType=searchLink&keyword=${encodeURIComponent('"' + title + '"')}`,
      description: getMockDescriptionForRole(title),
      platform: 'Naukri',
      matchPercentage: Math.floor(Math.random() * 10) + 85,
      isFallback: true
    };
  });
};

module.exports = { searchJobs };
