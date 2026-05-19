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
    if (cleanPath === '/jobs' || cleanPath === '/job' || cleanPath === '/opportunity' || cleanPath === '/o') return false;
    
    // Reject fallback search pages with search queries
    if (url.searchParams.has('search') || url.searchParams.has('keyword')) return false;

    // Must be a deep opportunity or job link
    if (!pathname.includes('/o/') && !pathname.includes('/opportunity/') && !pathname.includes('/jobs/')) return false;
    
    return true;
  } catch (e) {
    return false;
  }
};

const safeBrowserClose = async (browser) => {
  try { if (browser) await browser.close(); } catch (e) {
    console.error('[Unstop] Error closing browser:', e.message);
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

    // Navigate with retry
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await page.goto('https://unstop.com/jobs', { waitUntil: 'domcontentloaded', timeout: 20000 });
        break;
      } catch (navErr) {
        console.warn(`[Unstop] Nav attempt ${attempt} failed:`, navErr.message);
        if (attempt === 2) throw navErr;
        await page.waitForTimeout(2000);
      }
    }
    await page.waitForTimeout(3000);

    try {
      const searchInput = await page.$('input[type="text"], input[placeholder*="Search"]');
      if (searchInput) {
        await searchInput.fill(role || 'Software Engineer');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(4000);
      }
    } catch (e) {
      console.warn('[Unstop] Search input error (non-fatal):', e.message);
    }

    const jobs = await page.evaluate(() => {
      const results = [];
      const ignoredKeywords = ['civil', 'mechanical', 'electrical', 'site engineer', 'construction', 'automobile', 'architecture', 'mining'];
      const priorityKeywords = ['software', 'developer', 'ai ', 'cloud', 'cybersecurity', 'security', 'data', 'web', 'react', 'node', 'python', 'full stack', 'mern', 'machine learning', 'sde', 'backend', 'frontend', 'engineer', 'tech', 'devops', 'analyst', 'intern'];
      const seenLinks = new Set();
      const seenTitles = new Set();

      // Primary: look for real opportunity anchors
      const anchors = Array.from(document.querySelectorAll('a[href*="/opportunity/"], a[href*="/jobs/"], a[href*="/job/"]'));
      for (const a of anchors) {
        if (results.length >= 20) break;
        const href = a.href || '';
        if (!href || seenLinks.has(href)) continue;

        const titleEl = a.querySelector('h2, h3, h4, .title') || a;
        const title = titleEl.innerText.split('\n')[0].trim();
        if (!title || title.length < 5 || seenTitles.has(title)) continue;

        const lowerTitle = title.toLowerCase();
        if (ignoredKeywords.some(kw => lowerTitle.includes(kw))) continue;
        if (!priorityKeywords.some(kw => lowerTitle.includes(kw))) continue;

        const card = a.closest('article, .card, li, [class*="card"]') || a;
        const companyEl = card.querySelector('h4, .company, p');
        const locationEl = card.querySelector('.location, .city');
        const descEl = card.querySelector('.description, .summary, p, .details, .job-details, [class*="desc"]');
        const description = descEl ? descEl.innerText.trim() : card.innerText.replace(title, '').trim().substring(0, 180) + '...';

        seenLinks.add(href);
        seenTitles.add(title);
        results.push({
          title,
          company: companyEl ? companyEl.innerText.trim().split('\n')[0] : 'Unstop Partner',
          location: locationEl ? locationEl.innerText.trim() : 'Remote / India',
          salary: 'Not Disclosed',
          link: href,
          description,
          platform: 'Unstop',
          matchPercentage: Math.floor(Math.random() * 10) + 85
        });
      }

      // Fallback: generic cards
      if (results.length === 0) {
        const elements = Array.from(document.querySelectorAll('.job-card, article, .card'));
        for (const el of elements) {
          if (results.length >= 20) break;
          if (el.innerText.length < 20) continue;
          const titleEl = el.querySelector('h2, h3, h4, .title');
          const title = titleEl ? titleEl.innerText.trim() : el.innerText.split('\n')[0].trim();
          if (!title || title.length < 5 || seenTitles.has(title)) continue;
          const lowerTitle = title.toLowerCase();
          if (ignoredKeywords.some(kw => lowerTitle.includes(kw))) continue;
          if (!priorityKeywords.some(kw => lowerTitle.includes(kw))) continue;
          const a = el.querySelector('a[href*="/opportunity/"], a[href*="/job/"], a[href]');
          
          const descEl = el.querySelector('.description, .summary, p, .details, .job-details, [class*="desc"]');
          const description = descEl ? descEl.innerText.trim() : el.innerText.replace(title, '').trim().substring(0, 180) + '...';

          seenTitles.add(title);
          results.push({
            title,
            company: (el.querySelector('h4, .company, p') || {}).innerText?.trim().split('\n')[0] || 'Unstop Partner',
            location: (el.querySelector('.location, .city') || {}).innerText?.trim() || 'Remote / India',
            salary: 'Not Disclosed',
            link: a ? a.href : '',
            description,
            platform: 'Unstop',
            matchPercentage: Math.floor(Math.random() * 10) + 85
          });
        }
      }
      return results;
    });

    await safeBrowserClose(browser);

    const validJobs = jobs.filter(j => isValidJobLink(j.link, 'unstop.com'));
    const invalidCount = jobs.length - validJobs.length;
    if (invalidCount > 0) console.warn(`[Unstop] Filtered ${invalidCount} invalid links`);
    console.log(`[Unstop] Found ${validJobs.length} jobs with valid links`);

    if (!validJobs.length) return getFallbackJobs(role);
    if (validJobs.length < 12) {
      const fallbacks = getFallbackJobs(role);
      return [...validJobs, ...fallbacks.slice(0, 12 - validJobs.length)];
    }
    return validJobs;

  } catch (error) {
    console.error('[Unstop] ❌ Scraping error:', error.message);
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
      link: `https://www.google.com/search?q=site:unstop.com/o/+OR+site:unstop.com/opportunity/+${encodeURIComponent('"' + title + '"')}`,
      description: getMockDescriptionForRole(title),
      platform: 'Unstop',
      matchPercentage: Math.floor(Math.random() * 10) + 85,
      isFallback: true
    };
  });
};

module.exports = { searchJobs };