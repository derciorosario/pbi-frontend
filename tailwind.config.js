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
        /*brand: {
          50:  "#F8EAF8",
          100: "#F1D5F1",
          500: "#A855A8", // <-- gradient END
          600: "#974B97",
          700: "#8A358A"  // <-- gradient START
        }*/
       brand: {
          50:  "#d9e4f1",
          100: "#b3cae3",
          500: "#034ea2", // primary
          600: "#03428a",
          700: "#023771", // gradient start
        },
        accent: {
          50:  "#dff2e4",
          100: "#bee5c9",
          500: "#27a84a", // success / accent
          600: "#218f3f",
          700: "#1b7634",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)"
      }
    },
  },
  plugins: [],
}

