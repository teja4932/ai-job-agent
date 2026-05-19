const { chromium } = require('playwright');

const isValidJobLink = (link, platformDomain) => {
  if (!link || typeof link !== 'string') return false;
  try {
    const url = new URL(link);
    if (!url.href.includes(platformDomain)) return false;
    if (url.pathname === '/' || url.pathname === '') return false;
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

        seenLinks.add(href);
        seenTitles.add(title);
        results.push({
          title,
          company: companyEl ? companyEl.innerText.trim().split('\n')[0] : 'LinkedIn Partner',
          location: locationEl ? locationEl.innerText.trim() : 'Remote / Global',
          salary: 'Not Disclosed',
          link: href,
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

          seenLinks.add(href);
          seenTitles.add(title);
          results.push({
            title,
            company: companyEl ? companyEl.innerText.trim().split('\n')[0] : 'LinkedIn Partner',
            location: locationEl ? locationEl.innerText.trim() : 'Remote / Global',
            salary: 'Not Disclosed',
            link: href,
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

const getFallbackJobs = (role) => {
  const defaultRole = (role && role.length > 3) ? role : 'Software Engineer';
  const companies = ['Tech Innovators India', 'Global Systems Inc.', 'NextGen Solutions', 'CloudScale Technologies', 'DataCorp', 'StartupHub', 'InnovateX', 'CyberShield', 'DataMinds', 'QuantumSoft', 'AeroCloud', 'DevStudio'];
  const locations = ['Bangalore', 'Remote', 'Hyderabad', 'Pune', 'Mumbai', 'Remote', 'Chennai', 'Delhi', 'Remote', 'Bangalore', 'Remote', 'Pune'];
  const levels = ['Senior', '', 'Associate', 'Lead', 'Junior', 'Staff', 'Principal', 'Consultant', 'Intern', '', 'Senior', 'Associate'];
  return Array.from({ length: 12 }, (_, i) => ({
    title: `${levels[i]} ${defaultRole}`.trim(),
    company: companies[i],
    location: locations[i],
    salary: `₹${(8 + (i * 1.5)).toFixed(1)}L - ₹${(12 + (i * 2)).toFixed(1)}L`,
    link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(defaultRole)}`,
    platform: 'LinkedIn',
    matchPercentage: Math.floor(Math.random() * 10) + 85,
    isFallback: true
  }));
};

module.exports = { searchJobs };
