/**
 * Centralized API Configuration
 * All backend API calls use this base URL
 */

const API_BASE_URL = 'https://ai-job-agent-2eew.onrender.com';

export const API_ENDPOINTS = {
  // Resume Upload & Analysis
  RESUME_UPLOAD: `${API_BASE_URL}/api/resume/upload`,
  
  // Job Search by Platform
  JOBS: {
    UNSTOP: `${API_BASE_URL}/api/jobs/unstop`,
    LINKEDIN: `${API_BASE_URL}/api/jobs/linkedin`,
    INTERNSHALA: `${API_BASE_URL}/api/jobs/internshala`,
    NAUKRI: `${API_BASE_URL}/api/jobs/naukri`,
  },
  
  // Smart Apply
  APPLY: {
    UNSTOP: `${API_BASE_URL}/api/apply/unstop`,
  },
};

export default API_BASE_URL;
