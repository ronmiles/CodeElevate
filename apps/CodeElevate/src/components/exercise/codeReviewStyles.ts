export const codeReviewStyles = `
  .review-comment-line { background-color: rgba(0, 0, 0, 0.05); }
  .review-comment-suggestion { border-left: 2px solid #3b82f6; }
  .review-comment-error { border-left: 3px solid #ef4444; background-color: rgba(239, 68, 68, 0.05); }
  .review-comment-praise { border-left: 3px solid #22c55e; }
  .review-inline-comment { font-style: italic; opacity: 0.8; }
  .review-inline-suggestion { color: #3b82f6; }
  .review-inline-error { color: #ef4444; }
  .review-inline-praise { color: #22c55e; }
  .review-glyph-suggestion { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%233b82f6' d='M8 1a5 5 0 0 0-5 5v1h1V6a4 4 0 0 1 8 0v1h1V6a5 5 0 0 0-5-5z'/%3E%3Cpath fill='%233b82f6' d='M10 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z'/%3E%3C/svg%3E") center center no-repeat; }
  .review-glyph-error { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ef4444'%3E%3Cpath fill-rule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clip-rule='evenodd'/%3E%3C/svg%3E") center center no-repeat; }
  .review-glyph-error-high { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ef4444'%3E%3Cpath fill-rule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clip-rule='evenodd'/%3E%3C/svg%3E") center center no-repeat; background-color: rgba(239, 68, 68, 0.1); border-radius: 50%; }
  .review-glyph-praise { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%2322c55e' d='M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13z'/%3E%3Cpath fill='%2322c55e' d='M6.5 9.5L5 8l-1 1 2.5 2.5L11 7l-1-1-3.5 3.5z'/%3E%3C/svg%3E") center center no-repeat; }

  /* Logic Block styles */
  .review-block-strength { background-color: rgba(34, 197, 94, 0.07); }
  .review-block-improvement { background-color: rgba(59, 130, 246, 0.07); }
  .review-block-critical { background-color: rgba(239, 68, 68, 0.07); }
  .review-block-critical-high { background-color: rgba(239, 68, 68, 0.12); }

  /* Add new classes for severity levels */
  .review-block-strength-high { background-color: rgba(34, 197, 94, 0.15); box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.3); }
  .review-block-improvement-high { background-color: rgba(59, 130, 246, 0.15); box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3); }
  .review-block-strength-medium { background-color: rgba(34, 197, 94, 0.1); }
  .review-block-improvement-medium { background-color: rgba(59, 130, 246, 0.1); }
  .review-block-critical-medium { background-color: rgba(239, 68, 68, 0.09); }

  .review-block-glyph-strength { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2322c55e'%3E%3Cpath fill-rule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z' clip-rule='evenodd'/%3E%3C/svg%3E") center center no-repeat; }
  .review-block-glyph-improvement { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%233b82f6'%3E%3Cpath d='M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z'/%3E%3C/svg%3E") center center no-repeat; }
  .review-block-glyph-critical { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ef4444'%3E%3Cpath fill-rule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clip-rule='evenodd'/%3E%3C/svg%3E") center center no-repeat; }
  .review-block-glyph-critical-high { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ef4444'%3E%3Cpath fill-rule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clip-rule='evenodd'/%3E%3C/svg%3E") center center no-repeat; background-color: rgba(239, 68, 68, 0.1); border-radius: 50%; }

  .line-error-severity-high { border-bottom: 2px wavy #ef4444; }
  .line-error-severity-medium { border-bottom: 1px wavy #ef4444; }
  .line-error-severity-low { border-bottom: 1px dotted #ef4444; }
`;
