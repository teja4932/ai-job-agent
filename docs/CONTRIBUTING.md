# Contributing to AI Job Agent

We welcome contributions! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Git
- Groq API Key (for testing)

### Development Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/ai-job-agent.git
cd ai-job-agent

# Backend setup
cd backend
npm install
cp .env.example .env
# Add your GROQ_API_KEY to .env

# Frontend setup
cd ../frontend
npm install

# Start development
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

## 📋 Code Guidelines

### General
- Use consistent naming: camelCase for variables/functions, PascalCase for components
- Add comments for complex logic
- Keep functions focused and small (single responsibility)
- Use meaningful commit messages

### Backend (Node.js/Express)
- Follow Node.js best practices
- Use async/await instead of callbacks
- Add proper error handling with try/catch blocks
- Validate input parameters
- Use descriptive console logs with emojis: ✅, ❌, ⚠️, 📍, etc.
- Structure error responses consistently:
  ```javascript
  {
    success: false,
    message: "User-friendly error message",
    error: "optional debug info"
  }
  ```

### Frontend (React)
- Use functional components with hooks
- Keep components small and reusable
- Use meaningful variable names
- Add PropTypes or TypeScript for component props
- Avoid prop drilling (use context if needed)
- Use Tailwind CSS classes for styling
- Use Framer Motion for animations

### File Organization
```
backend/
├── routes/       (API endpoints)
├── services/     (Business logic)
├── automation/   (Playwright scripts)
└── uploads/      (User files)

frontend/
├── src/
│   ├── App.jsx   (Main component)
│   ├── lib/      (Utilities)
│   └── assets/   (Static files)
```

## 🔍 Testing Before Commit

### Backend
```bash
cd backend

# Test resume upload
curl -X POST -F "resume=@path/to/resume.pdf" http://localhost:8000/api/resume/upload

# Test job search
curl http://localhost:8000/api/jobs/unstop?role=React%20Developer

# Test API health
curl http://localhost:8000
```

### Frontend
```bash
cd frontend

# Run linter
npm run lint

# Verify build succeeds
npm run build

# Check in browser
# http://localhost:5174
```

## 🐛 Bug Reports

When reporting bugs, include:
- Description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, Node version, etc.)
- Screenshots/logs if applicable

## 💡 Feature Requests

When suggesting features:
- Explain the use case
- Describe proposed solution
- List any potential impacts
- Suggest implementation approach

## 📝 Commit Message Format

Use clear, descriptive commit messages:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Build, dependencies

### Examples
```
feat(backend): add Glassdoor job search integration

fix(frontend): resolve resume upload loading state bug

docs(readme): update installation instructions

refactor(services): improve error handling in aiService
```

## 🔄 Pull Request Process

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/yourusername/ai-job-agent.git
   cd ai-job-agent
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow code guidelines above
   - Test thoroughly
   - Update documentation

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat(scope): description of changes"
   ```

5. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open Pull Request**
   - Give clear title and description
   - Link related issues
   - Add before/after screenshots if UI changes
   - Request reviewers

## ✅ PR Checklist

Before submitting a PR, verify:
- [ ] Code follows style guidelines
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests pass locally
- [ ] No breaking changes to existing features
- [ ] Commit messages are clear and descriptive
- [ ] No hardcoded secrets or API keys
- [ ] Changes are minimal and focused

## 🚫 What NOT to do

- ❌ Don't commit .env files or secrets
- ❌ Don't modify unrelated files in same PR
- ❌ Don't break existing functionality
- ❌ Don't remove dependencies without discussion
- ❌ Don't add console.log statements (use proper logging)
- ❌ Don't use var (use const/let)

## 📚 Documentation

When adding features, update:
- [README.md](README.md) - Overview and setup
- [docs/IMPLEMENTATION_DETAILS.md](docs/IMPLEMENTATION_DETAILS.md) - Architecture details
- Code comments - Explain complex logic
- API documentation - New endpoints

### Documentation Template
```markdown
## Feature Name

### Overview
Brief description of the feature.

### Usage
How to use the feature.

### API
If applicable, document endpoints.

### Architecture
Explain how it works internally.

### Examples
Show code examples.
```

## 🤝 Code Review

Be open to feedback during code reviews:
- Respond constructively to comments
- Ask questions if something is unclear
- Update PR based on feedback
- Re-request review after updates

## 🎯 Areas for Contribution

We'd love contributions in these areas:

### High Priority
- [ ] Indeed.com job search integration
- [ ] Error handling improvements
- [ ] Test coverage
- [ ] Documentation

### Medium Priority
- [ ] Glassdoor integration
- [ ] Performance optimizations
- [ ] UI/UX improvements
- [ ] Accessibility enhancements

### Nice to Have
- [ ] Email notifications
- [ ] Interview prep resources
- [ ] Salary negotiation tips
- [ ] Cover letter generation

## ❓ Questions?

- Open an issue for bug reports
- Use Discussions for questions
- Check existing issues before creating new ones

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🙏
