const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const config = require('../config');
const { buildReadmePrompt } = require('../utils/readmePromptBuilder');

/**
 * Service to generate AI README markdown using configurable AI providers.
 */
class AIService {
  /**
   * Generates README markdown for a problem submission.
   * @param {Object} problem 
   * @param {Object} submission 
   * @returns {Promise<string>} README markdown text
   */
  async generateReadme(problem, submission) {
    const prompt = buildReadmePrompt(problem, submission);
    const provider = config.ai.provider.toLowerCase();

    try {
      if (provider === 'gemini' && config.ai.geminiApiKey) {
        return await this.generateGemini(prompt);
      } else if (provider === 'openai' && config.ai.openaiApiKey) {
        return await this.generateOpenAI(prompt);
      } else if (config.ai.geminiApiKey) {
        return await this.generateGemini(prompt);
      } else if (config.ai.openaiApiKey) {
        return await this.generateOpenAI(prompt);
      } else {
        console.warn('[AI Service] No valid AI API key set. Using structured fallback README generator.');
        return this.generateFallbackReadme(problem, submission);
      }
    } catch (err) {
      console.error('[AI Service Error]:', err.message);
      console.warn('[AI Service] Falling back to template-based README generator due to API error.');
      return this.generateFallbackReadme(problem, submission);
    }
  }

  /**
   * Gemini API generator using @google/generative-ai SDK with model fallback
   */
  async generateGemini(prompt) {
    const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
    
    // Try gemini-2.5-flash or gemini-pro
    let modelName = 'gemini-1.5-flash';
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text) return text;
    } catch (e) {
      modelName = 'gemini-pro';
    }

    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (text) {
      return text;
    }
    throw new Error('Gemini API returned an empty response.');
  }

  /**
   * OpenAI API generator via HTTP
   */
  async generateOpenAI(prompt) {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert DSA computer science educator generating valid markdown READMEs.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.ai.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (res.data && res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
      return res.data.choices[0].message.content;
    }
    throw new Error('OpenAI API returned an invalid response.');
  }

  /**
   * Fallback structured README generator when API key is missing or service is offline.
   */
  generateFallbackReadme(problem, submission) {
    const title = problem.title || 'LeetCode Problem';
    const difficulty = problem.difficulty || 'Easy';
    const url = problem.url || '#';
    const topics = Array.isArray(problem.topics) ? problem.topics.join(', ') : (problem.topics || 'DSA');
    const lang = submission.language || 'java';
    const code = submission.code || '// Solution code';

    return `# ${title}

## Problem
${problem.description || 'Given a problem on LeetCode, find an optimal solution satisfying all constraints.'}

## Example
**Input**: Standard sample input  
**Output**: Expected sample output  
**Explanation**: Standard problem evaluation flow.

## Difficulty
${difficulty}

## DSA Pattern
${topics}

## Concepts Used
- Array / Data Structure Traversal
- Time & Space Optimization
- Logical Boundary Check

## Prerequisites
- Basic understanding of ${lang.toUpperCase()} syntax
- Fundamental knowledge of data structures (${topics})

## Approach
1. Parse input parameters and analyze boundary conditions.
2. Apply optimal algorithm to process data cleanly.
3. Return the calculated target result.

## Algorithm
1. Initialize variables and state containers.
2. Iterate through input elements sequentially.
3. Apply logic condition and construct output.
4. Return final output.

## Dry Run

| Step | State | Operation | Result |
| :--- | :--- | :--- | :--- |
| 1 | Initial | Setup variables | Ready |
| 2 | Processing | Execute algorithm | Target matched |

## Code Explanation
- The code handles problem constraints with efficient iteration.
- Core algorithm uses target checking to ensure correctness.

## Complexity Analysis
- **Time Complexity**: $O(N)$ — Evaluates each element in a single traversal pass.
- **Space Complexity**: $O(1)$ — Uses minimal extra memory state.

## Edge Cases
- Empty or single-element inputs
- Boundary limits and edge threshold values

## Alternative Approach
A brute force approach would require checking all pairs ($O(N^2)$ time), whereas this optimal solution runs in linear $O(N)$ time.

## Key Takeaway
Always look for optimal data structure lookups to reduce search time complexity.

## LeetCode
[View Problem on LeetCode](${url})

## Solution
\`\`\`${lang}
${code}
\`\`\`
`;
  }
}

module.exports = new AIService();
