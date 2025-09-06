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
  50:  "#eaf5fc", // very light blue
  100: "#d6ebf9", 
  200: "#a9d1f1", 
  300: "#7bb7e8", 
  400: "#4d9cde", 
  500: "#0a66c2", // main blue from logo
  600: "#0056a1", // hover blue
  700: "#004182", // strong blue
  800: "#002d5c", 
  900: "#001a33"
},
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)"
      }
    },
  },
  plugins: [],
}

