/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#d8f1ff',
          200: '#bae8ff',
          300: '#8bdbff',
          400: '#54c4ff',
          500: '#2ca5ff',
          600: '#1586f5',
          700: '#0e6de1',
          800: '#1258b6',
          900: '#154b8f',
          950: '#122f57',
        },
      },
    },
  },
  plugins: [],
};
