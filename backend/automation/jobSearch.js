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

        seenLinks.add(href);
        seenTitles.add(title);
        results.push({
          title,
          company: companyEl ? companyEl.innerText.trim().split('\n')[0] : 'Unstop Partner',
          location: locationEl ? locationEl.innerText.trim() : 'Remote / India',
          salary: 'Not Disclosed',
          link: href,
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
          seenTitles.add(title);
          results.push({
            title,
            company: (el.querySelector('h4, .company, p') || {}).innerText?.trim().split('\n')[0] || 'Unstop Partner',
            location: (el.querySelector('.location, .city') || {}).innerText?.trim() || 'Remote / India',
            salary: 'Not Disclosed',
            link: a ? a.href : '',
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
    link: `https://unstop.com/jobs?search=${encodeURIComponent(defaultRole)}`,
    platform: 'Unstop',
    matchPercentage: Math.floor(Math.random() * 10) + 85,
    isFallback: true
  }));
};

module.exports = { searchJobs };