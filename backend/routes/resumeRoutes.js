const express = require('express');
const multer = require('multer');
const PDFParser = require('pdf2json');

const {
  extractSkills,
  generateJobRecommendations
} = require('../services/aiService');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage
});

router.post(
  '/upload',
  upload.single('resume'),

  async (req, res) => {

    try {

      const filePath = req.file.path;

      const pdfParser = new PDFParser();

      pdfParser.on('pdfParser_dataError', errData => {

        console.error(errData.parserError);

        res.status(500).json({
          success: false,
          message: 'PDF parsing failed'
        });
      });

      pdfParser.on('pdfParser_dataReady', async (pdfData) => {

        let extractedText = '';

        pdfData.Pages.forEach(page => {

          page.Texts.forEach(text => {

            text.R.forEach(r => {

              extractedText += decodeURIComponent(r.T) + ' ';
            });
          });
        });

        const skills = await extractSkills(extractedText);
        const jobs = await generateJobRecommendations(skills);

        res.json({
          success: true,
          extractedText,
          skills,
          jobs
        });
      });

      pdfParser.loadPDF(filePath);

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message: 'Resume parsing failed'
      });
    }
  }
);

module.exports = router;