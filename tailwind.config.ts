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
        ocean: {
          50: "#f0f7fb",
          100: "#d9ebf5",
          200: "#b3d7eb",
          300: "#7ab8d9",
          400: "#3d93c0",
          500: "#1f759e",
          600: "#0e5a7a",
          700: "#0b4a66",
          800: "#0a3d55",
          900: "#0b3348",
          950: "#072231",
        },
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "Tahoma", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(7, 34, 49, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
