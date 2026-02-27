/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,js}"],
  theme: {
    extend: {
      colors: {
        "sentry-rich-black": "#0d0d0d",
        "sentry-dk-violet": "#1a1037",
        "sentry-blurple": "#6c5fc7",
        "sentry-lt-blurple": "#9e8cdb",
        "sentry-lt-violet": "#5b4a8a",
        "sentry-dk-yellow": "#f5a623",
      },
      fontFamily: {
        rubik: ["Rubik", "sans-serif"],
      },
    },
  },
  plugins: [],
};
