///<reference types="vitest" />
const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'accent-blue': '#2C74FF',
        'primary-dark': '#7046b8',
        secondary: '#364FC7',
        'secondary-dark': '#2E44AD',
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        background: 'var(--background)',
        'secondary-background': 'var(--secondary-background)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        border: 'var(--border)',
        error: 'var(--error)',
      },
      borderRadius: {
        xl: '0.85rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
