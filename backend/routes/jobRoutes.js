const express = require('express');
const router = express.Router();

const { searchJobs: searchUnstop } = require('../automation/jobSearch');
const { searchJobs: searchInternshala } = require('../automation/internshalaSearch');
const { searchJobs: searchNaukri } = require('../automation/naukriSearch');
const { searchJobs: searchLinkedIn } = require('../automation/linkedinSearch');

/**
 * Create an endpoint for job searching
 */
const createEndpoint = (path, searchFunction, platformName) => {
  router.get(path, async (req, res) => {
    try {
      const role = req.query.role;

      // Validate role parameter
      if (!role || typeof role !== 'string' || role.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Role parameter is required and must be a non-empty string'
        });
      }

      console.log(`🔍 Searching for "${role}" jobs on ${platformName}...`);
      
      const jobs = await searchFunction(role.trim());

      console.log(`✅ Found ${jobs.length} jobs on ${platformName}`);

      return res.json({
        success: true,
        platform: platformName,
        role: role,
        jobCount: jobs.length,
        jobs: jobs
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