/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Monochrome palette per the design spec
        ink: "#111111",
        charcoal: "#2b2b2b",
        grey: {
          50: "#f7f7f7",
          100: "#eeeeee",
          200: "#dddddd",
          400: "#a3a3a3",
          600: "#5c5c5c",
        },
      },
    },
  },
  plugins: [],
};
