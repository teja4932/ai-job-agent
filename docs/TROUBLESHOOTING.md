# 🔧 Troubleshooting & FAQ

Quick solutions for common issues with AI Job Agent.

## Table of Contents
- [Setup Issues](#setup-issues)
- [Runtime Errors](#runtime-errors)
- [Job Search Issues](#job-search-issues)
- [Resume Upload Issues](#resume-upload-issues)
- [Smart Apply Issues](#smart-apply-issues)
- [Deployment Issues](#deployment-issues)
- [Performance Issues](#performance-issues)

---

## Setup Issues

### "GROQ_API_KEY is not set"
**Problem**: Backend crashes on startup  
**Solution**:
```bash
cd backend
cp .env.example .env
# Edit .env and add your Groq API key from https://console.groq.com
node server.js
```

### "npm: command not found"
**Problem**: Node.js or npm not installed  
**Solution**:
```bash
# Download from https://nodejs.org/ (LTS version)
# Verify installation
node --version   # Should be 18+
npm --version    # Should be 9+
```

### "Port 8000 is already in use"
**Problem**: Another application using backend port  
**Solution**:
```bash
# Option 1: Kill the process using port 8000
# macOS/Linux
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Option 2: Change the port
cd backend
PORT=3000 node server.js
```

### "Port 5174 is already in use"
**Problem**: Another application using frontend port  
**Solution**:
```bash
# Frontend will auto-select next available port
# Or specify custom port
cd frontend
PORT=3000 npm run dev
```

### "Cannot find module 'express'"
**Problem**: Dependencies not installed  
**Solution**:
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

---

## Runtime Errors

### "Cannot POST /api/resume/upload"
**Problem**: Resume endpoint not working  
**Causes**:
- Backend not running
- Incorrect API URL
- Wrong route path

**Solution**:
```bash
# 1. Verify backend is running
curl http://localhost:8000

# 2. Check if endpoint exists
curl -X POST http://localhost:8000/api/resume/upload

# 3. Check backend logs for errors
# Look for error messages in terminal
```

### "TypeError: Cannot read property 'filename' of undefined"
**Problem**: File upload failed  
**Solution**:
- Ensure file is selected before uploading
- Check file size (max 10MB)
- Verify file is valid PDF
- Check `/uploads` directory exists

### "ECONNREFUSED: Connection refused"
**Problem**: Frontend cannot connect to backend  
**Solution**:
```bash
# 1. Verify backend is running
curl http://localhost:8000

# 2. Check in frontend code:
# axios calls should use correct URL
# Default: http://localhost:8000

# 3. If deployed, update API URL:
# VITE_API_BASE_URL=https://your-backend.com
```

---

## Job Search Issues

### "Failed to fetch jobs"
**Problem**: Job search returns error  
**Causes**:
- Platform unreachable
- Invalid role parameter
- Network blocked
- Browser automation failed

**Solution**:
```bash
# 1. Check if platform is accessible
# Try opening in browser:
# https://unstop.com/jobs
# https://linkedin.com/jobs
# https://internshala.com/internships

# 2. Check backend logs for specific error

# 3. Try with different role:
# Instead of "AI Engineer", try "Software Engineer"

# 4. Check internet connection
ping google.com
```

### "No jobs found, showing fallback jobs"
**Problem**: Scraping failed, showing mock data  
**Why**:
- Website structure changed
- Bot detection blocking
- Network timeout
- Playwright browser issue

**Solution**:
- Try different search role
- Wait and retry
- Check if website is accessible
- This is intentional fallback - app won't crash

### "Only getting 1-2 jobs per search"
**Problem**: Job search returning fewer results  
**Why**:
- Website paginated (need scrolling)
- Strong bot detection
- CSS selectors don't match
- Network timeout

**Expected**: Fallback provides 12 jobs if scraping fails

---

## Resume Upload Issues

### "Upload failed" (generic error)
**Problem**: Resume not uploading  
**Checklist**:
- [ ] File is selected
- [ ] File is PDF format
- [ ] File size < 10MB
- [ ] File is valid PDF (not corrupted)
- [ ] Backend is running
- [ ] `/uploads` directory writable

**Solution**:
```bash
# 1. Check file
file your-resume.pdf  # Should show: PDF document

# 2. Check file size
ls -lh your-resume.pdf  # Should be < 10MB

# 3. Verify uploads directory
mkdir -p backend/uploads
chmod 755 backend/uploads

# 4. Test upload manually
curl -F "resume=@your-resume.pdf" http://localhost:8000/api/resume/upload
```

### "PDF parsing failed"
**Problem**: Resume file is not valid PDF  
**Solution**:
- Try opening PDF in Adobe Reader first
- Convert to new PDF (Save As)
- Ensure PDF is not encrypted
- Try different PDF

### "No text could be extracted from PDF"
**Problem**: PDF has no extractable text  
**Causes**:
- PDF is scanned image (no OCR)
- PDF is encrypted
- PDF is corrupted

**Solution**:
- Use text-based PDF, not image scans
- Try re-saving from original application
- Use online converter to recreate PDF

---

## Smart Apply Issues

### "Browser doesn't open"
**Problem**: Smart Apply doesn't launch browser  
**Causes**:
- Playwright not installed
- Browser path invalid
- Job link invalid

**Solution**:
```bash
# 1. Reinstall Playwright
cd backend
npm uninstall playwright
npm install playwright
npx playwright install chromium

# 2. Test if Playwright works
node -e "const {chromium} = require('playwright'); chromium.launch().then(b=>b.close())"
```

### "Form not auto-filling"
**Problem**: Smart Apply doesn't fill form fields  
**Why**:
- Form field names changed
- Job site structure changed
- Selectors don't match

**Expected**: User can manually complete form  
**Solution**: Manually fill remaining fields

### "Resume not uploading in Smart Apply"
**Problem**: Resume doesn't attach to application  
**Causes**:
- Resume file not found
- File input selector doesn't match
- Website blocks file uploads

**Solution**:
```bash
# 1. Verify resume was uploaded first
# Upload resume in UI first before applying

# 2. Check resume file exists
ls -la backend/uploads/

# 3. Manually upload if auto-upload fails
# Drag & drop file into browser form
```

---

## Deployment Issues

### "Vercel build fails"
**Problem**: Frontend build error on Vercel  
**Solution**:
```bash
# Test build locally first
cd frontend
npm run build

# Check for errors in output
# Common issues:
# - Missing env vars (VITE_API_BASE_URL)
# - Import errors
# - Syntax errors

# Fix and redeploy
git push origin main
```

### "Render backend crashes"
**Problem**: Backend fails on Render  
**Solution**:
```bash
# 1. Check Render logs
# Dashboard → Logs tab

# 2. Most common: Missing GROQ_API_KEY
# Render Dashboard → Environment
# Add: GROQ_API_KEY=your_key

# 3. Restart service
# Render Dashboard → Manual Redeploy
```

### "Frontend can't connect to deployed backend"
**Problem**: API calls fail on deployed frontend  
**Solution**:
```bash
# 1. Update environment variable
VITE_API_BASE_URL=https://your-backend.onrender.com

# 2. Verify backend is accessible
curl https://your-backend.onrender.com

# 3. Check CORS settings in backend
# server.js should have correct origin

# 4. Redeploy frontend
git push origin main  # Vercel auto-deploys
```

---

## Performance Issues

### "Resume upload is slow"
**Problem**: AI processing taking long  
**Why**:
- PDF is large (5-10MB)
- Groq API is slow
- Network latency

**Expected**: 5-15 seconds for large resumes  
**Solution**:
- Try smaller PDF
- Check internet speed
- Wait and retry

### "Job search is very slow"
**Problem**: Job scraping taking long  
**Why**:
- Website is slow
- Many pages to scrape
- Bot detection blocking

**Expected**: 10-30 seconds per platform  
**Solution**:
- Expected behavior - websites load slowly
- Server falls back to mock data if timeout
- Try different role

### "AI extraction not working"
**Problem**: Skills/jobs not extracted  
**Causes**:
- Groq API error
- Resume has no standard tech keywords
- API rate limited

**Solution**:
```bash
# 1. Check API key is valid
# Test on Groq console

# 2. Check rate limits
# May need to wait or upgrade plan

# 3. Try resume with clear skills listed
# Good: "React, Node.js, AWS"
# Poor: "various technologies"
```

---

## Getting Help

### Check These First
1. **README.md** - Overview and setup
2. **DEPLOYMENT.md** - Deployment help
3. **SECURITY.md** - Security questions
4. **CONTRIBUTING.md** - Development help
5. **Backend logs** - `npm run dev` output
6. **Frontend DevTools** - Browser console errors

### Debugging Steps
```bash
# 1. Check Node version
node --version  # Should be 18+

# 2. Check dependencies
npm list | grep -E "(express|playwright|groq)"

# 3. Test endpoints manually
curl http://localhost:8000/api/resume/upload

# 4. Enable debug logging
DEBUG=* npm run dev

# 5. Check browser console
# F12 → Console tab → Check for errors
```

### Useful Commands
```bash
# Backend
cd backend
npm install       # Install dependencies
npm run dev       # Start with auto-reload
npm start         # Start normally
npm audit         # Check security vulnerabilities

# Frontend
cd frontend
npm install       # Install dependencies
npm run dev       # Start dev server
npm run build     # Build for production
npm run lint      # Check code style
```

### Report Issues
1. Check if issue already exists
2. Include:
   - OS and Node version
   - Steps to reproduce
   - Error messages (full stack trace)
   - Screenshots if UI related
3. Open GitHub issue with details

---

## FAQ

**Q: Can I use different AI models?**  
A: Currently uses Groq's Llama 3.3. Could be extended to other models.

**Q: Do you store my resume?**  
A: Only temporarily in `/uploads`. Delete after use. Implement auto-cleanup in production.

**Q: Is my job application data private?**  
A: Smart Apply doesn't store application data. Browser data handled by job websites.

**Q: Can I use this without internet?**  
A: No, needs internet for:
- Groq API (AI)
- Job websites (scraping)
- Resume upload

**Q: What's the rate limit?**  
A: No limit set by default. Implement in production (see SECURITY.md).

**Q: Can I contribute?**  
A: Yes! See CONTRIBUTING.md for guidelines.

**Q: Is there a mobile app?**  
A: Not yet, but web is responsive for mobile.

---

## Still Having Issues?

1. Check error messages carefully
2. Review relevant documentation section above
3. Check backend terminal logs
4. Check browser DevTools console
5. Try on different browser
6. Restart backend and frontend
7. Clear browser cache (Ctrl+Shift+Delete)
8. Try with different resume/role
9. Reinstall dependencies (`npm install`)
10. Open issue on GitHub with details

---

**Last Updated**: May 17, 2026
