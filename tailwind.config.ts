import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        caramel: { DEFAULT: "#B5651D", dark: "#964f13", light: "#c97a33" },
        sesame: { DEFAULT: "#F5E6C8", light: "#FBF4E4" },
      },
      borderRadius: { lg: "0.875rem" },
      boxShadow: { soft: "0 2px 12px rgba(80, 50, 20, 0.08)" },
    },
  },
  plugins: [],
};
export default config;
