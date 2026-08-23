const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// POST /api/generate-readme
router.post('/generate-readme', aiController.generateReadme);

module.exports = router;
