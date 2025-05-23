/**
 * Maps programming language names to Monaco Editor language IDs
 */
export const getMonacoLanguage = (languageName: string): string => {
  if (!languageName) return 'plaintext';

  // Convert to lowercase for case-insensitive matching
  const normalizedName = languageName.toLowerCase();

  // Map language names to Monaco editor language IDs
  if (normalizedName.includes('javascript')) return 'javascript';
  if (normalizedName.includes('typescript')) return 'typescript';
  if (normalizedName.includes('python')) return 'python';
  if (normalizedName.includes('java') && !normalizedName.includes('javascript'))
    return 'java';
  if (normalizedName === 'c') return 'c';
  if (normalizedName.includes('c++') || normalizedName.includes('cpp'))
    return 'cpp';
  if (normalizedName.includes('c#') || normalizedName.includes('csharp'))
    return 'csharp';
  if (normalizedName.includes('go')) return 'go';
  if (normalizedName.includes('ruby')) return 'ruby';
  if (normalizedName.includes('php')) return 'php';
  if (normalizedName.includes('swift')) return 'swift';
  if (normalizedName.includes('kotlin')) return 'kotlin';
  if (normalizedName.includes('rust')) return 'rust';
  if (normalizedName.includes('html')) return 'html';
  if (normalizedName.includes('css')) return 'css';
  if (normalizedName.includes('sql')) return 'sql';

  // Default to plaintext if no match is found
  return 'plaintext';
};
