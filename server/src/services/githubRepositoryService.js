const axios = require('axios');

/**
 * Service to manage automatic GitHub repository checking and creation.
 */
class GitHubRepositoryService {
  /**
   * Fetches authenticated user info from GitHub.
   * @param {string} accessToken 
   * @returns {Promise<Object>} GitHub User Object
   */
  async getAuthenticatedUser(accessToken) {
    if (!accessToken) {
      throw new Error('Access token is required to get authenticated user.');
    }

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
   * Checks if a repository exists for the authenticated user.
   * @param {string} accessToken 
   * @param {string} owner 
   * @param {string} repoName 
   * @returns {Promise<Object|null>} Repository details object or null if not found
   */
  async getUserRepository(accessToken, owner, repoName) {
    try {
      const res = await axios.get(`https://api.github.com/repos/${owner}/${repoName}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Code2Git-AI-App',
        },
      });

      return {
        name: res.data.name,
        fullName: res.data.full_name,
        owner: res.data.owner.login,
        url: res.data.html_url,
        private: res.data.private,
      };
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return null; // Repository does not exist
      }
      if (err.response && err.response.status === 403 && err.response.headers['x-ratelimit-remaining'] === '0') {
        throw new Error('GitHub API rate limit reached. Please try again later.');
      }
      throw new Error(`Failed to check GitHub repository: ${err.message}`);
    }
  }

  /**
   * Creates the DSA-Solutions repository for the authenticated user.
   * @param {string} accessToken 
   * @param {string} repoName 
   * @param {boolean} isPrivate 
   * @returns {Promise<Object>} Created repository details
   */
  async createDSARepository(accessToken, repoName = 'DSA-Solutions', isPrivate = false) {
    try {
      const res = await axios.post(
        'https://api.github.com/user/repos',
        {
          name: repoName,
          description: 'Automatically generated LeetCode solutions, explanations, approaches, and DSA notes maintained by Code2Git AI.',
          private: isPrivate,
          auto_init: true, // Automatically create initial commit with README.md
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Code2Git-AI-App',
          },
        }
      );

      // Create custom initial README content
      const initialReadme = `# DSA Solutions

This repository is automatically maintained by Code2Git AI.

It contains accepted LeetCode solutions along with:

* Problem explanations
* DSA concepts
* Approaches
* Dry runs
* Complexity analysis
* Edge cases
* Key takeaways

Generated automatically by Code2Git AI.
`;

      // Update initial README.md in the newly created repo
      try {
        const readmeContentBase64 = Buffer.from(initialReadme).toString('base64');
        const owner = res.data.owner.login;
        
        // Fetch SHA of default auto_init README
        let sha = null;
        try {
          const readmeRes = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/contents/README.md`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'Code2Git-AI-App',
            },
          });
          sha = readmeRes.data.sha;
        } catch (e) {
          // Ignore if missing
        }

        const putBody = {
          message: 'Initialize Code2Git AI DSA Solutions repository',
          content: readmeContentBase64,
        };
        if (sha) putBody.sha = sha;

        await axios.put(`https://api.github.com/repos/${owner}/${repoName}/contents/README.md`, putBody, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Code2Git-AI-App',
          },
        });
      } catch (readmeErr) {
        console.warn('[GitHub Repo Service] Note updating initial README:', readmeErr.message);
      }

      return {
        name: res.data.name,
        fullName: res.data.full_name,
        owner: res.data.owner.login,
        url: res.data.html_url,
        private: res.data.private,
      };
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        throw new Error(`Unable to create DSA-Solutions repository: ${err.response.data.message}`);
      }
      throw new Error(`Failed to create repository: ${err.message}`);
    }
  }

  /**
   * Main function: Checks if repository exists; creates it if missing.
   * @param {string} accessToken 
   * @param {boolean} isPrivate 
   * @returns {Promise<Object>} Normalized response object
   */
  async ensureDSARepository(accessToken, isPrivate = false) {
    const user = await this.getAuthenticatedUser(accessToken);
    const username = user.login;
    const repoName = 'DSA-Solutions';

    console.log(`[GitHub Repo Service] Checking if "${username}/${repoName}" exists...`);
    let repo = await this.getUserRepository(accessToken, username, repoName);

    let created = false;
    if (!repo) {
      console.log(`[GitHub Repo Service] "${username}/${repoName}" not found. Creating automatically...`);
      repo = await this.createDSARepository(accessToken, repoName, isPrivate);
      created = true;
    } else {
      console.log(`[GitHub Repo Service] "${username}/${repoName}" already exists ✓`);
    }

    return {
      success: true,
      username: username,
      created: created,
      repository: {
        name: repo.name,
        fullName: repo.fullName,
        owner: repo.owner,
        url: repo.url,
        private: repo.private,
      },
    };
  }
}

module.exports = new GitHubRepositoryService();
