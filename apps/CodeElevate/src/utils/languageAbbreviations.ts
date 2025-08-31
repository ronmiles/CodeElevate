// Known language -> short display abbreviation (1–2 chars where possible)
const LANGUAGE_ABBREVIATIONS: Record<string, string> = {
  javascript: 'JS',
  js: 'JS',
  typescript: 'TS',
  ts: 'TS',
  python: 'PY',
  py: 'PY',
  java: 'JA',
  'c#': 'C#',
  csharp: 'C#',
  'c++': 'C++', // falls back would be 'C+'; keep widely-recognized form
  cpp: 'C++',
  c: 'C',
  go: 'GO',
  golang: 'GO',
  rust: 'RS',
  rs: 'RS',
  php: 'PH',
  ruby: 'RB',
  rb: 'RB',
  swift: 'SW',
  kotlin: 'KT',
  kt: 'KT',
  scala: 'SC',
  r: 'R',
  html: 'HT',
  css: 'CS',
  sql: 'SQ',
  shell: 'SH',
  bash: 'SH',
  powershell: 'PS',
  ps: 'PS',
  dart: 'DA',
  haskell: 'HS',
  hs: 'HS',
  elixir: 'EX',
  erlang: 'ER',
  perl: 'PL',
  pl: 'PL',
  'objective-c': 'OC',
  objc: 'OC',
  lua: 'LU',
};

export function getLanguageAbbreviation(language?: string | null): string {
  if (!language) return '?';
  const normalized = language.trim().toLowerCase();
  const mapped = LANGUAGE_ABBREVIATIONS[normalized];
  if (mapped) return mapped;
  // Fallback: first two characters uppercased
  return normalized.slice(0, 2).toUpperCase();
}

export { LANGUAGE_ABBREVIATIONS };
