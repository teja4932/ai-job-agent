# 🔒 Security Guidelines - AI Job Agent

This document outlines security best practices and guidelines for the AI Job Agent project.

## Table of Contents
1. [API Key Security](#api-key-security)
2. [Input Validation](#input-validation)
3. [File Upload Security](#file-upload-security)
4. [CORS & Headers](#cors--headers)
5. [Data Privacy](#data-privacy)
6. [Dependencies](#dependencies)
7. [Deployment Security](#deployment-security)
8. [Incident Response](#incident-response)

---

## API Key Security

### Groq API Key
✅ **DO:**
- Store in `.env` file (never in code)
- Use environment variables in production
- Rotate keys regularly (monthly)
- Use restricted API keys if available
- Monitor usage on Groq dashboard

❌ **DON'T:**
- Commit `.env` file to Git
- Expose API keys in logs
- Share API keys in messages/tickets
- Use same key for dev and production
- Log full API requests/responses

### Implementation
```javascript
// ✅ CORRECT
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error('GROQ_API_KEY is not set');
  process.exit(1);
}

// ❌ WRONG
const apiKey = 'your_actual_api_key_here'; // Never do this!
```

---

## Input Validation

### Frontend Validation
```javascript
// ✅ Validate file uploads
const validateFile = (file) => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['application/pdf'];
  
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File too large' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only PDF files allowed' };
  }
  return { valid: true };
};

// ✅ Sanitize URLs
const isValidJobLink = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
```

### Backend Validation
```javascript
// ✅ Validate request parameters
router.get('/api/jobs/:platform', (req, res) => {
  const { role } = req.query;
  
  if (!role || typeof role !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Invalid role parameter'
    });
  }
  
  // Continue processing...
});
```

---

## File Upload Security

### Safe Upload Configuration
```javascript
const multer = require('multer');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    // Generate unique filename to prevent conflicts
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${sanitized}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    // Only accept PDFs
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF files allowed'), false);
    } else {
      cb(null, true);
    }
  }
});
```

### Best Practices
✅ **DO:**
- Validate file type by mimetype AND extension
- Enforce maximum file size
- Sanitize filenames
- Store outside web root if possible
- Implement virus scanning (future)
- Clean up old files periodically

❌ **DON'T:**
- Trust file extension alone
- Allow executable files
- Store in web-accessible directory without protection
- Keep files indefinitely
- Rename to user input

### Cleanup Old Files
```javascript
const fs = require('fs');
const path = require('path');

// Run periodically (e.g., daily)
const cleanupOldFiles = () => {
  const uploadDir = path.join(__dirname, '../uploads');
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  fs.readdirSync(uploadDir).forEach(file => {
    const filePath = path.join(uploadDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtime < oneWeekAgo) {
      fs.unlinkSync(filePath);
    }
  });
};
```

---

## CORS & Headers

### CORS Configuration
```javascript
// ✅ SECURE CORS
const cors = require('cors');

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 3600 // 1 hour
};

app.use(cors(corsOptions));
```

### Security Headers
```javascript
// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});
```

---

## Data Privacy

### User Data Handling
✅ **DO:**
- Collect only necessary data
- Encrypt sensitive data at rest
- Use HTTPS for transmission
- Implement access controls
- Log data access
- Delete data when no longer needed

❌ **DON'T:**
- Store plaintext passwords
- Log personal information
- Share data with third parties without consent
- Keep data indefinitely
- Expose PII in error messages

### Resume Handling
```javascript
// ✅ Secure resume processing
const processResume = async (filePath, userData) => {
  try {
    // 1. Verify file exists and is valid
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    // 2. Extract text (don't retain raw file)
    const text = await extractTextFromPDF(filePath);
    
    // 3. Delete file after processing (if not needed)
    fs.unlinkSync(filePath);
    
    // 4. Process text without storing raw data
    return {
      extractedSkills: await extractSkills(text),
      recommendedRoles: await getRecommendations(text)
    };
  } catch (error) {
    // Log error but don't expose details
    console.error('Resume processing error');
    throw new Error('Processing failed');
  }
};
```

---

## Dependencies

### Regular Updates
```bash
# Check for vulnerabilities
npm audit

# Update dependencies safely
npm update

# Check outdated packages
npm outdated
```

### Lock Files
- Always commit `package-lock.json`
- Don't manually edit lock files
- Review dependency changes before updating

### Trusted Sources Only
✅ Only use packages from npm registry
❌ Never use forked or untrusted versions

---

## Deployment Security

### Environment Variables
```bash
# ✅ Secure environment setup
export GROQ_API_KEY="actual_key_here"
export NODE_ENV="production"
export FRONTEND_URL="https://yourapp.com"

# ❌ Never hardcode
const apiKey = "sk_test_..."; // WRONG!
```

### HTTPS Enforcement
```javascript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

---

## Secure Error Handling

✅ **CORRECT - Secure Error Messages:**
```javascript
try {
  // Process something
} catch (error) {
  console.error('Error details:', error); // Log internally
  
  res.status(500).json({
    success: false,
    message: 'Operation failed. Please try again.' // Generic message
  });
}
```

❌ **WRONG - Information Leakage:**
```javascript
try {
  // Process something
} catch (error) {
  res.status(500).json({
    success: false,
    message: error.message, // Exposes internal details!
    stack: error.stack // Never expose stack traces!
  });
}
```

---

## Code Security

### Never Commit Secrets
```bash
# Check for secrets before committing
git secrets --scan

# Add pre-commit hook to prevent secrets
curl https://raw.githubusercontent.com/awslabs/git-secrets/master/install.ps1 | powershell
```

### Dependencies Security
```json
{
  "//": "Regularly run npm audit",
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix"
  }
}
```

---

## Incident Response

### If API Key Leaked:
1. Immediately rotate the key on Groq console
2. Update `.env` in deployment
3. Check Groq dashboard for unauthorized usage
4. Review application logs
5. Notify users if data was compromised

### If User Data Exposed:
1. Identify scope of exposure
2. Notify affected users
3. Remove exposed data
4. Implement additional controls
5. Document incident

---

## Security Checklist

Before deploying to production:
- [ ] All secrets in `.env` (not in code)
- [ ] `.env` in `.gitignore`
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] File uploads limited by size and type
- [ ] Error messages don't leak info
- [ ] Dependencies are up-to-date (`npm audit`)
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Logs don't contain sensitive data
- [ ] Code reviewed for security issues

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [npm Audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)

---

## Report Security Issues

Please report security issues privately to: `security@aijobagent.com`

Do not open public issues for security vulnerabilities.

---

**Last Updated:** May 17, 2026
