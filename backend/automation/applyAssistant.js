const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * Smart Apply Assistant - Automates job application filling
 * Opens browser window for user review before submission
 * @param {string} jobLink - URL to job posting
 * @param {Object} userData - User's name, email, phone
 * @param {string} resumeFilename - Uploaded resume filename
 * @returns {Promise<Object>} Result of apply attempt
 */
const smartApplyUnstop = async (jobLink, userData, resumeFilename) => {
  let browser;
  try {
    console.log(`🤖 Starting Smart Apply for: ${jobLink}`);
    
    // Launch browser in visible mode so user can review
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
    });

    // 1. Navigate to job posting
    await page.goto(jobLink, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // 2. Click Apply button
    const applyButtons = await page.$$('button:has-text("Apply"), button:has-text("Register"), a:has-text("Apply"), a:has-text("Register")');
    let clickedApply = false;
    
    for (const btn of applyButtons) {
      if (await btn.isVisible()) {
        try {
          await btn.click();
          clickedApply = true;
          await page.waitForTimeout(3000);
          console.log('✅ Successfully clicked Apply button');
          break;
        } catch (e) {
          // Continue if button click fails - user can click manually
        }
      }
    }
    
    if (!clickedApply) {
      console.log('⚠️ Could not auto-click Apply button. User can click manually.');
    }

    // 3. Auto-fill form fields
    try {
      const nameInputs = await page.$$('input[name*="name" i], input[placeholder*="name" i]');
      if (nameInputs.length > 0 && await nameInputs[0].isVisible()) {
        await nameInputs[0].fill(userData?.name || 'Your Name');
        console.log('✅ Filled name field');
      }
      
      const emailInputs = await page.$$('input[type="email"], input[name*="email" i], input[placeholder*="email" i]');
      if (emailInputs.length > 0 && await emailInputs[0].isVisible()) {
        await emailInputs[0].fill(userData?.email || 'your.email@example.com');
        console.log('✅ Filled email field');
      }
      
      const phoneInputs = await page.$$('input[type="tel"], input[name*="phone" i], input[name*="mobile" i], input[placeholder*="phone" i]');
      if (phoneInputs.length > 0 && await phoneInputs[0].isVisible()) {
        await phoneInputs[0].fill(userData?.phone || '+91-XXXXXXXXXX');
        console.log('✅ Filled phone field');
      }
    } catch (formError) {
      console.log('⚠️ Form filling error (non-fatal):', formError.message);
    }

    // 4. Upload resume if available
    if (resumeFilename) {
      try {
        const resumePath = path.resolve(__dirname, '../uploads/', resumeFilename);
        if (fs.existsSync(resumePath)) {
          const fileInputs = await page.$$('input[type="file"]');
          let resumeUploaded = false;
          
          // Try to find resume-specific input
          for (const fileInput of fileInputs) {
             const html = await fileInput.evaluate(el => el.outerHTML);
             if (html.toLowerCase().includes('resume') || html.toLowerCase().includes('cv')) {
                 await fileInput.setInputFiles(resumePath);
                 resumeUploaded = true;
                 console.log('✅ Uploaded resume to dedicated field');
                 break;
             }
          }
          
          // Fallback: use first file input if no dedicated resume field found
          if (!resumeUploaded && fileInputs.length > 0) {
             await fileInputs[0].setInputFiles(resumePath);
             console.log('✅ Uploaded resume to first file input');
          }
        } else {
          console.log('⚠️ Resume file not found:', resumePath);
        }
      } catch (uploadError) {
        console.log('⚠️ Resume upload error (non-fatal):', uploadError.message);
      }
    }

    // 5. Complete - Leave browser open for user review
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Smart Apply Assistant finished preparing the application');
    console.log('📋 Please review the form in the opened browser window');
    console.log('🔘 When ready, click the Submit button to complete the application');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Keep browser open - user closes it when done
    
    return {
      success: true,
      message: 'Application prepared. Please review in the opened browser window and submit manually.'
    };
    
  } catch (error) {
    console.error('❌ Smart Apply error:', error.message);
    return {
      success: false,
      message: 'Failed to prepare application. See console logs for details.'
    };
  }
};

module.exports = {
  smartApplyUnstop
};
