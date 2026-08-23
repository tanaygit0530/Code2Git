/**
 * Maps LeetCode problem topics or AI inferred patterns to standard DSA folder categories.
 * Prevents creation of duplicate/split paths for similar categories.
 */

const CATEGORY_MAP = {
  // Array & Hash
  'hash table': 'Hashing',
  'hash map': 'Hashing',
  'hashing': 'Hashing',
  'array': 'Arrays',
  'string': 'Strings',
  'two pointers': 'Two-Pointers',
  'sliding window': 'Sliding-Window',
  'prefix sum': 'Prefix-Sum',
  
  // Searching & Sorting
  'binary search': 'Binary-Search',
  'sorting': 'Sorting',
  
  // Data Structures
  'linked list': 'Linked-List',
  'doubly-linked list': 'Linked-List',
  'stack': 'Stack',
  'queue': 'Queue',
  'monotonic stack': 'Stack',
  'heap (priority queue)': 'Heap',
  'heap': 'Heap',
  'priority queue': 'Heap',

  // Trees & Graphs
  'tree': 'Trees',
  'binary tree': 'Trees',
  'binary search tree': 'Trees',
  'trie': 'Trees',
  'graph': 'Graphs',
  'breadth-first search': 'Graphs',
  'depth-first search': 'Graphs',
  'bfs': 'Graphs',
  'dfs': 'Graphs',
  'union find': 'Graphs',
  'topological sort': 'Graphs',

  // Algorithms
  'dynamic programming': 'Dynamic-Programming',
  'memoization': 'Dynamic-Programming',
  'greedy': 'Greedy',
  'backtracking': 'Backtracking',

  // Math & Bits
  'math': 'Math',
  'bit manipulation': 'Bit-Manipulation',
  'recursion': 'Recursion',
};

/**
 * Normalizes title into a URL-friendly folder name.
 * e.g., "Two Sum" => "Two-Sum"
 */
function sanitizeFolderName(title) {
  if (!title) return 'Uncategorized-Problem';
  return title
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * Determines primary category from topics or AI fallback.
 * @param {Array<string>} topics - List of topic tags from LeetCode
 * @param {string} aiPattern - Inferred DSA pattern from AI
 * @returns {string} Primary category folder name
 */
function getPrimaryCategory(topics = [], aiPattern = '') {
  // 1. Try matching topic tags directly in order of priority
  if (Array.isArray(topics) && topics.length > 0) {
    for (const topic of topics) {
      const normalized = topic.toLowerCase().trim();
      if (CATEGORY_MAP[normalized]) {
        return CATEGORY_MAP[normalized];
      }
    }
  }

  // 2. Try matching AI inferred pattern
  if (aiPattern && typeof aiPattern === 'string') {
    const normalizedPattern = aiPattern.toLowerCase().trim();
    for (const [key, category] of Object.entries(CATEGORY_MAP)) {
      if (normalizedPattern.includes(key)) {
        return category;
      }
    }
  }

  // 3. Defaults
  return 'Arrays';
}

module.exports = {
  getPrimaryCategory,
  sanitizeFolderName,
  CATEGORY_MAP,
};
