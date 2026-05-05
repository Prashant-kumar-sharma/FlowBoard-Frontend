/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0079BF', dark: '#005c8f', light: '#e6f2f8' },
        success: '#36B37E',
        warning: '#FFAB00',
        danger: '#FF5630',
        surface: '#F4F5F7',
      },
    },
  },
  plugins: [],
}