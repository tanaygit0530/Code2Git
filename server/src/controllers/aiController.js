const aiService = require('../services/aiService');

/**
 * Controller handling README generation API requests.
 */
async function generateReadme(req, res) {
  try {
    const { problem, submission } = req.body;

    if (!problem || !submission) {
      return res.status(400).json({
        error: 'Invalid payload. "problem" and "submission" objects are required.'
      });
    }

    if (!submission.code) {
      return res.status(400).json({
        error: 'Submission code is required to generate README.'
      });
    }

    console.log(`[AI Controller] Generating README for problem: "${problem.title || 'Untitled'}" (${submission.language || 'cpp'})`);

    const readmeMarkdown = await aiService.generateReadme(problem, submission);

    return res.status(200).json({
      success: true,
      readme: readmeMarkdown,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI Controller Error]:', error);
    return res.status(500).json({
      error: 'Failed to generate README.',
      details: error.message
    });
  }
}

module.exports = {
  generateReadme,
};
