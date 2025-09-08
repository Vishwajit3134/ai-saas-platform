const express = require('express');
const router = express.Router();
const multer = require('multer');
const { generateImage, removeBackground, analyzeResume } = require('../controllers/aiController');
const requireAuth = require('../middleware/authMiddleware'); // Import the auth middleware

// Configure multer for temporary file storage
const upload = multer({ dest: 'uploads/' });

// Apply the authentication middleware to all AI routes defined after this line
router.use(requireAuth);

// @route   POST api/ai/text-to-image
// @desc    Generate an image from a text prompt (Protected)
router.post('/text-to-image', generateImage);

// @route   POST api/ai/remove-background
// @desc    Remove the background from an uploaded image (Protected)
router.post('/remove-background', upload.single('image'), removeBackground);

// @route   POST api/ai/analyze-resume
// @desc    Analyze an uploaded resume file (Protected)
router.post('/analyze-resume', upload.single('resume'), analyzeResume);

module.exports = router;

