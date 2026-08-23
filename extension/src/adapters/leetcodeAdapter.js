/**
 * LeetCode Adapter Module
 * Isolates all LeetCode DOM selectors and extraction logic.
 */

class LeetCodeAdapter {
  constructor() {
    this.name = 'LeetCode';
  }

  /**
   * Extracts problem title.
   */
  getProblemTitle() {
    // Strategy 1: Modern LeetCode problem title selector
    const titleEl = document.querySelector('div[class*="text-title-large"] a, div[class*="text-title-large"], [data-cy="question-title"]');
    if (titleEl && titleEl.textContent.trim()) {
      return titleEl.textContent.trim().replace(/^\d+\.\s*/, '');
    }

    // Strategy 2: Check document title
    const docTitle = document.title;
    if (docTitle && docTitle.includes('- LeetCode')) {
      return docTitle.split('- LeetCode')[0].trim().replace(/^\d+\.\s*/, '');
    }

    // Strategy 3: URL slug fallback
    const urlMatch = window.location.pathname.match(/\/problems\/([^/]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    return 'Unknown Problem';
  }

  /**
   * Gets problem URL.
   */
  getProblemUrl() {
    const urlMatch = window.location.href.match(/(https:\/\/leetcode\.com\/problems\/[^/]+)/);
    return urlMatch ? `${urlMatch[1]}/` : window.location.href;
  }

  /**
   * Extracts problem description HTML/text.
   */
  getProblemDescription() {
    const selectors = [
      '[data-track-load="description_content"]',
      '.description__2b04',
      '[role="tabpanel"] div[class*="content"]',
      '.elfjS',
      '.question-content'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 20) {
        return el.innerText || el.textContent;
      }
    }

    return 'Problem description extracted from LeetCode.';
  }

  /**
   * Extracts problem difficulty (Easy, Medium, Hard).
   */
  getDifficulty() {
    // Look for difficulty classes or text
    const diffSelectors = [
      'div[class*="text-difficulty-easy"]',
      'div[class*="text-difficulty-medium"]',
      'div[class*="text-difficulty-hard"]',
      '[diff="easy"]', '[diff="medium"]', '[diff="hard"]',
      '.bg-olive', '.bg-yellow', '.bg-pink'
    ];

    for (const sel of diffSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        const text = el.textContent.trim();
        if (/easy/i.test(text)) return 'Easy';
        if (/medium/i.test(text)) return 'Medium';
        if (/hard/i.test(text)) return 'Hard';
      }
    }

    // Fallback search across page elements
    const allDivs = document.querySelectorAll('div, span');
    for (const div of allDivs) {
      const text = div.textContent.trim();
      if (['Easy', 'Medium', 'Hard'].includes(text) && div.children.length === 0) {
        return text;
      }
    }

    return 'Medium';
  }

  /**
   * Extracts problem topic tags.
   */
  getTopics() {
    const topics = new Set();
    const tagElements = document.querySelectorAll('a[href*="/tag/"], div[class*="topic-tag"], a[class*="topic-tag"]');

    tagElements.forEach(el => {
      const text = el.textContent.trim();
      if (text && text.length > 1 && text.length < 30) {
        topics.add(text);
      }
    });

    return Array.from(topics);
  }

  /**
   * Extracts currently submitted code from Monaco Editor or DOM.
   */
  getCurrentCode() {
    // Strategy 1: Monaco Editor lines
    const lineElements = document.querySelectorAll('.monaco-editor .view-lines .view-line');
    if (lineElements && lineElements.length > 0) {
      const codeLines = Array.from(lineElements).map(line => line.textContent);
      const fullCode = codeLines.join('\n');
      if (fullCode.trim().length > 0) {
        return fullCode;
      }
    }

    // Strategy 2: Code mirror / textarea
    const textarea = document.querySelector('textarea.inputarea, textarea[aria-label*="code"]');
    if (textarea && textarea.value) {
      return textarea.value;
    }

    // Strategy 3: Check code container pre/code
    const pre = document.querySelector('pre code, .CodeMirror-code');
    if (pre && pre.textContent.trim()) {
      return pre.textContent;
    }

    return '// Unable to extract code directly from editor.';
  }

  /**
   * Extracts submission programming language.
   */
  getLanguage() {
    // Look for language selector button
    const langSelectors = [
      'button[id^="headlessui-listbox-button"]',
      '[data-cy="lang-select"]',
      'div[class*="popover"] button',
      'div[class*="ant-select-selection-selected-value"]'
    ];

    for (const sel of langSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        const text = el.textContent.trim().toLowerCase();
        if (text.includes('c++') || text.includes('cpp')) return 'cpp';
        if (text.includes('java') && !text.includes('script')) return 'java';
        if (text.includes('python')) return 'python';
        if (text.includes('javascript') || text.includes('js')) return 'javascript';
        if (text.includes('typescript') || text.includes('ts')) return 'typescript';
        if (text.includes('c#')) return 'csharp';
        if (text.includes('go')) return 'go';
        if (text.includes('rust')) return 'rust';
        return text.split(' ')[0];
      }
    }

    return 'cpp';
  }

  /**
   * Returns current submission status text from evaluation container.
   */
  getSubmissionStatus() {
    // Selectors for result banners
    const statusSelectors = [
      '[data-e2e-locator="submission-result"]',
      'span[data-e2e-locator="submission-result"]',
      'div[class*="status-column"] span',
      'div[class*="result-container"]',
      'span[class*="text-label-1"]',
      'div[class*="text-green-s"]',
      'div[class*="text-red-s"]',
      '.status-accepted',
    ];

    for (const sel of statusSelectors) {
      const elements = document.querySelectorAll(sel);
      for (const el of elements) {
        const text = el.textContent.trim();
        if (text) {
          if (/Accepted/i.test(text)) return 'Accepted';
          if (/Wrong Answer/i.test(text)) return 'Wrong Answer';
          if (/Time Limit Exceeded/i.test(text)) return 'Time Limit Exceeded';
          if (/Runtime Error/i.test(text)) return 'Runtime Error';
          if (/Compile Error|Compilation Error/i.test(text)) return 'Compilation Error';
          if (/Memory Limit Exceeded/i.test(text)) return 'Memory Limit Exceeded';
        }
      }
    }

    return null; // Evaluation pending or unknown
  }

  /**
   * Normalizes problem metadata and submission payload into expected schema.
   */
  captureSubmissionPayload() {
    return {
      problem: {
        title: this.getProblemTitle(),
        url: this.getProblemUrl(),
        description: this.getProblemDescription(),
        difficulty: this.getDifficulty(),
        topics: this.getTopics(),
      },
      submission: {
        code: this.getCurrentCode(),
        language: this.getLanguage(),
        status: this.getSubmissionStatus() || 'Accepted',
        runtime: 'N/A',
        memory: 'N/A',
      }
    };
  }
}

export default new LeetCodeAdapter();
