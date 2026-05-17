# 🚀 Deployment Guide - AI Job Agent

This guide explains how to deploy the AI Job Agent to production using popular platforms.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Backend Deployment (Render)](#backend-deployment-render)
4. [Environment Configuration](#environment-configuration)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:
- [ ] GitHub account with repository pushed
- [ ] Groq API key ([get one here](https://console.groq.com))
- [ ] Vercel account (free at [vercel.com](https://vercel.com))
- [ ] Render account (free at [render.com](https://render.com))

---

## Frontend Deployment (Vercel)

### Step 1: Prepare for Deployment

```bash
cd frontend
npm run lint
npm run build
```

Verify `dist/` folder is created without errors.

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
npm install -g vercel
vercel
```

Follow the prompts:
- Link to GitHub repository
- Select "frontend" directory
- Choose production environment
- Accept default settings

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Connect your GitHub repository
4. Select the `frontend` directory
5. Click "Deploy"

### Step 3: Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add environment variables:
```
VITE_API_BASE_URL=https://your-backend-url.com
```

### Step 4: Set Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Deployment Confirmation
- Check build logs for errors
- Visit your Vercel URL: `https://your-project.vercel.app`
- Verify resume upload and job search functionality

---

## Backend Deployment (Render)

### Step 1: Prepare Backend

```bash
cd backend
npm install
# Verify server starts
NODE_ENV=production node server.js
```

### Step 2: Create Render Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configuration:

| Setting | Value |
|---------|-------|
| **Name** | ai-job-agent-api |
| **Environment** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Plan** | Free (or Paid) |

### Step 3: Set Environment Variables

In Render Dashboard → Environment:
```
GROQ_API_KEY=your_groq_api_key
NODE_ENV=production
PORT=8000
```

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for build and deployment (5-10 minutes)
3. Render provides a public URL: `https://your-service.onrender.com`

### Step 5: Update Frontend

Update frontend environment variable to point to deployed backend:
```
VITE_API_BASE_URL=https://your-service.onrender.com
```

Redeploy frontend on Vercel.

---

## Environment Configuration

### Frontend (.env)
Create `frontend/.env.production`:
```
VITE_API_BASE_URL=https://your-backend-url.com
```

### Backend (.env)
Create `backend/.env.production`:
```
GROQ_API_KEY=your_groq_api_key_here
NODE_ENV=production
PORT=8000
```

### Security Best Practices

1. **Never commit .env files** - Use `.env.example`
2. **Use environment variables** for all secrets
3. **Rotate API keys** regularly
4. **Enable HTTPS** on all connections
5. **Set up CORS properly** in production:
   ```javascript
   // In server.js
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true
   }));
   ```

---

## Deployment Checklist

Before going live:

### Frontend
- [ ] Remove dev dependencies from production build
- [ ] Test all features on deployment URL
- [ ] Verify API calls point to production backend
- [ ] Check console for errors
- [ ] Test on mobile devices
- [ ] Verify loading states work
- [ ] Test error handling

### Backend
- [ ] GROQ_API_KEY is set
- [ ] Environment is "production"
- [ ] All routes respond correctly
- [ ] Error handling works
- [ ] Logs are proper format
- [ ] CORS is configured
- [ ] Database (if used) is accessible

### Integration
- [ ] Frontend connects to backend
- [ ] Resume upload works end-to-end
- [ ] AI skill extraction works
- [ ] Job search returns results
- [ ] Error messages display correctly
- [ ] Loading states are visible

---

## Monitoring & Maintenance

### View Logs

**Vercel Frontend:**
```bash
vercel logs [--follow]
```

**Render Backend:**
- Dashboard → Logs tab
- Or use: `render logs`

### Common Issues & Solutions

#### 1. "GROQ_API_KEY not found"
```bash
# Render Dashboard → Environment
# Verify GROQ_API_KEY is set correctly
```

#### 2. "Frontend can't connect to backend"
- Check CORS settings in backend
- Verify VITE_API_BASE_URL is correct
- Check network tab in browser DevTools

#### 3. "Build fails on deployment"
```bash
# Run locally first
npm run build
npm start

# Check logs for errors
```

#### 4. "Resume upload fails in production"
- Check file size limits (10MB)
- Verify /uploads directory is writable
- Check multer configuration

### Rollback

If deployment breaks:

**Vercel:**
1. Dashboard → Deployments
2. Select previous working deployment
3. Click "Promote to Production"

**Render:**
1. Dashboard → Logs
2. Click "View Previous Deployment"
3. Redeploy if needed

---

## Performance Optimization

### Frontend
```bash
# Verify build size
npm run build
# Check dist/ folder size
```

### Backend
- Enable gzip compression:
```javascript
const compression = require('compression');
app.use(compression());
```

- Use caching headers:
```javascript
app.use(express.static('public', {
  maxAge: '1h'
}));
```

---

## Custom Domain Setup

### Frontend (Vercel)
1. Go to Project Settings → Domains
2. Add domain: `yourjobagent.com`
3. Update DNS records:
   ```
   Type: CNAME
   Name: www
   Value: yourjobagent.vercel.app
   ```

### Backend (Render)
1. Go to Web Service → Settings
2. Add custom domain
3. Update DNS CNAME record

---

## Scaling

### When to Upgrade

**Frontend:**
- Upgrade if getting 429 (Too Many Requests)
- Vercel Pro includes priority support

**Backend:**
- Upgrade from Free when:
  - Hitting memory limits (512MB)
  - Service spinning down due to inactivity
  - Need SSL/custom domain
  - Need background jobs

```bash
# Monitor usage on Render Dashboard
```

---

## CI/CD Setup (Optional)

Automate deployments with GitHub Actions:

### Backend Auto-Deploy
Create `.github/workflows/deploy-backend.yml`:
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: |
          curl ${{ secrets.RENDER_DEPLOY_HOOK }}
```

### Frontend Auto-Deploy
Vercel automatically deploys on push to main (if connected).

---

## Backup & Recovery

### Backup Uploads
Regular backup of user uploaded resumes:
```bash
# On Render, use persistent disk:
# Mount: /opt/render/project/src/uploads
# Add in render.yaml for persistence
```

### Database Backup (if using MongoDB)
```javascript
// Scheduled backup
const schedule = require('node-schedule');
schedule.scheduleJob('0 2 * * *', () => {
  // Backup logic
});
```

---

## Support & Debugging

### Get Help
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Groq API Docs](https://console.groq.com/docs)

### Enable Debug Mode
```bash
# Backend
DEBUG=* node server.js

# View detailed logs
```

---

## Security Checklist

- [ ] API keys are environment variables only
- [ ] HTTPS is enabled
- [ ] CORS is restricted to frontend domain
- [ ] Rate limiting is configured
- [ ] Input validation is in place
- [ ] Error messages don't leak sensitive info
- [ ] Old files are cleaned up
- [ ] Dependencies are up-to-date

---

## Performance Metrics

Monitor your deployment:

| Metric | Target | Tool |
|--------|--------|------|
| Page Load | < 3s | Vercel Analytics |
| API Response | < 1s | Render logs |
| Uptime | > 99% | Render status |
| Error Rate | < 1% | Logs |

---

## Next Steps

1. Deploy frontend to Vercel
2. Deploy backend to Render
3. Monitor logs and metrics
4. Set up custom domain
5. Configure backups
6. Set up monitoring alerts

---

## Troubleshooting Checklist

If deployment fails:
- [ ] All environment variables set?
- [ ] Correct Node version (18+)?
- [ ] Build succeeds locally?
- [ ] No hardcoded URLs?
- [ ] CORS configured?
- [ ] API key valid?
- [ ] Ports not conflicting?
- [ ] Dependencies installed?

---

**Need help?** Check the main [README.md](README.md) or open an issue on GitHub.
