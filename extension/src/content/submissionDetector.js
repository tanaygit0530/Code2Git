import leetcodeAdapter from '../adapters/leetcodeAdapter.js';

/**
 * SubmissionDetector handles observing submit button clicks and evaluating
 * the final submission outcome (Accepted vs Non-Accepted).
 */
export class SubmissionDetector {
  constructor(onAccepted, onRejected) {
    this.onAccepted = onAccepted;
    this.onRejected = onRejected;
    this.isMonitoring = false;
    this.observer = null;
    this.pollTimer = null;
    this.initListeners();
  }

  /**
   * Attaches event listener to Submit button.
   */
  initListeners() {
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!target) return;

      // Detect submit button click using multiple robust attributes
      const isSubmitBtn = target.closest(
        'button[data-e2e-locator="console-submit-button"], [data-cy="submit-code-btn"], button[class*="submit"], button:has(span:contains("Submit"))'
      ) || (target.textContent && target.textContent.trim() === 'Submit');

      if (isSubmitBtn) {
        console.log('[Code2Git] Submit button clicked. Initializing submission monitoring...');
        this.startMonitoring();
      }
    }, true);
  }

  /**
   * Starts monitoring DOM mutations and controlled polling until result resolves.
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    let attempts = 0;
    const maxAttempts = 30; // Max 15 seconds of polling fallback

    // 1. Setup MutationObserver on document body
    this.observer = new MutationObserver(() => {
      this.checkStatus();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // 2. Controlled polling fallback every 500ms
    this.pollTimer = setInterval(() => {
      attempts++;
      const resolved = this.checkStatus();
      if (resolved || attempts >= maxAttempts) {
        this.stopMonitoring();
      }
    }, 500);
  }

  /**
   * Evaluates submission status. Returns true if final result is determined.
   */
  checkStatus() {
    const status = leetcodeAdapter.getSubmissionStatus();

    if (!status) {
      return false; // Still pending / evaluating
    }

    console.log(`[Code2Git] Evaluated submission status: "${status}"`);

    if (status === 'Accepted') {
      this.stopMonitoring();
      const payload = leetcodeAdapter.captureSubmissionPayload();
      if (this.onAccepted) {
        this.onAccepted(payload);
      }
      return true;
    } else {
      // Wrong Answer, Runtime Error, Time Limit Exceeded, etc.
      this.stopMonitoring();
      if (this.onRejected) {
        this.onRejected(status);
      }
      return true;
    }
  }

  /**
   * Cleans up observers and intervals.
   */
  stopMonitoring() {
    this.isMonitoring = false;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
