/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#39175D',
          light: '#5a2490',
          dark: '#250f3d',
          50: '#f3eef9',
          100: '#e0d0f2',
          500: '#39175D',
          600: '#2d1249',
          700: '#250f3d',
        },
      },
      fontFamily: {
        sans: ['Barlow', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
