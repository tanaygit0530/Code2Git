const githubService = require('../services/githubService');
const aiService = require('../services/aiService');
const config = require('../config');

/**
 * Initiates GitHub OAuth login flow by redirecting to GitHub authorization page.
 */
function handleAuth(req, res) {
  if (!config.github.clientId) {
    return res.status(500).send('GitHub Client ID is not configured on the server.');
  }

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${config.github.clientId}&redirect_uri=${encodeURIComponent(config.github.callbackUrl)}&scope=repo%20user`;
  return res.redirect(githubAuthUrl);
}

/**
 * OAuth callback handler. Exchanges code for token and sends token to frontend window.
 */
async function handleCallback(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing authorization code.');
  }

  try {
    const accessToken = await githubService.exchangeCodeForToken(code);
    const userInfo = await githubService.getUserInfo(accessToken);

    // Return HTML window that posts message to Chrome Extension window or closes itself
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Code2Git AI - GitHub Connected</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #f8fafc; }
            .card { background: #1e293b; padding: 30px; border-radius: 12px; max-width: 450px; margin: 0 auto; border: 1px solid #334155; }
            h2 { color: #38bdf8; }
            p { color: #94a3b8; font-size: 14px; }
            .badge { background: #059669; color: white; padding: 6px 12px; border-radius: 20px; font-weight: bold; display: inline-block; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>GitHub Connected Successfully!</h2>
            <p>Logged in as <strong>@${userInfo.login}</strong></p>
            <div class="badge">✓ Authorization Granted</div>
            <p style="margin-top: 20px;">You can now close this tab and return to Chrome Extension.</p>
          </div>
          <script>
            // Store token in localStorage for popups or post to window opener
            if (window.opener) {
              window.opener.postMessage({
                type: 'CODE2GIT_GITHUB_AUTH_SUCCESS',
                accessToken: '${accessToken}',
                user: ${JSON.stringify({ login: userInfo.login, name: userInfo.name, avatar_url: userInfo.avatar_url })}
              }, '*');
            }
          </script>
        </body>
      </html>
    `;
    return res.send(htmlResponse);
  } catch (error) {
    console.error('[GitHub Callback Error]:', error);
    return res.status(500).send(`Authentication failed: ${error.message}`);
  }
}

/**
 * Checks token validity and gets authenticated user status.
 */
async function getStatus(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ connected: false, error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const user = await githubService.getUserInfo(token);
    return res.json({
      connected: true,
      user: {
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
      }
    });
  } catch (err) {
    return res.status(401).json({ connected: false, error: 'Invalid or expired token' });
  }
}

/**
 * Fetches user repositories.
 */
async function getRepos(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const repos = await githubService.getUserRepos(token);
    return res.json({ success: true, repos });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch GitHub repositories', details: err.message });
  }
}

/**
 * Pushes solution and generated README to GitHub repository.
 */
async function pushSolution(req, res) {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  const { accessToken, repository, problem, submission, readmeContent } = req.body;
  const token = accessToken || tokenFromHeader;

  if (!token) {
    return res.status(401).json({ error: 'GitHub access token is required.' });
  }
  if (!repository) {
    return res.status(400).json({ error: 'Target repository (e.g. "username/repo") is required.' });
  }
  if (!problem || !submission) {
    return res.status(400).json({ error: 'Problem metadata and submission details are required.' });
  }

  try {
    // If README content is not supplied, generate it now
    let finalReadme = readmeContent;
    if (!finalReadme) {
      console.log('[GitHub Controller] Generating README before pushing...');
      finalReadme = await aiService.generateReadme(problem, submission);
    }

    const pushResult = await githubService.pushSolutionToRepo({
      accessToken: token,
      repoFullName: repository,
      problem,
      submission,
      readmeContent: finalReadme,
    });

    return res.json({
      success: true,
      message: 'Solution and README successfully pushed to GitHub.',
      result: pushResult,
    });
  } catch (error) {
    console.error('[GitHub Push Error]:', error);
    return res.status(500).json({
      error: 'Failed to push solution to GitHub.',
      details: error.message,
    });
  }
}

module.exports = {
  handleAuth,
  handleCallback,
  getStatus,
  getRepos,
  pushSolution,
};
