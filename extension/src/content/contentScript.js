import { SubmissionDetector } from './submissionDetector.js';
import leetcodeAdapter from '../adapters/leetcodeAdapter.js';

const MESSAGE_TYPES = {
  LEETCODE_SUBMISSION_ACCEPTED: 'LEETCODE_SUBMISSION_ACCEPTED',
  LEETCODE_SUBMISSION_REJECTED: 'LEETCODE_SUBMISSION_REJECTED',
  LEETCODE_PAGE_UPDATED: 'LEETCODE_PAGE_UPDATED',
  STATUS_UPDATE: 'STATUS_UPDATE',
  TRIGGER_PUSH: 'TRIGGER_PUSH',
  GET_STATUS: 'GET_STATUS',
};

console.log('[Code2Git AI] Content Script loaded on LeetCode page.');

// Safe runtime messaging helper
function safeSendMessage(message) {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.debug('[Code2Git AI] Runtime note:', chrome.runtime.lastError.message);
        }
      });
    }
  } catch (err) {
    console.debug('[Code2Git AI] Extension context error ignored:', err.message);
  }
}

// Send current problem metadata to background worker
function notifyCurrentProblem() {
  try {
    const payload = leetcodeAdapter.captureSubmissionPayload();
    if (payload && payload.problem && payload.problem.title) {
      safeSendMessage({
        type: MESSAGE_TYPES.LEETCODE_PAGE_UPDATED,
        payload
      });
    }
  } catch (e) {
    console.warn('[Code2Git AI] Notify problem note:', e.message);
  }
}

// Handle submission accepted callback
function handleAccepted(payload) {
  console.log('[Code2Git AI] ✅ Submission Accepted detected!', payload);
  safeSendMessage({
    type: MESSAGE_TYPES.LEETCODE_SUBMISSION_ACCEPTED,
    payload
  });
}

// Handle non-accepted callback
function handleRejected(status) {
  console.log(`[Code2Git AI] ℹ️ Submission result was "${status}". No GitHub push performed.`);
  safeSendMessage({
    type: MESSAGE_TYPES.LEETCODE_SUBMISSION_REJECTED,
    status
  });
}

// Respond to background worker requests for fresh code payload
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_FRESH_PAYLOAD') {
      const payload = leetcodeAdapter.captureSubmissionPayload();
      sendResponse({ payload });
      return true;
    }
  });
}

// Send initial problem details
notifyCurrentProblem();
setTimeout(notifyCurrentProblem, 1500);

// Initialize Submission Detector
try {
  new SubmissionDetector(handleAccepted, handleRejected);
} catch (error) {
  console.error('[Code2Git AI] Error initializing SubmissionDetector:', error);
}
