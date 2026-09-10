import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        evolve: {
          50: "#f2f7f5",
          100: "#dcece5",
          200: "#b9d9cc",
          300: "#8fc0ae",
          400: "#5fa189",
          500: "#3f836d",
          600: "#2f6957",
          700: "#275447",
          800: "#22433a",
          900: "#1d3830",
          950: "#0e1f1a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
