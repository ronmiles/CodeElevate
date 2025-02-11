import { extendTheme } from '@chakra-ui/react';

export const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'var(--background)',
        color: 'var(--text)',
      },
    },
  },
  colors: {
    primary: {
      500: 'var(--primary)',
      600: 'var(--primary-hover)',
    },
    background: {
      500: 'var(--background)',
    },
    secondaryBackground: {
      500: 'var(--secondary-background)',
    },
    text: {
      500: 'var(--text)',
      secondary: 'var(--text-secondary)',
    },
    border: {
      500: 'var(--border)',
    },
    error: {
      500: 'var(--error)',
    },
  },
  components: {
    Progress: {
      baseStyle: {
        track: {
          bg: 'gray.100',
        },
      },
    },
    Box: {
      baseStyle: {
        borderColor: 'var(--border)',
      },
    },
  },
}); 