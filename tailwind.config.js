module.exports = {
  content: [
    './public/**/*.html',    // Make sure to scan all HTML files
    './public/**/*.js',      // Make sure to scan JavaScript files if you're using Tailwind classes dynamically
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};