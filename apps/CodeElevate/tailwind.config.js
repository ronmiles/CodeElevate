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
        background: '#0f1117',
        'secondary-background': '#1a1e2a',
        'accent-blue': '#2C74FF',
        primary: '#8957e5',
        'primary-dark': '#7046b8',
        secondary: '#364FC7',
        'secondary-dark': '#2E44AD',
        text: '#e6e6e6',
        'text-secondary': '#a0a0a0',
        error: '#e53e3e',
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
