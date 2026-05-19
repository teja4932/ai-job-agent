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
    if (file.mimetype !== 'application/pdf' && !file.originalname.endsWith('.pdf')) {
      cb(new Error('Only PDF files are allowed'), false);
    } else {
      cb(null, true);
    }
  }
});

/**
 * Normalize extracted PDF text:
 * - Decode URI components
 * - Fix broken spacing from multi-column layouts
 * - Remove excessive whitespace while preserving line structure
 */
const normalizeResumeText = (rawText) => {
  try {
    // Fix common pdf2json encoding artifacts
    let text = rawText
      .replace(/\s{3,}/g, ' ')           // collapse 3+ spaces to 1
      .replace(/([a-z])([A-Z])/g, '$1 $2') // fix camelCase word splits (e.g. "ReactNode" → "React Node")
      .replace(/(\w)-\n(\w)/g, '$1$2')    // rejoin hyphenated line breaks
      .replace(/\n{3,}/g, '\n\n')         // max 2 consecutive newlines
      .trim();
    return text;
  } catch (e) {
    return rawText;
  }
};

/**
 * Extract and reconstruct text from pdf2json page data
 * Handles multi-column layouts by sorting text items by Y then X position
 */
const extractTextFromPages = (pdfData) => {
  let allTextItems = [];

  pdfData.Pages.forEach((page, pageIndex) => {
    if (!page.Texts) return;

    page.Texts.forEach((textItem) => {
      if (!textItem.R || textItem.R.length === 0) return;
      textItem.R.forEach((r) => {
        try {
          const decoded = decodeURIComponent(r.T);
          if (decoded && decoded.trim().length > 0) {
            allTextItems.push({
              text: decoded,
              x: textItem.x || 0,
              y: textItem.y || 0,
              page: pageIndex
            });
          }
        } catch (e) {
          // Skip malformed URI encoded text
        }
      });
    });
  });

  // Sort by page, then Y position (top to bottom), then X (left to right)
  allTextItems.sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    const yDiff = Math.round(a.y) - Math.round(b.y);
    if (Math.abs(yDiff) > 0.5) return yDiff;
    return a.x - b.x;
  });

  // Group items by approximate Y row and join them
  let result = '';
  let lastY = -999;
  let lastPage = -1;

  for (const item of allTextItems) {
    if (item.page !== lastPage) {
      result += '\n\n--- Page ' + (item.page + 1) + ' ---\n';
      lastPage = item.page;
      lastY = -999;
    }

    const yDelta = Math.abs(item.y - lastY);
    if (yDelta > 0.8) {
      // New line
      result += '\n' + item.text;
    } else {
      // Same line — add space separator
      result += ' ' + item.text;
    }
    lastY = item.y;
  }

  return result;
};

/**
 * Safely delete a file without throwing
 */
const safeUnlink = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.error('⚠️ File cleanup error:', e.message);
  }
};

/**
 * POST /api/resume/upload
 * Upload and analyze a resume PDF
 */
router.post('/upload', upload.single('resume'), async (req, res) => {
  // Multer error handler
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded. Please select a PDF resume.'
    });
  }

  const filePath = req.file.path;

  // Overall request timeout — prevent frontend from hanging forever
  const PARSE_TIMEOUT_MS = 45000;
  let responded = false;

  const timeoutHandle = setTimeout(() => {
    if (!responded) {
      responded = true;
      console.error('❌ Resume parse timeout exceeded');
      safeUnlink(filePath);
      return res.status(408).json({
        success: false,
        message: 'Resume parsing timed out. Please try a smaller or simpler PDF.'
      });
    }
  }, PARSE_TIMEOUT_MS);

  try {
    const pdfParser = new PDFParser(null, 1); // suppress pdf2json internal logs

    // Handle PDF parsing errors
    pdfParser.on('pdfParser_dataError', (errData) => {
      if (responded) return;
      responded = true;
      clearTimeout(timeoutHandle);

      console.error('❌ PDF Parse Error:', errData.parserError || errData);
      safeUnlink(filePath);

      return res.status(400).json({
        success: false,
        message: 'Could not parse this PDF. If it is a scanned/image-based PDF, text extraction is not supported. Please use a text-based PDF.'
      });
    });

    // Handle successful PDF parsing
    pdfParser.on('pdfParser_dataReady', async (pdfData) => {
      if (responded) return;

      try {
        const pageCount = pdfData.Pages ? pdfData.Pages.length : 0;
        console.log(`📄 PDF loaded: ${pageCount} pages`);

        // Extract text using position-aware method
        let extractedText = extractTextFromPages(pdfData);

        // Fallback to simple extraction if position-aware returns nothing
        if (!extractedText || extractedText.trim().length < 50) {
          console.log('⚠️ Position-aware extraction returned little text, trying simple mode...');
          let simpleText = '';
          pdfData.Pages.forEach((page) => {
            if (page.Texts) {
              page.Texts.forEach((text) => {
                text.R.forEach((r) => {
                  try {
                    simpleText += decodeURIComponent(r.T) + ' ';
                  } catch (e) {
                    simpleText += r.T + ' ';
                  }
                });
              });
              simpleText += '\n';
            }
          });
          extractedText = simpleText;
        }

        // Normalize the text
        extractedText = normalizeResumeText(extractedText);

        // Check if meaningful text was extracted
        if (!extractedText || extractedText.trim().length < 50) {
          responded = true;
          clearTimeout(timeoutHandle);
          safeUnlink(filePath);

          console.error('❌ Resume text too short — likely scanned/image PDF');
          return res.status(400).json({
            success: false,
            message: 'No readable text could be extracted from this PDF. This may be a scanned or image-based resume. Please use a text-based PDF created with Word, Google Docs, or similar tools.'
          });
        }

        const charCount = extractedText.trim().length;
        console.log(`📄 Resume text extracted: ${charCount} characters, ${pageCount} pages`);

        // Extract skills using AI (with fallback)
        const skills = await extractSkills(extractedText);

        // Generate job recommendations using AI
        const jobRecommendations = await generateJobRecommendations(skills);

        responded = true;
        clearTimeout(timeoutHandle);

        return res.json({
          success: true,
          extractedText: extractedText.trim(),
          skills: skills || '',
          jobs: jobRecommendations || '',
          resumeFilename: req.file.filename,
          filesize: req.file.size,
          pages: pageCount
        });

      } catch (error) {
        if (responded) return;
        responded = true;
        clearTimeout(timeoutHandle);

        console.error('❌ Resume Processing Error:', error.message);
        safeUnlink(filePath);

        return res.status(500).json({
          success: false,
          message: 'Error processing resume. AI extraction failed. Please try again.'
        });
      }
    });

    // Start parsing
    pdfParser.loadPDF(filePath);

  } catch (error) {
    if (responded) return;
    responded = true;
    clearTimeout(timeoutHandle);

    console.error('❌ Upload Route Error:', error.message);
    safeUnlink(filePath);

    return res.status(500).json({
      success: false,
      message: 'Resume upload failed. Please try again.'
    });
  }
});

module.exports = router;