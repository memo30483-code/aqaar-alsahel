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
        /* النيلي الملكي / أزرق النيل — اللون الأساسي للأزرار والروابط */
        ocean: {
          50: "#eef2fb",
          100: "#dce4f7",
          200: "#bcc9ec",
          300: "#93a6dc",
          400: "#6a7fc7",
          500: "#4a5dae",
          600: "#384791",
          700: "#2d3875",
          800: "#262f61",
          900: "#1e2649",
          950: "#141a33",
        },
        /* الرمال البيضاء / الحجر الجيري — خلفيات الموقع والإطارات الفاتحة */
        sand: {
          50: "#fdfbf7",
          100: "#faf6ee",
          200: "#f4ecdd",
          300: "#e9dcc4",
          400: "#d9c6a3",
          500: "#c9ad80",
          600: "#b3915f",
          700: "#96754c",
          800: "#7a5f40",
          900: "#654f37",
        },
        /* الذهبي / البرونزي — شارات التوثيق وإطارات الرعاة */
        gold: {
          50: "#fdf8ec",
          100: "#f9eecd",
          200: "#f2db9b",
          300: "#e8c364",
          400: "#dfae3d",
          500: "#c9922a",
          600: "#a97420",
          700: "#87581d",
          800: "#6f471e",
          900: "#5e3c1c",
        },
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "Tahoma", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(30, 38, 73, 0.08)",
      },
      borderRadius: {
        /* قوس علوي مستوحى من العمارة الإسلامية */
        arch: "5rem",
      },
    },
  },
  plugins: [],
};
export default config;
