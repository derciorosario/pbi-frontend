/** @type {import('tailwindcss').Config} */
const colors = require('./src/assets/colors.json');
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
       brand: {
          50:  "#d9e4f1",
          100: "#b3cae3",
          500: "#034ea2", // primary
          600: "#03428a",
          700: "#023771", // gradient start
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)"
      }
    },
  },
  plugins: [],
}

