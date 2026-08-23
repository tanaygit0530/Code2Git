import leetcodeAdapter from '../adapters/leetcodeAdapter.js';

/**
 * SubmissionDetector: Detects clicks on LeetCode's Submit button,
 * waits for the submission evaluation, and sends the accepted payload to background worker.
 */
export class SubmissionDetector {
  constructor(onAccepted, onRejected) {
    this.onAccepted = onAccepted;
    this.onRejected = onRejected;
    this.initListeners();
  }

  initListeners() {
    console.log('[Code2Git] SubmissionDetector listeners attached.');

    document.addEventListener('click', (e) => {
      try {
        const target = e.target;
        if (!target) return;

        // Check if clicked element or parent is the Submit button
        const btn = target.closest ? target.closest('button') : null;
        const btnText = (target.textContent || (btn ? btn.textContent : '') || '').trim();

        const isSubmit = btnText.startsWith('Submit') || 
                         (btn && btn.getAttribute('data-e2e-locator') === 'console-submit-button') ||
                         (btn && btn.getAttribute('data-cy') === 'submit-code-btn');

        if (isSubmit) {
          console.log('[Code2Git] 🚀 Submit button click detected! Starting submission capture...');
          this.monitorSubmission();
        }
      } catch (err) {
        console.warn('[Code2Git] Click listener note:', err);
      }
    }, true);

    // Keyboard shortcut (Cmd+Enter or Ctrl+Enter)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        console.log('[Code2Git] 🚀 Shortcut Submit (Cmd+Enter) detected! Starting submission capture...');
        this.monitorSubmission();
      }
    }, true);
  }

  monitorSubmission() {
    let checks = 0;
    const maxChecks = 12; // Check for up to 12 seconds

    const pollInterval = setInterval(() => {
      checks++;
      const status = leetcodeAdapter.getSubmissionStatus();
      console.log(`[Code2Git] Polling submission status (${checks}/${maxChecks}): ${status || 'Evaluating...'}`);

      if (status === 'Accepted') {
        clearInterval(pollInterval);
        console.log('[Code2Git] ✅ Accepted status verified! Capturing payload...');
        const payload = leetcodeAdapter.captureSubmissionPayload();
        if (this.onAccepted) {
          this.onAccepted(payload);
        }
      } else if (status && status !== 'Pending' && checks > 4) {
        clearInterval(pollInterval);
        console.log(`[Code2Git] Submission result: ${status}. Skipping push.`);
        if (this.onRejected) {
          this.onRejected(status);
        }
      } else if (checks >= maxChecks) {
        clearInterval(pollInterval);
        // Fallback: If 12 seconds elapsed and page has code, attempt payload send
        console.log('[Code2Git] Timeout reached. Sending payload...');
        const payload = leetcodeAdapter.captureSubmissionPayload();
        if (this.onAccepted) {
          this.onAccepted(payload);
        }
      }
    }, 1000);
  }
}
