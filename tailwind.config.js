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
        50: "#eaf3fb",
        100: "#d6e8f8",
        500: "#0a66c2", // main
        600: "#004182", // hover
        700: "#004182", // strong
      }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)"
      }
    },
  },
  plugins: [],
}

