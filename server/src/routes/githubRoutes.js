const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');

// GitHub OAuth routes
router.get('/auth', githubController.handleAuth);
router.get('/callback', githubController.handleCallback);

// Automatic Repository Setup & Status APIs
router.get('/setup', githubController.setupRepo);
router.post('/setup', githubController.setupRepo);
router.get('/status', githubController.getStatus);
router.get('/repos', githubController.getRepos);
router.post('/push', githubController.pushSolution);

module.exports = router;
