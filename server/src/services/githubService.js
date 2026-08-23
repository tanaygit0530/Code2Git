const axios = require('axios');
const config = require('../config');
const { getPrimaryCategory, sanitizeFolderName } = require('../utils/categoryDetector');

/**
 * Maps common programming language names to file extensions.
 */
const LANGUAGE_EXTENSIONS = {
  cpp: 'cpp',
  'c++': 'cpp',
  c: 'c',
  javascript: 'js',
  js: 'js',
  typescript: 'ts',
  ts: 'ts',
  python: 'py',
  python3: 'py',
  py: 'py',
  java: 'java',
  csharp: 'cs',
  'c#': 'cs',
  cs: 'cs',
  golang: 'go',
  go: 'go',
  rust: 'rs',
  rs: 'rs',
  kotlin: 'kt',
  kt: 'kt',
  swift: 'swift',
  php: 'php',
  ruby: 'rb',
  scala: 'scala',
};

function getExtensionForLanguage(lang) {
  if (!lang) return 'cpp';
  const cleanLang = lang.toLowerCase().trim();
  return LANGUAGE_EXTENSIONS[cleanLang] || 'cpp';
}

class GitHubService {
  /**
   * Exchanges GitHub OAuth code for access token.
   */
  async exchangeCodeForToken(code) {
    if (!config.github.clientId || !config.github.clientSecret) {
      throw new Error('GitHub OAuth credentials are not configured on the backend server.');
    }

    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
        redirect_uri: config.github.callbackUrl,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    if (response.data && response.data.access_token) {
      return response.data.access_token;
    }
    throw new Error(response.data.error_description || 'Failed to exchange GitHub OAuth code for access token.');
  }

  /**
   * Fetches authenticated user info.
   */
  async getUserInfo(accessToken) {
    const res = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Code2Git-AI-App',
      },
    });
    return res.data;
  }

  /**
   * Fetches user repositories.
   */
  async getUserRepos(accessToken) {
    const res = await axios.get('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Code2Git-AI-App',
      },
    });
    return res.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      html_url: repo.html_url,
      default_branch: repo.default_branch,
    }));
  }

  /**
   * Gets existing file SHA if file already exists in repo.
   */
  async getFileSha(accessToken, owner, repo, path, branch = 'main') {
    try {
      const res = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Code2Git-AI-App',
          },
        }
      );
      return res.data.sha;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return null; // File does not exist
      }
      throw err;
    }
  }

  /**
   * Creates or updates a file in GitHub repository.
   */
  async createOrUpdateFile(accessToken, owner, repo, path, content, commitMessage, branch = 'main') {
    const sha = await this.getFileSha(accessToken, owner, repo, path, branch);
    const contentBase64 = Buffer.from(content).toString('base64');

    const body = {
      message: commitMessage,
      content: contentBase64,
      branch: branch,
    };
    if (sha) {
      body.sha = sha;
    }

    const res = await axios.put(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Code2Git-AI-App',
        },
      }
    );

    return res.data;
  }

  /**
   * Pushes LeetCode solution and README to GitHub repository.
   */
  async pushSolutionToRepo({ accessToken, repoFullName, problem, submission, readmeContent }) {
    if (!accessToken) {
      throw new Error('Missing GitHub access token.');
    }
    if (!repoFullName) {
      throw new Error('Target repository is not specified.');
    }

    const [owner, repo] = repoFullName.split('/');
    if (!owner || !repo) {
      throw new Error('Invalid repository full name format. Expected "owner/repo".');
    }

    // 1. Get repository details to know default branch
    const repoInfoRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Code2Git-AI-App',
      },
    });
    const defaultBranch = repoInfoRes.data.default_branch || 'main';

    // 2. Determine category & folder structure
    const category = getPrimaryCategory(problem.topics, problem.pattern);
    const problemFolder = sanitizeFolderName(problem.title);
    const ext = getExtensionForLanguage(submission.language);

    const basePath = `${category}/${problemFolder}`;
    const solutionPath = `${basePath}/solution.${ext}`;
    const readmePath = `${basePath}/README.md`;

    // 3. Determine if existing solution exists
    const existingSolutionSha = await this.getFileSha(accessToken, owner, repo, solutionPath, defaultBranch);
    const isUpdate = !!existingSolutionSha;

    const commitPrefix = isUpdate ? 'Update LeetCode' : 'Add LeetCode';
    const commitMsg = `${commitPrefix}: ${problem.title || 'Solution'}`;

    // 4. Create/update solution file
    await this.createOrUpdateFile(
      accessToken,
      owner,
      repo,
      solutionPath,
      submission.code || '',
      `${commitMsg} - Code`,
      defaultBranch
    );

    // 5. Create/update README.md
    const readmeRes = await this.createOrUpdateFile(
      accessToken,
      owner,
      repo,
      readmePath,
      readmeContent || '',
      `${commitMsg} - README`,
      defaultBranch
    );

    return {
      success: true,
      repository: repoFullName,
      branch: defaultBranch,
      folderPath: basePath,
      solutionPath,
      readmePath,
      commitSha: readmeRes.commit.sha,
      commitUrl: readmeRes.commit.html_url,
      isUpdate,
    };
  }
}

module.exports = new GitHubService();
