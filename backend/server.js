require('dotenv').config();
const express = require('express');
const cors = require('cors');
const resumeRoutes = require('./routes/resumeRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applyRoutes = require('./routes/applyRoutes');

// Validate required environment variables
if (!process.env.GROQ_API_KEY) {
  console.error('❌ CRITICAL ERROR: GROQ_API_KEY is not set in .env file');
  console.error('Please add GROQ_API_KEY to your .env file. See .env.example for reference.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/resume', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/apply', applyRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'AI Job Agent Backend Running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    error: NODE_ENV === 'production' ? undefined : err
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ AI Job Agent Backend Started`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${NODE_ENV}`);
  console.log(`🤖 AI Model: Groq LLM (llama-3.3-70b-versatile)`);
});