/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#1E3A5F',
        accent: '#2E86AB',
        success: '#28A745',
        warning: '#F4A261',
        danger: '#E63946',
      },
    },
  },
  plugins: [],
};
