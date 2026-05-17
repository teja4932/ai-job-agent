const express = require('express');
const multer = require('multer');
const PDFParser = require('pdf2json');
const fs = require('fs');
const path = require('path');

const {
  extractSkills,
  generateJobRecommendations
} = require('../services/aiService');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${sanitized}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype !== 'application/pdf' && !file.originalname.endsWith('.pdf')) {
      cb(new Error('Only PDF files are allowed'), false);
    } else {
      cb(null, true);
    }
  }
});

/**
 * POST /api/resume/upload
 * Upload and analyze a resume PDF
 */
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a PDF resume.'
      });
    }

    const filePath = req.file.path;
    const pdfParser = new PDFParser();

    // Handle PDF parsing errors
    pdfParser.on('pdfParser_dataError', (errData) => {
      console.error('❌ PDF Parse Error:', errData.parserError);
      
      // Clean up failed file
      fs.unlink(filePath, (err) => {
        if (err) console.error('File cleanup error:', err);
      });

      return res.status(400).json({
        success: false,
        message: 'Failed to parse PDF. Please ensure it is a valid PDF file.'
      });
    });

    // Handle successful PDF parsing
    pdfParser.on('pdfParser_dataReady', async (pdfData) => {
      try {
        // Extract text from PDF
        let extractedText = '';
        pdfData.Pages.forEach((page) => {
          if (page.Texts) {
            page.Texts.forEach((text) => {
              text.R.forEach((r) => {
                extractedText += decodeURIComponent(r.T) + ' ';
              });
            });
          }
        });

        if (!extractedText || extractedText.trim().length === 0) {
          fs.unlink(filePath, (err) => {
            if (err) console.error('File cleanup error:', err);
          });
          
          return res.status(400).json({
            success: false,
            message: 'No text could be extracted from the PDF.'
          });
        }

        console.log('📄 Resume uploaded and text extracted');

        // Extract skills using AI
        const skills = await extractSkills(extractedText);
        
        // Generate job recommendations using AI
        const jobs = await generateJobRecommendations(skills);

        // Return results
        return res.json({
          success: true,
          extractedText: extractedText.trim(),
          skills: skills || '',
          jobs: jobs || '',
          resumeFilename: req.file.filename,
          filesize: req.file.size
        });
      } catch (error) {
        console.error('❌ Resume Processing Error:', error.message);
        
        // Clean up file on processing error
        fs.unlink(filePath, (err) => {
          if (err) console.error('File cleanup error:', err);
        });

        return res.status(500).json({
          success: false,
          message: 'Error processing resume. Please try again.'
        });
      }
    });

    // Load PDF for parsing
    pdfParser.loadPDF(filePath);
  } catch (error) {
    console.error('❌ Upload Route Error:', error.message);
    
    // Clean up file on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('File cleanup error:', err);
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Resume upload failed. Please try again.'
    });
  }
});

module.exports = router;