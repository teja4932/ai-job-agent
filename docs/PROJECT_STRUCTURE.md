# AI Job Agent - Complete Project Structure & File Overview

## 📋 Project Summary
**AI Job Agent** is a full-stack web application that helps users find and apply to jobs across multiple platforms. It extracts skills from resumes, recommends matching jobs, and automates job applications.

---

## 📁 Project Root Structure
```
/Users/teja/ai-job-agent/
├── backend/              # Node.js/Express backend
├── frontend/             # React + Vite frontend
├── docs/                 # Documentation
├── .git/                 # Version control
├── .gitignore           # Git ignore rules
└── node_modules/        # Dependencies
```

---

## 🔧 BACKEND Structure

### Root Files: `/backend/`

#### `server.js` (Main Server Entry Point)
- **Purpose**: Initialize Express server, setup routes, middleware
- **Key Components**:
  - Express app setup with CORS enabled
  - Routes mounting:
    - `/api/resume` → Resume upload & analysis
    - `/api/jobs` → Job search from multiple platforms
    - `/api/apply` → Smart job application
  - Server runs on port 8000
- **Dependencies**: express, cors, dotenv

#### `package.json`
- **Purpose**: Define project metadata and dependencies
- **Key Dependencies**:
  - `express` ^5.2.1 - Web framework
  - `axios` ^1.16.1 - HTTP requests
  - `groq-sdk` ^1.2.0 - AI/LLM integration (skill extraction)
  - `mongoose` ^9.6.2 - MongoDB database (if needed)
  - `multer` ^2.1.1 - File upload handling
  - `pdf2json` ^4.0.3 - PDF parsing
  - `playwright` ^1.60.0 - Browser automation
  - `cheerio` ^1.2.0 - Web scraping
  - `dotenv` ^17.4.2 - Environment variables
- **Dev Dependencies**: nodemon ^3.1.14 - Auto-reload on file changes

#### `uploads/` (Directory)
- **Purpose**: Store uploaded resume PDFs
- **Auto-created** when resumes are uploaded via `/api/resume/upload`

---

### Routes: `/backend/routes/`

#### `resumeRoutes.js`
- **Purpose**: Handle resume upload and processing
- **Endpoints**:
  - `POST /api/resume/upload`
    - Accepts PDF file via multer
    - Parses PDF using pdf2json
    - Extracts text content
    - Calls AI service to extract skills & job recommendations
    - Returns: extractedText, skills (comma-separated), jobs, resumeFilename
- **Flow**:
  1. File upload via multipart/form-data
  2. Save to `/uploads/` directory with timestamp
  3. Parse PDF and extract text
  4. Send to `aiService` for skill/job extraction
  5. Return extracted data to frontend

#### `jobRoutes.js`
- **Purpose**: Route job search requests to appropriate platform scrapers
- **Endpoints** (Dynamic creation):
  - `GET /api/jobs/unstop?role=<role>`
  - `GET /api/jobs/internshala?role=<role>`
  - `GET /api/jobs/naukri?role=<role>`
  - `GET /api/jobs/linkedin?role=<role>`
- **Process**:
  - Receives role parameter from query string
  - Calls appropriate search function from automation modules
  - Returns: `{ success: true, jobs: [...] }`

#### `applyRoutes.js`
- **Purpose**: Handle automated job applications
- **Endpoints**:
  - `POST /api/apply/unstop`
    - Receives: jobLink, resumeFilename, userData
    - Calls smartApplyUnstop from applyAssistant
    - Returns: success/failure message
- **Security**: Validates jobLink is provided before proceeding

---

### Services: `/backend/services/`

#### `aiService.js`
- **Purpose**: AI-powered resume analysis using Groq LLM
- **Key Functions**:
  1. `extractSkills(resumeText)`
     - Uses Groq's `llama-3.3-70b-versatile` model
     - Prompt: Extract technical skills as comma-separated list
     - Returns: "React, Node.js, MongoDB, AWS" format
  
  2. `generateJobRecommendations(skills)`
     - Uses Groq LLM to suggest job roles based on extracted skills
     - Returns: Comma-separated job recommendations
