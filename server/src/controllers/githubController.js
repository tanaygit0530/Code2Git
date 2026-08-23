const githubService = require('../services/githubService');
const githubRepositoryService = require('../services/githubRepositoryService');
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
 * OAuth callback handler. Exchanges code for token, ensures DSA-Solutions repository exists,
 * and sends token + repo metadata to frontend window.
 */
async function handleCallback(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing authorization code.');
  }

  try {
    const accessToken = await githubService.exchangeCodeForToken(code);
    
    // Automatically ensure DSA-Solutions repository exists
    const repoSetup = await githubRepositoryService.ensureDSARepository(accessToken);

    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Code2Git AI - GitHub Connected</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #f8fafc; }
            .card { background: #1e293b; padding: 30px; border-radius: 12px; max-width: 480px; margin: 0 auto; border: 1px solid #334155; }
            h2 { color: #38bdf8; margin-bottom: 8px; }
            p { color: #94a3b8; font-size: 14px; margin: 6px 0; }
            .badge { background: #059669; color: white; padding: 6px 14px; border-radius: 20px; font-weight: bold; display: inline-block; margin-top: 10px; font-size: 12px; }
            .repo-box { background: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #334155; font-family: monospace; font-size: 13px; color: #38bdf8; margin: 15px 0; text-align: left; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>GitHub Connected Successfully!</h2>
            <p>Welcome, <strong>@${repoSetup.username}</strong></p>
            <div class="repo-box">
              <div><strong>DSA Repository:</strong> ${repoSetup.repository.fullName}</div>
              <div style="color: #4ade80; margin-top: 4px; font-size: 11px;">✓ ${repoSetup.created ? 'Repository Created' : 'Repository Ready'}</div>
            </div>
            <div class="badge">✓ Authorization Granted</div>
            <p style="margin-top: 20px; font-size: 13px;">You can close this tab and start solving LeetCode problems!</p>
          </div>
          <script>
            // Store token in localStorage for popups or post to window opener
            if (window.opener) {
              window.opener.postMessage({
                type: 'CODE2GIT_GITHUB_AUTH_SUCCESS',
                accessToken: '${accessToken}',
                username: '${repoSetup.username}',
                repository: ${JSON.stringify(repoSetup.repository)}
              }, '*');
            }
          </script>
        </body>
      </html>
    `;
    return res.send(htmlResponse);
  } catch (error) {
    console.error('[GitHub Callback Error]:', error);
    return res.status(500).send(`Authentication or Repository Setup failed: ${error.message}`);
  }
}

/**
 * Checks token validity, gets authenticated user, and ensures DSA-Solutions exists.
 */
async function setupRepo(req, res) {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = req.query.token || req.body.token || tokenFromHeader;

  if (!token) {
    return res.status(401).json({ success: false, error: 'GitHub access token is required.' });
  }

  try {
    const isPrivate = req.body?.private || req.query?.private === 'true';
    const result = await githubRepositoryService.ensureDSARepository(token, isPrivate);
    return res.json(result);
  } catch (err) {
    console.error('[GitHub Setup Repo Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to ensure DSA repository',
      details: err.message,
    });
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
    const user = await githubRepositoryService.getAuthenticatedUser(token);
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

  try {
    // 1. Automatically ensure repository exists for authenticated user
    const repoSetup = await githubRepositoryService.ensureDSARepository(token);
    const targetRepo = repository || repoSetup.repository.fullName;

    // 2. If README content is not supplied, generate it
    let finalReadme = readmeContent;
    if (!finalReadme) {
      console.log('[GitHub Controller] Generating README before pushing...');
      finalReadme = await aiService.generateReadme(problem, submission);
    }

    // 3. Push solution & README
    const pushResult = await githubService.pushSolutionToRepo({
      accessToken: token,
      repoFullName: targetRepo,
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
  setupRepo,
  getStatus,
  getRepos,
  pushSolution,
};
