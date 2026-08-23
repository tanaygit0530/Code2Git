/**
 * Constructs the AI prompt for generating a high-quality, comprehensive README.md
 * for a LeetCode submission.
 */

function buildReadmePrompt(problem, submission) {
  const { title, url, description, difficulty, topics } = problem || {};
  const { code, language, runtime, memory } = submission || {};

  const topicsList = Array.isArray(topics) ? topics.join(', ') : (topics || 'General');

  return `
You are an expert Computer Science educator and Data Structures & Algorithms (DSA) mentor.
Generate a comprehensive, beautifully structured, student-friendly README.md in valid GitHub-flavored Markdown for the following accepted LeetCode submission.

### Problem Information:
- **Title**: ${title || 'LeetCode Problem'}
- **LeetCode URL**: ${url || ''}
- **Difficulty**: ${difficulty || 'Easy/Medium/Hard'}
- **Topics/Tags**: ${topicsList}
- **Problem Description**:
${description || 'N/A'}

### Student's Accepted Submission:
- **Programming Language**: ${language || 'cpp'}
- **Execution Runtime**: ${runtime || 'N/A'}
- **Memory Consumption**: ${memory || 'N/A'}
- **Submitted Code**:
\`\`\`${language || 'cpp'}
${code || ''}
\`\`\`

---

### IMPORTANT INSTRUCTIONS:
1. Explain the student's ACTUAL submitted code above. Do NOT rewrite or substitute it with an unrelated alternative solution unless specifically highlighting an alternative approach in that dedicated section.
2. Ensure the output is strictly valid Markdown.
3. Include clear headings, bullet points, and code blocks.
4. Include a markdown table in the **Dry Run** section.
5. In **Complexity Analysis**, explain WHY the time and space complexity are what they are.

### REQUIRED SECTIONS & FORMAT:

# ${title || 'Problem Title'}

## Problem
[Explain the problem statement clearly and simply in plain student-friendly terms.]

## Example
[Provide a clear example input, output, and brief explanation.]

## Difficulty
${difficulty || 'Easy'}

## DSA Pattern
[Identify the primary underlying pattern, e.g., Hash Map, Two Pointers, Sliding Window, Binary Search, DFS, BFS, Dynamic Programming, etc.]

## Concepts Used
- [List 3-5 core concepts needed to understand and solve this problem]

## Prerequisites
- [List fundamental prerequisites, e.g. Understanding Hash Tables, Array indexing, etc.]

## Approach
[Explain the step-by-step logic of the student's solution in detail.]

## Algorithm
1. [Step 1]
2. [Step 2]
3. [Step 3]
...

## Dry Run
[Perform a detailed step-by-step dry run on a representative test case. Use a markdown table to trace state changes like iteration index, variable values, data structures, and condition evaluations.]

| Step / Index | Element / State | Action / Calculation | Result / Output |
| :--- | :--- | :--- | :--- |
| ... | ... | ... | ... |

## Code Explanation
[Explain the key blocks, functions, and data structures in the student's code without repeating trivial syntax.]

## Complexity Analysis
- **Time Complexity**: $O(...)$ — [Detailed explanation of why this is the time complexity based on loop iterations and operations].
- **Space Complexity**: $O(...)$ — [Detailed explanation of memory usage, auxiliary data structures, or call stack recursion depth].

## Edge Cases
- [List critical edge cases handled or to watch out for, e.g., empty inputs, single element, negative numbers, overflow].

## Alternative Approach
[Briefly describe an alternative approach (e.g. Brute Force or optimized alternative) and compare their time/space trade-offs].

## Key Takeaway
[Provide a concise 1-2 sentence revision takeaway or mental model to remember when facing similar problems.]

## LeetCode
[Original Problem Link](${url || '#'})

## Solution
\`\`\`${language || 'cpp'}
${code || ''}
\`\`\`
`;
}

module.exports = {
  buildReadmePrompt,
};