- **Configuration**:
  - Uses GROQ_API_KEY from environment variables
  - Temperature: 0 (deterministic output)
  - Model: llama-3.3-70b-versatile

---

### Automation: `/backend/automation/`

#### `jobSearch.js` (Unstop Job Scraper)
- **Purpose**: Scrape jobs from Unstop.com
- **Technology**: Playwright (headless browser automation)
- **Process**:
  1. Launch headless Chrome browser
  2. Navigate to https://unstop.com/jobs
  3. Find search input and enter role
  4. Wait for results to load
  5. Extract job cards using CSS selectors
  6. Filter by priority keywords (software, developer, AI, etc.)
  7. Return max 20 jobs
- **Output**: Array of jobs with title, company, location, stipend, link

#### `internshalaSearch.js` (Internshala Job Scraper)
- **Purpose**: Scrape internships/jobs from Internshala
- **Similar to jobSearch.js** but targets:
  - URL: https://internshala.com/internships/
  - CSS selectors: `.internship_meta`, `.individual_internship`
- **Filters**: Same priority keywords to avoid non-tech roles

#### `linkedinSearch.js` (LinkedIn Job Scraper)
- **Purpose**: Scrape jobs from LinkedIn
- **Special Notes**:
  - LinkedIn is aggressive with bot detection
  - Uses User-Agent headers to bypass basic blocking
  - May hit CAPTCHA/auth-wall (fallback needed)
  - CSS selectors: `.base-card`, `.job-search-card`
- **Output**: Array of jobs with title, company, link

#### `naukriSearch.js` (Naukri Job Scraper)
- **Purpose**: Scrape jobs from Naukri.com
- **Similar structure** to other scrapers
- **Not fully documented in code yet**

#### `applyAssistant.js` (Smart Application Automation)
- **Purpose**: Automated job application filling
- **Function**: `smartApplyUnstop(jobLink, userData, resumeFilename)`
- **Process**:
  1. Launch HEADFUL browser (user can see it)
  2. Navigate to job posting
  3. Click "Apply" or "Register" button
  4. Auto-fill common fields:
     - Name input
     - Email input
     - Phone input
  5. Upload resume from uploads folder
  6. **Stop before submission** - User reviews and submits manually
- **Key Design**: Browser stays open so user can review before submitting
- **Default userData**:
  - name: "Sai Teja"
  - email: "example@gmail.com"
  - phone: "9876543210"

#### `updateScrapers.js`
- **Purpose**: Utility to update/refresh scraper logic
- **Not fully documented yet**

---

## 🎨 FRONTEND Structure

### Root Files: `/frontend/`

#### `package.json`
- **Purpose**: Frontend dependencies and scripts
- **Scripts**:
  - `npm run dev` - Start Vite dev server (port 5174)
  - `npm run build` - Build for production
  - `npm run lint` - Run ESLint checks
  - `npm run preview` - Preview production build
- **Key Dependencies**:
  - `react` ^19.2.6 - UI library
  - `axios` ^1.16.1 - HTTP requests
  - `framer-motion` ^12.38.0 - Animations
  - `lucide-react` ^1.16.0 - Icon library
  - `tailwindcss` ^3.4.19 - Utility CSS
  - `clsx` & `tailwind-merge` - Utility functions
- **Dev**: Vite, ESLint, TypeScript types

#### `vite.config.js`
- **Purpose**: Vite build configuration
- **Includes**: React plugin setup

#### `index.html`
- **Purpose**: HTML entry point
- **Contains**: Root div#root and script import for main.jsx

#### `tailwind.config.js`
- **Purpose**: Tailwind CSS configuration
- **Custom theme colors and utilities**

