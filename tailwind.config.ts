import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        text: "var(--text)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        "accent-strong": "var(--accent-strong)",
        "on-accent": "var(--on-accent)",
        income: "var(--income)",
        "income-soft": "var(--income-soft)",
        expense: "var(--expense)",
        "expense-soft": "var(--expense-soft)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
