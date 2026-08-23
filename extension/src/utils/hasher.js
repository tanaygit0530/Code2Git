/**
 * Generates a simple hash string from submission details to uniquely identify a submission.
 * @param {string} problemUrl 
 * @param {string} code 
 * @param {string} language 
 * @returns {string} Unique submission hash ID
 */
export function generateSubmissionHash(problemUrl = '', code = '', language = '') {
  const source = `${problemUrl.trim()}::${language.trim()}::${code.trim()}`;
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    const char = source.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `sub_${Math.abs(hash).toString(16)}`;
}