#### `postcss.config.js`
- **Purpose**: PostCSS configuration for Tailwind

#### `eslint.config.js`
- **Purpose**: ESLint rules for code quality

---

### Source Files: `/frontend/src/`

#### `main.jsx` (React Entry Point)
- **Purpose**: Bootstrap React application
- **Process**:
  1. Import CSS (index.css)
  2. Import App component
  3. Create React root and render App in #root

#### `App.jsx` (Main Component)
- **Purpose**: Core application component with all UI and logic
- **State Variables**:
  - `file` - Selected PDF file
  - `text` - Extracted resume text
  - `skills` - Array of extracted skills
  - `jobs` - Array of recommended jobs
  - `isUploading` - Upload progress state
  - `showResumeText` - Toggle for showing full resume text
  - `showAllJobs` - Toggle to show all jobs
  - `isFetchingJobs` - Loading state for job search
  - `fetchedJobs` - Fetched real jobs from platforms
  - `selectedPlatform` - Selected job platform
  - `resumeFilename` - Saved resume filename
  - `applyingJobLink` - Current job being applied to
  - `applyStatus` - Status message during apply

- **Key Functions**:
  1. `handleUpload()` - Upload resume to backend
     - POST to `/api/resume/upload`
     - Process response with skills & jobs
     - Store resumeFilename
  
  2. `handlePlatformClick(platformName)` - Search jobs on platform
     - GET to `/api/jobs/{platform}?role={role}`
     - Smooth scroll to jobs section
     - Handle "Indeed" as coming soon
  
  3. `handleSmartApply(jobLink)` - Trigger automated apply
     - POST to `/api/apply/unstop` with jobLink, resumeFilename, userData
     - Show status messages

- **UI Sections**:
  1. **Hero Section** - Title, badge, subtitle
  2. **Upload Card** - Drag-drop zone, file picker, upload button
  3. **Results Grid** - Only shown if skills/jobs exist
     - Skills Display - Animated skill chips
     - Jobs Display - Job recommendations
  4. **Platform Buttons** - Unstop, LinkedIn, Internshala
  5. **Fetched Jobs Section** - Real jobs from selected platform
  6. **Resume Text View** - Toggle to see full extracted text

- **Animations**: Uses Framer Motion with:
  - Container variants (staggered children)
  - Item variants (fade-in, slide-up)
  - Skill variants (scale on hover)
  - Job variants (slide animation)

#### `index.css` (Tailwind + Custom Styles)
- **Purpose**: Global styles and Tailwind setup
- **Tailwind Layers**:
  - `@tailwind base` - Reset and defaults
  - `@tailwind components` - Reusable components
  - `@tailwind utilities` - Utility classes
- **Custom Classes**:
  - `.glass-card` - Glassmorphism effect (backdrop blur)
  - `.premium-gradient` - Blue to purple to pink gradient
  - `.text-gradient` - Gradient text effect
- **Dark Theme Colors**:
  - Background: Dark slate (222.2 84% 4.9%)
  - Primary: Blue (217.2 91.2% 59.8%)
  - Secondary: Muted slate (217.2 32.6% 17.5%)

#### `App.css`
- **Purpose**: Component-specific styles
- **Currently**: Styles handled by Tailwind CSS in index.css and App.jsx

#### `/lib/` (Utilities)
- `utils.js` - Helper functions (cn() for classname merging)

#### `/assets/` (Static Files)
- Images, icons, or other static resources

---

## 📚 DOCUMENTATION: `/docs/`

#### `QUICK_START.md`
- Getting started guide
- Frontend/backend setup instructions
- How to use the new premium UI
- Feature overview

#### `IMPLEMENTATION_DETAILS.md`
- Architecture overview
- Component structure breakdown
- Animation configurations
- Framer Motion usage examples
- UI component details

#### `COMPLETION_SUMMARY.md`
- Project completion summary
- Features implemented
- Testing results

