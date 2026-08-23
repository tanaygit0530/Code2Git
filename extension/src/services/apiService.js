import storageService from './storageService.js';

class ApiService {
  async getBackendUrl() {
    return await storageService.getBackendUrl();
  }

  /**
   * Health check endpoint
   */
  async checkHealth() {
    try {
      const baseUrl = await this.getBackendUrl();
      const res = await fetch(`${baseUrl}/api/health`);
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[API Service] Health check error:', err.message);
      return null;
    }
  }

  /**
   * Automatically checks/creates the DSA-Solutions GitHub repository
   */
  async setupGithubRepo(token) {
    const baseUrl = await this.getBackendUrl();
    const res = await fetch(`${baseUrl}/api/github/setup`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.details || `Repository setup failed (${res.status})`);
    }

    return await res.json();
  }

  /**
   * Generates README from backend AI service
   */
  async generateReadme(problem, submission) {
    const baseUrl = await this.getBackendUrl();
    const res = await fetch(`${baseUrl}/api/generate-readme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ problem, submission }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `README generation failed with status ${res.status}`);
    }

    const data = await res.json();
    return data.readme;
  }

  /**
   * Pushes solution and README to GitHub via backend
   */
  async pushSolutionToGithub({ token, repository, problem, submission, readmeContent }) {
    const baseUrl = await this.getBackendUrl();
    const res = await fetch(`${baseUrl}/api/github/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        accessToken: token,
        repository,
        problem,
        submission,
        readmeContent,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.details || `GitHub push failed with status ${res.status}`);
    }

    return await res.json();
  }

  /**
   * Fetches GitHub repos for token
   */
  async getGithubRepos(token) {
    const baseUrl = await this.getBackendUrl();
    const res = await fetch(`${baseUrl}/api/github/repos`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch repositories.');
    const data = await res.json();
    return data.repos || [];
  }
}

export default new ApiService();
