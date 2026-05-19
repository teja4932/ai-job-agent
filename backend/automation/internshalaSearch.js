const { chromium } = require('playwright');

const isValidJobLink = (link, platformDomain) => {
  if (!link || typeof link !== 'string') return false;
  try {
    const url = new URL(link);
    if (!url.href.includes(platformDomain)) return false;
    
    const pathname = url.pathname.toLowerCase();
    const cleanPath = pathname.replace(/\/+$/, '');
    
    if (cleanPath === '' || cleanPath === '/') return false;
    
    // Reject generic listing directories
    if (cleanPath === '/internships' || cleanPath === '/jobs' || cleanPath === '/internship' || cleanPath === '/job') return false;
    
    // Reject fallback search pages with search queries
    if (url.searchParams.has('search')) return false;

    // Must be a direct detail page
    if (!pathname.includes('/internship/detail/') && !pathname.includes('/job/detail/')) return false;
    
    return true;
  } catch (e) {
    return false;
  }
};

const safeBrowserClose = async (browser) => {
  try { if (browser) await browser.close(); } catch (e) {
    console.error('[Internshala] Error closing browser:', e.message);
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

    console.log(`[Internshala] Searching for: ${role}`);

    // Build search URL directly to avoid search input issues
    const searchUrl = `https://internshala.com/internships/${encodeURIComponent(role.toLowerCase().replace(/\s+/g, '-'))}-internship/`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        break;
      } catch (navErr) {
        // Fallback to generic internships page on second attempt
        if (attempt === 2) {
          try {
            await page.goto('https://internshala.com/internships/', { waitUntil: 'domcontentloaded', timeout: 20000 });
          } catch (e2) {
            throw e2;
          }
        } else {
          console.warn(`[Internshala] Nav attempt ${attempt} failed:`, navErr.message);
          await page.waitForTimeout(2000);
        }
      }
    }

    await page.waitForTimeout(3000);

    // Try search input as secondary approach
    try {
      const searchInput = await page.$('input[type="text"], input[placeholder*="Search"], #search-super-bar-id');
      if (searchInput) {
        await searchInput.fill(role || 'Software Engineering');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(4000);
      }
    } catch (e) {
      console.warn('[Internshala] Search input error (non-fatal):', e.message);
    }

    const jobs = await page.evaluate(() => {
      const results = [];
      const ignoredKeywords = ['civil', 'mechanical', 'electrical', 'site engineer', 'construction', 'automobile', 'architecture', 'mining'];
      const priorityKeywords = ['software', 'developer', 'ai ', 'cloud', 'cybersecurity', 'security', 'data', 'web', 'react', 'node', 'python', 'full stack', 'machine learning', 'sde', 'backend', 'frontend', 'engineer', 'tech', 'devops', 'analyst', 'intern', 'research', 'design'];
      const seenLinks = new Set();
      const seenTitles = new Set();

      // Internshala individual internship cards
      const cards = Array.from(document.querySelectorAll('.individual_internship, .internship_meta, [id^="internshipCard"]'));
      for (const card of cards) {
        if (results.length >= 20) break;

        // Internshala links typically on .heading_4_5 or a[href*="/internship/detail"]
        const a = card.querySelector('a.view_detail_button, a[href*="/internship/detail"], a[href*="/internships/"]');
        const href = a ? (a.href.startsWith('http') ? a.href : 'https://internshala.com' + a.getAttribute('href')) : '';
        if (!href || seenLinks.has(href)) continue;

        const titleEl = card.querySelector('.heading_4_5, h2, h3, .profile');
        const title = titleEl ? titleEl.innerText.trim().split('\n')[0] : '';
        if (!title || title.length < 5 || seenTitles.has(title)) continue;

        const lowerTitle = title.toLowerCase();
        if (ignoredKeywords.some(kw => lowerTitle.includes(kw))) continue;
        if (!priorityKeywords.some(kw => lowerTitle.includes(kw))) continue;

                const companyEl = card.querySelector('.heading_6, .company_name, h4');
        const locationEl = card.querySelector('#location_names, .location_link, .location');
        const stipendEl = card.querySelector('.stipend, .salary');
        
        const descEl = card.querySelector('.job-snippet, .description, p, .details, [class*="desc"]');
        const description = descEl ? descEl.innerText.trim() : card.innerText.replace(title, '').trim().substring(0, 180) + '...';

        seenLinks.add(href);
        seenTitles.add(title);
        results.push({
          title,
          company: companyEl ? companyEl.innerText.trim().split('\n')[0] : 'Internshala Partner',
          location: locationEl ? locationEl.innerText.trim() : 'Remote / India',
          salary: stipendEl ? stipendEl.innerText.trim() : 'Stipend Undisclosed',
          link: href,
          description,
          platform: 'Internshala',
          matchPercentage: Math.floor(Math.random() * 10) + 85
        });
      }

      // Fallback: generic cards/articles
      if (results.length === 0) {
        const elements = Array.from(document.querySelectorAll('article, .card, .job_meta'));
        for (const el of elements) {
          if (results.length >= 20) break;
          if (el.innerText.length < 20) continue;

          const a = el.querySelector('a[href*="/internship/"], a[href*="/jobs/"]');
          const href = a ? (a.href.startsWith('http') ? a.href : 'https://internshala.com' + a.getAttribute('href')) : '';
          if (!href || seenLinks.has(href)) continue;

          const titleEl = el.querySelector('.heading_4_5, h2, h3, .title');
          const title = titleEl ? titleEl.innerText.trim().split('\n')[0] : el.innerText.split('\n')[0].trim();
          if (!title || title.length < 5 || seenTitles.has(title)) continue;

          const lowerTitle = title.toLowerCase();
          if (ignoredKeywords.some(kw => lowerTitle.includes(kw))) continue;
          if (!priorityKeywords.some(kw => lowerTitle.includes(kw))) continue;

          const descEl = el.querySelector('.job-snippet, .description, p, .details, [class*="desc"]');
          const description = descEl ? descEl.innerText.trim() : el.innerText.replace(title, '').trim().substring(0, 180) + '...';

          seenLinks.add(href);
          seenTitles.add(title);
          results.push({
            title,
            company: (el.querySelector('.heading_6, .company_name, h4') || {}).innerText?.trim().split('\n')[0] || 'Internshala Partner',
            location: (el.querySelector('#location_names, .location_link') || {}).innerText?.trim() || 'Remote / India',
            salary: (el.querySelector('.stipend, .salary') || {}).innerText?.trim() || 'Stipend Undisclosed',
            link: href,
            description,
            platform: 'Internshala',
            matchPercentage: Math.floor(Math.random() * 10) + 85
          });
        }
      }

      return results;
    });

    await safeBrowserClose(browser);

    const validJobs = jobs.filter(j => isValidJobLink(j.link, 'internshala.com'));
    const invalidCount = jobs.length - validJobs.length;
    if (invalidCount > 0) console.warn(`[Internshala] Filtered ${invalidCount} invalid links`);
    console.log(`[Internshala] Found ${validJobs.length} jobs with valid links`);

    if (!validJobs.length) return getFallbackJobs(role);
    if (validJobs.length < 12) {
      const fallbacks = getFallbackJobs(role);
      return [...validJobs, ...fallbacks.slice(0, 12 - validJobs.length)];
    }
    return validJobs;

  } catch (error) {
    console.error('[Internshala] ❌ Scraping error:', error.message);
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
      link: `https://internshala.com/internships/keywords-${encodeURIComponent(title + " " + company)}`,
      description: getMockDescriptionForRole(title),
      platform: 'Internshala',
      matchPercentage: Math.floor(Math.random() * 10) + 85,
      isFallback: true
    };
  });
};

module.exports = { searchJobs };
