const express = require('express');
const router = express.Router();
const { smartApplyUnstop } = require('../automation/applyAssistant');

/**
 * POST /api/apply/unstop
 * Trigger smart application filling for Unstop jobs
 */
router.post('/unstop', async (req, res) => {
  try {
    const { jobLink, resumeFilename, userData } = req.body;

    // Validate required parameters
    if (!jobLink || typeof jobLink !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'jobLink is required and must be a valid URL'
      });
    }

    if (!resumeFilename || typeof resumeFilename !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'resumeFilename is required'
      });
    }

    // Validate URL format
    try {
      new URL(jobLink);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'jobLink must be a valid URL'
      });
    }

    console.log(`📋 Apply request for: ${jobLink}`);

    // Trigger smart apply automation
    const result = await smartApplyUnstop(jobLink, userData, resumeFilename);

    if (result.success) {
      return res.json({
        success: true,
        message: result.message
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('❌ Apply Route Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process application request. Please try again.'
    });
  }
});

module.exports = router;
