import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#000000",
          foreground: "#FFFFFF",
        },
        muted: "#4B4B4B",
        surface: "#F6F6F6",
        border: "#E5E5E5",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        md: "0.375rem",
        lg: "0.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
