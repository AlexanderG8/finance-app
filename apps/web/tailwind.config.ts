import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A5F',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#2E86AB',
          foreground: '#FFFFFF',
        },
        success: '#28A745',
        warning: '#F4A261',
        danger: '#E63946',
        background: '#F8FAFC',
        card: '#FFFFFF',
        border: '#E2E8F0',
        input: '#E2E8F0',
        ring: '#2E86AB',
        foreground: '#1E293B',
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
