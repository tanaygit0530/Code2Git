import { STORAGE_KEYS, DEFAULT_BACKEND_URL } from '../utils/constants.js';

class StorageService {
  async get(key, defaultValue = null) {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        // Fallback for browser standard testing
        const val = localStorage.getItem(key);
        resolve(val ? JSON.parse(val) : defaultValue);
        return;
      }
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] !== undefined ? result[key] : defaultValue);
      });
    });
  }

  async set(key, value) {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        localStorage.setItem(key, JSON.stringify(value));
        resolve(true);
        return;
      }
      chrome.storage.local.set({ [key]: value }, () => {
        resolve(true);
      });
    });
  }

  async getBackendUrl() {
    return (await this.get(STORAGE_KEYS.BACKEND_URL)) || DEFAULT_BACKEND_URL;
  }

  async getGithubToken() {
    return await this.get(STORAGE_KEYS.GITHUB_TOKEN);
  }

  async getGithubUser() {
    return await this.get(STORAGE_KEYS.GITHUB_USER);
  }

  async getSelectedRepo() {
    return await this.get(STORAGE_KEYS.SELECTED_REPO, 'DSA-Solutions');
  }

  async isDuplicateSubmission(submissionHash) {
    const processed = (await this.get(STORAGE_KEYS.PROCESSED_SUBMISSIONS)) || [];
    return processed.includes(submissionHash);
  }

  async saveProcessedSubmission(submissionHash) {
    const processed = (await this.get(STORAGE_KEYS.PROCESSED_SUBMISSIONS)) || [];
    if (!processed.includes(submissionHash)) {
      processed.push(submissionHash);
      await this.set(STORAGE_KEYS.PROCESSED_SUBMISSIONS, processed);
    }
  }

  async addRecentActivity(activityItem) {
    const activities = (await this.get(STORAGE_KEYS.RECENT_ACTIVITY)) || [];
    activities.unshift({
      ...activityItem,
      id: Date.now(),
      timestamp: new Date().toISOString()
    });
    // Keep last 50 activities
    await this.set(STORAGE_KEYS.RECENT_ACTIVITY, activities.slice(0, 50));
  }
}

export default new StorageService();
