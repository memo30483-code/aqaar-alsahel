import type { Config } from "tailwindcss";

/** الدرجات المتاحة في كل لوحة لونية — تقرأ من متغيّرات CSS يتغيّرها الثيم الموسمي */
const SCALE = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const;

/** rgb(var(--ocean-950) / <alpha-value>) — تسمح باستخدام الشفافية مع أي لون */
function palette(name: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const step of SCALE) {
    out[step] = `rgb(var(--${name}-${step}) / <alpha-value>)`;
  }
  return out;
}

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* النيلي الملكي / أزرق النيل — يتغيّر مع الموسم */
        ocean: palette("ocean"),
        /* الرمال البيضاء / الحجر الجيري — يتغيّر مع الموسم */
        sand: palette("sand"),
        /* الذهبي / البرونزي — يتغيّر مع الموسم */
        gold: palette("gold"),
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