#### `UI_IMPROVEMENTS_SUMMARY.md`
- UI enhancement documentation
- Design changes from basic to premium
- Visual improvements made

---

## 🔄 Data Flow

### Resume Upload Flow
```
Frontend (App.jsx)
  ↓ POST /api/resume/upload (FormData with PDF)
Backend (resumeRoutes.js)
  ↓ Save file via multer to /uploads/
  ↓ Parse PDF with pdf2json
  ↓ Extract text content
  ↓ Send to aiService.extractSkills()
aiService (Groq LLM)
  ↓ Use Groq API to extract skills
  ↓ Generate job recommendations
Backend Response
  ↓ { extractedText, skills, jobs, resumeFilename }
Frontend (App.jsx)
  ↓ Update state with skills and jobs
  ↓ Display results with animations
```

### Job Search Flow
```
Frontend (handlePlatformClick)
  ↓ GET /api/jobs/{platform}?role={role}
Backend (jobRoutes.js)
  ↓ Route to appropriate search function
Automation (jobSearch.js, etc.)
  ↓ Launch Playwright browser
  ↓ Navigate to platform
  ↓ Search for role
  ↓ Scrape job listings
  ↓ Filter and return max 20 jobs
Backend Response
  ↓ { success: true, jobs: [...] }
Frontend
  ↓ Display fetched jobs in grid
  ↓ Show apply button on each job
```

### Smart Apply Flow
```
Frontend (handleSmartApply)
  ↓ POST /api/apply/unstop
  ↓ Body: { jobLink, resumeFilename, userData }
Backend (applyRoutes.js)
  ↓ Validate jobLink
  ↓ Call smartApplyUnstop()
Automation (applyAssistant.js)
  ↓ Launch HEADFUL browser (user can see)
  ↓ Navigate to job page
  ↓ Click Apply button
  ↓ Fill name, email, phone
  ↓ Upload resume from /uploads/
  ↓ Wait for user review
  ↓ User manually submits
Backend Response
  ↓ { success: true, message: "..." }
Frontend
  ↓ Show success message
```

---

## 🚀 How to Run

### Setup
```bash
# Backend
cd backend
npm install
# Create .env file with GROQ_API_KEY

# Frontend
cd frontend
npm install
```

### Development
```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Access
- **Frontend**: http://localhost:5174
- **Backend**: http://localhost:8000

---

## 📝 Key Technologies

| Technology | Purpose | Version |
|-----------|---------|---------|
| Node.js/Express | Backend framework | 5.2.1 |
| React | Frontend framework | 19.2.6 |
| Vite | Build tool | 8.0.12 |
| Tailwind CSS | Styling | 3.4.19 |
| Framer Motion | Animations | 12.38.0 |
| Playwright | Browser automation | 1.60.0 |
| Groq SDK | AI/LLM integration | 1.2.0 |
| pdf2json | PDF parsing | 4.0.3 |
| Multer | File uploads | 2.1.1 |
| Axios | HTTP requests | 1.16.1 |

---

## 🔐 Environment Variables Required

Create `.env` file in `/backend/`:
```
GROQ_API_KEY=your_groq_api_key_here
```

---

## ✨ Key Features

1. **Resume Analysis** - Extract skills and get job recommendations using AI
2. **Multi-Platform Job Search** - Search on Unstop, LinkedIn, Internshala, Naukri
3. **Smart Job Applications** - Automated form filling with browser automation
4. **Modern UI** - Premium dark theme with animations and glassmorphism
5. **Responsive Design** - Works on mobile, tablet, and desktop
6. **Real-time Feedback** - Loading states and animations throughout

---

## 🎯 File Count Summary
- **Backend Files**: ~10 (server, routes, services, automation)
- **Frontend Files**: ~8 (components, styles, config)
- **Documentation**: 4 files
- **Configuration**: 6 files (package.json, vite, tailwind, etc.)
- **Total**: ~28 meaningful files
