import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Splitwise-inspired palette
        teal: {
          DEFAULT: "#1CC29F",
          50: "#E9FAF5",
          100: "#CFF4EA",
          400: "#3FD0B0",
          500: "#1CC29F",
          600: "#15A98B",
          700: "#0F8A72",
        },
        owe: "#FF652F",     // orange/red — you owe
        owed: "#1CC29F",    // teal/green — you are owed
        ink: "#2A2E32",
        muted: "#6F7479",
        line: "#ECECEC",
        cloud: "#F7F7F7",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.10)",
        float: "0 8px 24px rgba(16,24,40,.16)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
    },
  },
  plugins: [],
};
export default config;
