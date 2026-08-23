import { SubmissionDetector } from './submissionDetector.js';
import { MESSAGE_TYPES } from '../utils/constants.js';

console.log('[Code2Git AI] Content Script loaded on LeetCode page.');

// Handle submission accepted callback
function handleAccepted(payload) {
  console.log('[Code2Git AI] ✅ Submission Accepted detected! Sending to background worker:', payload);
  
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.LEETCODE_SUBMISSION_ACCEPTED,
    payload
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('[Code2Git AI] Extension context response error:', chrome.runtime.lastError.message);
    } else {
      console.log('[Code2Git AI] Background worker acknowledged submission event:', response);
    }
  });
}

// Handle non-accepted callback
function handleRejected(status) {
  console.log(`[Code2Git AI] ℹ️ Submission result was "${status}". No GitHub push performed.`);
  
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.LEETCODE_SUBMISSION_REJECTED,
    status
  });
}

// Initialize Submission Detector
new SubmissionDetector(handleAccepted, handleRejected);
