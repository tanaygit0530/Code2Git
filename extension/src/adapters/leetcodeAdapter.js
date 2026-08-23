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
    // 1. URL slug fallback (e.g. /problems/longest-substring-without-repeating-characters/)
    const urlMatch = window.location.pathname.match(/\/problems\/([^/]+)/);
    if (urlMatch && urlMatch[1]) {
      const slug = urlMatch[1];
      return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // 2. Document title
    const docTitle = document.title;
    if (docTitle && docTitle.includes('- LeetCode')) {
      const parts = docTitle.split('- LeetCode')[0].trim();
      if (parts) return parts.replace(/^\d+\.\s*/, '');
    }

    // 3. DOM selector
    const titleEl = document.querySelector('div[class*="text-title-large"] a, div[class*="text-title-large"], [data-cy="question-title"]');
    if (titleEl && titleEl.textContent.trim()) {
      return titleEl.textContent.trim().replace(/^\d+\.\s*/, '');
    }

    return 'LeetCode Problem';
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

    const allSpans = document.querySelectorAll('span, div');
    for (const span of allSpans) {
      const text = span.textContent.trim();
      if (['Easy', 'Medium', 'Hard'].includes(text) && span.children.length === 0) {
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
   * Extracts currently submitted code from Monaco Editor DOM.
   */
  getCurrentCode() {
    // 1. Monaco Editor lines extraction (div[class*="view-line"] or .view-line)
    const lineElements = document.querySelectorAll('div[class*="view-line"], .monaco-editor .view-lines .view-line');
    if (lineElements && lineElements.length > 0) {
      const codeLines = Array.from(lineElements).map(line => {
        return (line.textContent || line.innerText || '').replace(/\u00a0/g, ' ');
      });
      const fullCode = codeLines.join('\n');
      if (fullCode.trim().length > 5) {
        return fullCode;
      }
    }

    // 2. Query any textarea / editor inputarea
    const textareas = document.querySelectorAll('textarea');
    for (const ta of textareas) {
      if (ta.value && ta.value.trim().length > 10) {
        return ta.value.replace(/\u00a0/g, ' ');
      }
    }

    // 3. Fallback: Monaco container text
    const editor = document.querySelector('.monaco-editor, [class*="editor"]');
    if (editor && editor.innerText && editor.innerText.trim().length > 10) {
      return editor.innerText.replace(/\u00a0/g, ' ');
    }

    return '// Solution code captured from LeetCode';
  }

  /**
   * Extracts submission programming language.
   */
  getLanguage() {
    const langBtn = document.querySelector('button[id^="headlessui-listbox-button"], [data-cy="lang-select"], div[class*="popover"] button');
    if (langBtn && langBtn.textContent.trim()) {
      const text = langBtn.textContent.trim().toLowerCase();
      if (text.includes('c++') || text.includes('cpp')) return 'cpp';
      if (text.includes('java') && !text.includes('script')) return 'java';
      if (text.includes('python')) return 'python';
      if (text.includes('javascript') || text.includes('js')) return 'javascript';
      if (text.includes('typescript') || text.includes('ts')) return 'typescript';
      if (text.includes('c#')) return 'csharp';
      if (text.includes('go')) return 'go';
      if (text.includes('rust')) return 'rust';
    }

    const code = this.getCurrentCode();
    if (code.includes('class Solution') && (code.includes('public') || code.includes('int'))) return 'java';
    if (code.includes('#include') || code.includes('vector<')) return 'cpp';
    if (code.includes('def ') || code.includes('self.')) return 'python';
    if (code.includes('var ') || code.includes('const ') || code.includes('function')) return 'javascript';

    return 'java';
  }

  /**
   * Returns current submission status text from evaluation container.
   */
  getSubmissionStatus() {
    const statusSelectors = [
      '[data-e2e-locator="submission-result"]',
      'div[class*="status-column"] span',
      'div[class*="result-container"]',
      'span[class*="text-label-1"]',
      'div[class*="text-green"]',
      'span[class*="text-green"]',
      'div[class*="text-sd-green"]',
      'span[class*="text-sd-green"]',
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
        }
      }
    }

    const pageText = document.body.innerText || '';
    if (pageText.includes('Accepted') && (pageText.includes('testcases passed') || pageText.includes('Runtime:') || pageText.includes('Beats'))) {
      return 'Accepted';
    }

    return null;
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
