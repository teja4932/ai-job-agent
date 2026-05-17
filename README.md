# 🤖 AI Job Agent - Intelligent Job Discovery & Application Assistant

> **Automate your job search with AI-powered resume analysis, intelligent job recommendations, and smart application assistance across multiple platforms.**

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-blue)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)]()

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Usage](#-usage) • [Architecture](#-architecture) • [Roadmap](#-roadmap)

</div>

---

## 🎯 Overview

**AI Job Agent** is a full-stack application that revolutionizes your job search experience. It combines cutting-edge AI with web automation to help you find the right job opportunities faster.

### What It Does
- 📄 **Resume Analysis**: Extract skills from your resume using Groq AI
- 🤖 **Smart Recommendations**: Get AI-powered job role suggestions based on your skills
- 🔍 **Multi-Platform Search**: Search jobs on Unstop, LinkedIn, Internshala, and Naukri simultaneously
- 🚀 **Automated Applications**: Pre-fill job application forms and upload your resume automatically
- 💎 **Premium UI**: Modern, responsive dark-themed interface with smooth animations

---

## ✨ Features

### Core Functionality
- **AI-Powered Resume Parsing**
  - Upload PDF resumes and extract text automatically
  - Extract technical skills using Groq LLM
  - Get intelligent job recommendations based on skills

- **Multi-Platform Job Search**
  - Search across Unstop, LinkedIn, Internshala, and Naukri
  - Filter results by tech keywords
  - Display job details with platform information

- **Smart Application Assistant**
  - Auto-fill application forms with user data
  - Automatic resume upload to job portals
  - Browser-based guided application with user review
  - Safe: User must manually submit before job application completes

### User Interface
- **Modern Design**
  - Dark theme with gradient accents (Blue → Purple → Pink)
  - Glassmorphism cards with backdrop blur effects
  - Smooth Framer Motion animations throughout

- **Responsive & Accessible**
  - Mobile-first responsive design
  - Touch-friendly interface
  - Optimized for all screen sizes

- **Real-time Feedback**
  - Upload progress indicators
  - Job search loading states
  - Clear error messages and success notifications

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose | Version |
|-----------|---------|---------|
| **Node.js** | Runtime environment | Latest LTS |
| **Express.js** | Web framework | ^5.2.1 |
| **Groq SDK** | AI/LLM integration | ^1.2.0 |
| **Playwright** | Browser automation | ^1.60.0 |
| **pdf2json** | PDF parsing | ^4.0.3 |
| **Multer** | File upload handling | ^2.1.1 |
| **Axios** | HTTP requests | ^1.16.1 |

### Frontend
| Technology | Purpose | Version |
|-----------|---------|---------|
| **React** | UI framework | ^19.2.6 |
| **Vite** | Build tool | ^8.0.12 |
| **Tailwind CSS** | Utility CSS | ^3.4.19 |
| **Framer Motion** | Animations | ^12.38.0 |
| **Lucide React** | Icons | ^1.16.0 |
| **Axios** | HTTP client | ^1.16.1 |

---

## 📋 Prerequisites

- **Node.js** 18+ and npm 9+
- **Groq API Key** (free from [console.groq.com](https://console.groq.com))
- **Modern Browser** (Chrome, Firefox, Safari, Edge)

---

## 🚀 Installation

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/ai-job-agent.git
cd ai-job-agent
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in backend directory:
```env
GROQ_API_KEY=your_groq_api_key_here
NODE_ENV=development
PORT=8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

---

## 💻 Usage

### Start Backend Server
```bash
cd backend
npm start
# or
node server.js
```

**Output:**
```
✅ AI Job Agent Backend Started
📍 Server: http://localhost:8000
🔧 Environment: development
🤖 AI Model: Groq LLM (llama-3.3-70b-versatile)
```

### Start Frontend Dev Server
```bash
cd frontend
npm run dev
```

**Output:**
```
  ➜  Local:   http://localhost:5174
  ➜  press h to show help
```

### Access Application
Open your browser and navigate to:
```
http://localhost:5174
```

---

## 📖 How to Use

### Step 1: Upload Resume
1. Click **"Choose File"** or drag & drop your PDF resume
2. Click **"Upload & Analyze"**
3. Wait for AI to extract skills

### Step 2: View Results
- **Extracted Skills**: See all detected technical skills
- **Recommended Roles**: Get AI-suggested job positions
- **Resume Text**: Toggle to view full extracted text

### Step 3: Search Jobs
1. Select a platform: **Unstop**, **LinkedIn**, or **Internshala**
2. Application automatically searches for recommended jobs
3. Browse results and find opportunities

### Step 4: Apply to Jobs
1. Click **"Apply"** on any job posting
2. Smart Assistant prepares the application form
3. Review filled information in opened browser
4. Manually submit when satisfied

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)              │
│  ┌────────────────────────────────────────────────────┐ │
│  │  App.jsx (Main Component)                          │ │
│  │  - Resume Upload                                   │ │
│  │  - Skills Display                                  │ │
│  │  - Job Search & Filtering                          │ │
│  │  - Smart Apply Interface                           │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST API
┌──────────────────────▼──────────────────────────────────┐
│              Backend (Node.js + Express)                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Routes Layer                                      │ │
│  │  ├─ /api/resume/upload  (Upload & Parse Resume)  │ │
│  │  ├─ /api/jobs/*         (Platform-Specific Job   │ │
│  │  │                        Search)                 │ │
│  │  └─ /api/apply/unstop   (Smart Application)      │ │
│  └────────────────────────────────────────────────────┘ │
│                       │                                  │
│  ┌────────────────────▼────────────────────────────────┐ │
│  │  Services Layer                                     │ │
│  │  ├─ AI Service (Groq LLM)                          │ │
│  │  │  ├─ Extract Skills                              │ │
│  │  │  └─ Generate Recommendations                    │ │
│  │  └─ Job Search Service (Playwright)                │ │
│  │     ├─ Unstop Search                               │ │
│  │     ├─ LinkedIn Search                             │ │
│  │     ├─ Internshala Search                          │ │
│  │     └─ Naukri Search                               │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼─────┐ ┌────▼─────┐ ┌──────▼──────┐
   │  Groq    │ │ Browser  │ │   File      │
   │   API    │ │Automation│ │  System     │
   └──────────┘ └──────────┘ └─────────────┘
```

### Data Flow

```
Upload Resume
    │
    ▼
Parse PDF (pdf2json)
    │
    ▼
Extract Text
    │
    ▼
Groq LLM: Extract Skills
    │
    ▼
Groq LLM: Recommend Jobs
    │
    ▼
Display Results to User
```

---

## 📁 Project Structure

```
ai-job-agent/
├── backend/
│   ├── server.js                 # Express server entry point
│   ├── package.json
│   ├── .env.example
│   ├── routes/
│   │   ├── resumeRoutes.js      # Resume upload & analysis
│   │   ├── jobRoutes.js         # Job search routing
│   │   └── applyRoutes.js       # Smart apply routing
│   ├── services/
│   │   └── aiService.js         # Groq LLM integration
│   ├── automation/
│   │   ├── jobSearch.js         # Unstop scraper
│   │   ├── linkedinSearch.js    # LinkedIn scraper
│   │   ├── internshalaSearch.js # Internshala scraper
│   │   ├── naukriSearch.js      # Naukri scraper
│   │   └── applyAssistant.js    # Smart apply automation
│   └── uploads/                 # Stored resume files
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main component
│   │   ├── App.css
│   │   ├── index.css            # Global styles + Tailwind
│   │   ├── main.jsx             # React entry point
│   │   ├── lib/
│   │   │   └── utils.js         # Utility functions
│   │   └── assets/              # Images, icons
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   └── package.json
│
├── docs/
│   ├── QUICK_START.md           # Getting started guide
│   ├── IMPLEMENTATION_DETAILS.md# Architecture details
│   ├── COMPLETION_SUMMARY.md    # Project summary
│   └── UI_IMPROVEMENTS_SUMMARY.md
│
├── .gitignore
├── .env.example
├── PROJECT_STRUCTURE.md
└── README.md (this file)
```

---

## 🔐 Environment Variables

### Backend (.env)
```env
# Required - Get from https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# Optional
NODE_ENV=development              # or "production"
PORT=8000                         # Server port
```

### Important Notes
- **Never commit `.env` file** - It contains sensitive API keys
- Copy `.env.example` to `.env` and fill in your values
- The application will fail to start if `GROQ_API_KEY` is missing

---

## 🔄 API Endpoints

### Resume Management
```
POST /api/resume/upload
  Body: FormData (file: PDF)
  Response: {
    success: boolean,
    extractedText: string,
    skills: string (comma-separated),
    jobs: string (comma-separated),
    resumeFilename: string
  }
```

### Job Search
```
GET /api/jobs/unstop?role={role}
GET /api/jobs/internshala?role={role}
GET /api/jobs/linkedin?role={role}
GET /api/jobs/naukri?role={role}

Response: {
  success: boolean,
  platform: string,
  role: string,
  jobCount: number,
  jobs: Array<Job>
}
```

### Smart Apply
```
POST /api/apply/unstop
  Body: {
    jobLink: string,
    resumeFilename: string,
    userData: { name, email, phone }
  }
  Response: {
    success: boolean,
    message: string
  }
```

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

### Backend (Render/Railway)
```bash
# Push code to GitHub
git push origin main

# In Render/Railway:
# - Connect GitHub repository
# - Set GROQ_API_KEY environment variable
# - Deploy
```

### Environment Setup
- Set `NODE_ENV=production` in deployment
- Configure `GROQ_API_KEY` in deployment platform's secrets
- Update frontend API URL to point to deployed backend

---

## 🐛 Troubleshooting

### "GROQ_API_KEY is not set"
- ✅ Create `.env` file in backend folder
- ✅ Add your Groq API key: `GROQ_API_KEY=your_key_here`
- ✅ Restart backend server

### Resume Upload Fails
- ✅ Ensure file is valid PDF format
- ✅ Check file size < 10MB
- ✅ Verify `/uploads` folder exists and is writable
- ✅ Check backend server logs

### Jobs Not Searching
- ✅ Verify internet connection
- ✅ Check if job platforms are accessible
- ✅ Try different role keywords
- ✅ Check backend console for errors

### Smart Apply Not Working
- ✅ Ensure resume file was uploaded successfully
- ✅ Check job link is valid and accessible
- ✅ Verify Playwright browser launches
- ✅ Try on different job platform

### Frontend Not Connecting to Backend
- ✅ Verify backend is running on `http://localhost:8000`
- ✅ Check CORS settings in backend
- ✅ Check browser console for network errors
- ✅ Verify API endpoint URLs match backend

---

## 🗺️ Roadmap

### Phase 1: ✅ Complete
- [x] Resume upload & AI analysis
- [x] Multi-platform job search
- [x] Smart application filling
- [x] Premium UI implementation
- [x] Security hardening

### Phase 2: 🔜 Coming Soon
- [ ] Indeed.com integration
- [ ] Glassdoor integration
- [ ] Application tracking dashboard
- [ ] Interview preparation module
- [ ] Salary negotiation tips

### Phase 3: 🌟 Future
- [ ] Machine learning job matching
- [ ] LinkedIn automation (with user auth)
- [ ] Email notifications for new jobs
- [ ] Portfolio generation from resume
- [ ] AI-powered cover letter generation

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Style
- Use consistent formatting (Prettier/ESLint)
- Add comments for complex logic
- Test changes before submitting PR
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 💬 Support

- 📧 Email: support@aijobagent.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/ai-job-agent/issues)
- 💡 Discussions: [GitHub Discussions](https://github.com/yourusername/ai-job-agent/discussions)

---

## 🙏 Acknowledgments

- [Groq](https://groq.com) - Fast AI inference
- [Playwright](https://playwright.dev) - Browser automation
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [React](https://react.dev) - UI framework

---

## 📊 Project Stats

- **Backend Files**: 10+
- **Frontend Components**: 8+
- **Supported Platforms**: 4 (Unstop, LinkedIn, Internshala, Naukri)
- **AI Model**: Groq Llama 3.3 70B
- **Lines of Code**: 5000+
- **Production Ready**: ✅ Yes

---

<div align="center">

**[⬆ back to top](#-ai-job-agent---intelligent-job-discovery--application-assistant)**

Made with ❤️ by [Your Name/Team]

⭐ If you found this project helpful, please consider giving it a star!

</div>
