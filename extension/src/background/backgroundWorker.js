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
  }).catch(() => {
    // Ignore error if sidepanel / popup is not open
  });
}

// Sidepanel configuration for Chrome extensions
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(err => {
    console.warn('Sidepanel behavior configuration note:', err);
  });
}

/**
 * Main pipeline orchestration for accepted submissions.
 */
async function processAcceptedSubmission(payload) {
  try {
    const { problem, submission } = payload;

    updateState({
      status: STATUS.SUBMISSION_DETECTED,
      problem,
      submission,
      error: null,
      result: null,
    });

    // 1. Generate unique submission hash
    const submissionHash = generateSubmissionHash(problem.url, submission.code, submission.language);

    // 2. Check duplicate protection
    const isDuplicate = await storageService.isDuplicateSubmission(submissionHash);
    if (isDuplicate) {
      updateState({
        status: STATUS.DUPLICATE,
        error: 'This accepted submission has already been pushed to GitHub.',
      });
      notificationService.show('Submission Already Saved', `${problem.title} is already synced to GitHub ✓`, true);
      return;
    }

    updateState({ status: STATUS.ACCEPTED });

    // 3. Check GitHub Authentication Token
    const githubToken = await storageService.getGithubToken();
    const targetRepo = await storageService.getSelectedRepo();

    if (!githubToken) {
      updateState({
        status: STATUS.FAILED,
        error: 'GitHub account is not connected. Please connect your GitHub account in the extension side panel.',
      });
      notificationService.show('GitHub Not Connected', 'Please connect your GitHub account in Code2Git AI.', false);
      return;
    }

    // 4. Capturing Code & Details
    updateState({ status: STATUS.CAPTURING_CODE });

    // 5. Generate AI README via Backend
    updateState({ status: STATUS.GENERATING_README });
    let readmeContent = '';
    try {
      readmeContent = await apiService.generateReadme(problem, submission);
      updateState({ status: STATUS.README_GENERATED });
    } catch (err) {
      console.error('[Background] AI README Generation error:', err.message);
      // Fallback message if AI service temporarily fails
      readmeContent = `# ${problem.title}\n\nAutomated LeetCode submission backup.\n\n\`\`\`${submission.language}\n${submission.code}\n\`\`\``;
    }

    // 6. Push Solution & README to GitHub via Backend API
    updateState({ status: STATUS.PUSHING_TO_GITHUB });
    const pushResult = await apiService.pushSolutionToGithub({
      token: githubToken,
      repository: targetRepo,
      problem,
      submission,
      readmeContent,
    });

    // 7. Save to duplicate storage cache & activity log
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

// Runtime message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background Message Received]:', message.type);

  if (message.type === MESSAGE_TYPES.LEETCODE_SUBMISSION_ACCEPTED) {
    processAcceptedSubmission(message.payload);
    sendResponse({ received: true, status: 'PROCESSING' });
    return true;
  }

  if (message.type === MESSAGE_TYPES.LEETCODE_SUBMISSION_REJECTED) {
    updateState({
      status: STATUS.NOT_ACCEPTED,
      error: `Submission result was ${message.status}. Nothing was pushed.`
    });
    sendResponse({ received: true });
    return true;
  }

  if (message.type === MESSAGE_TYPES.GET_STATUS) {
    sendResponse({ state: currentState });
    return true;
  }
});
