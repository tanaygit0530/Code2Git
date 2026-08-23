import { STATUS, MESSAGE_TYPES, STORAGE_KEYS } from '../utils/constants.js';
import { generateSubmissionHash } from '../utils/hasher.js';
import storageService from '../services/storageService.js';
import apiService from '../services/apiService.js';
import notificationService from '../services/notificationService.js';

console.log('[Code2Git AI ServiceWorker] Background Service Worker initialized.');

let currentState = {
  status: STATUS.IDLE,
  problem: null,
  submission: null,
  error: null,
  result: null,
};

/**
 * Extracts problem title from URL slug.
 */
function parseProblemFromUrl(url) {
  if (!url || !url.includes('leetcode.com/problems/')) return null;
  const match = url.match(/\/problems\/([^/]+)/);
  if (!match || !match[1]) return null;

  const slug = match[1];
  const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    title,
    url: `https://leetcode.com/problems/${slug}/`,
    difficulty: 'Medium',
    topics: ['DSA'],
  };
}

/**
 * Updates application state and broadcasts to open side panels / UI
 */
function updateState(newState) {
  currentState = { ...currentState, ...newState };
  console.log(`[Background Status]: ${currentState.status}`);

  // Save current status in storage so UI can reload it anytime
  storageService.set('current_automation_state', currentState);

  // Broadcast message to sidepanel / extension popup
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.STATUS_UPDATE,
    state: currentState
  }).catch(() => {});
}

// Sidepanel configuration
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
}

/**
 * Helper to query active tab for fresh payload from Monaco editor
 */
function fetchFreshPayloadFromTab() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_FRESH_PAYLOAD' }, (response) => {
            if (chrome.runtime.lastError || !response || !response.payload) {
              resolve(null);
            } else {
              resolve(response.payload);
            }
          });
        } else {
          resolve(null);
        }
      });
    } else {
      resolve(null);
    }
  });
}

/**
 * Main pipeline orchestration for accepted submissions.
 */
async function processAcceptedSubmission(inputPayload) {
  try {
    let payload = inputPayload;

    // Fetch live fresh code payload from active tab if code is missing or short
    if (!payload || !payload.submission || !payload.submission.code || payload.submission.code.includes('Captured code')) {
      const fresh = await fetchFreshPayloadFromTab();
      if (fresh && fresh.submission && fresh.submission.code) {
        payload = fresh;
      }
    }

    const { problem, submission } = payload || {
      problem: currentState.problem || { title: 'LeetCode Solution', url: 'https://leetcode.com/problems/solution/' },
      submission: currentState.submission || { code: '// Solution code', language: 'java' }
    };

    updateState({
      status: STATUS.SUBMISSION_DETECTED,
      problem,
      submission,
      error: null,
      result: null,
    });

    const submissionHash = generateSubmissionHash(problem.url, submission.code, submission.language);

    updateState({ status: STATUS.ACCEPTED });

    // 1. Check GitHub Token & Target Repo
    const githubToken = await storageService.getGithubToken();
    let targetRepo = await storageService.getSelectedRepo();

    if (!githubToken) {
      updateState({
        status: STATUS.FAILED,
        error: 'GitHub account is not connected. Please click "Connect GitHub" in the side panel.',
      });
      notificationService.show('GitHub Not Connected', 'Please connect your GitHub account in Code2Git AI.', false);
      return;
    }

    // Ensure DSA-Solutions repository setup
    try {
      const repoSetup = await apiService.setupGithubRepo(githubToken);
      if (repoSetup && repoSetup.repository) {
        targetRepo = repoSetup.repository.fullName;
        await storageService.set('selected_repo', targetRepo);
      }
    } catch (e) {
      console.warn('Repository check note:', e.message);
    }

    // 2. Capturing Code & Details
    updateState({ status: STATUS.CAPTURING_CODE });

    // 3. Generate AI README via Backend
    updateState({ status: STATUS.GENERATING_README });
    let readmeContent = '';
    try {
      readmeContent = await apiService.generateReadme(problem, submission);
      updateState({ status: STATUS.README_GENERATED });
    } catch (err) {
      console.error('[Background] AI README Generation error:', err.message);
      readmeContent = `# ${problem.title}\n\nAutomated LeetCode submission backup.\n\n\`\`\`${submission.language}\n${submission.code}\n\`\`\``;
    }

    // 4. Push Solution & README to GitHub via Backend API
    updateState({ status: STATUS.PUSHING_TO_GITHUB });
    const pushResult = await apiService.pushSolutionToGithub({
      token: githubToken,
      repository: targetRepo,
      problem,
      submission,
      readmeContent,
    });

    // 5. Save to processed cache & activity log
    await storageService.saveProcessedSubmission(submissionHash);
    await storageService.addRecentActivity({
      problemTitle: problem.title,
      problemUrl: problem.url,
      difficulty: problem.difficulty,
      language: submission.language,
      repository: targetRepo,
      path: pushResult.result.folderPath,
      commitUrl: pushResult.result.commitUrl,
      status: 'SUCCESS'
    });

    updateState({
      status: STATUS.SUCCESS,
      result: pushResult.result,
    });

    notificationService.show(
      'GitHub Updated Successfully! ✓',
      `Saved ${problem.title} to ${targetRepo}/${pushResult.result.folderPath}`,
      true
    );

  } catch (error) {
    console.error('[Background Processing Error]:', error);
    updateState({
      status: STATUS.FAILED,
      error: error.message || 'An error occurred while pushing solution to GitHub.',
    });
    notificationService.show('GitHub Sync Failed', error.message || 'Failed to update GitHub repository.', false);
  }
}

/**
 * Queries active tab URL to populate problem card immediately
 */
function updateActiveTabProblem() {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].url) {
        const parsed = parseProblemFromUrl(tabs[0].url);
        if (parsed) {
          if (!currentState.problem || currentState.problem.title !== parsed.title) {
            updateState({
              problem: parsed,
              submission: currentState.submission || { language: 'java', code: '// Captured code' }
            });
          }
        }
      }
    });
  }
}

// Active Tab Change Listeners
if (typeof chrome !== 'undefined' && chrome.tabs) {
  chrome.tabs.onActivated.addListener(() => updateActiveTabProblem());
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      updateActiveTabProblem();
    }
  });
}

// Runtime message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background Message Received]:', message.type);

  if (message.type === MESSAGE_TYPES.LEETCODE_PAGE_UPDATED) {
    if (message.payload && message.payload.problem) {
      updateState({
        problem: message.payload.problem,
        submission: message.payload.submission,
      });
    }
    sendResponse({ received: true });
    return true;
  }

  if (message.type === MESSAGE_TYPES.LEETCODE_SUBMISSION_ACCEPTED) {
    processAcceptedSubmission(message.payload);
    sendResponse({ received: true, status: 'PROCESSING' });
    return true;
  }

  if (message.type === MESSAGE_TYPES.TRIGGER_PUSH) {
    fetchFreshPayloadFromTab().then((freshPayload) => {
      processAcceptedSubmission(freshPayload || message.payload);
    });
    sendResponse({ received: true });
    return true;
  }

  if (message.type === MESSAGE_TYPES.GET_STATUS) {
    updateActiveTabProblem();
    sendResponse({ state: currentState });
    return true;
  }
});
