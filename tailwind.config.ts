import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {
    colors: { forest: "#173D32", sage: "#78A88C", titanium: "#AEB8B5", paper: "#F1F3EF", charcoal: "#0B0F0E" },
    boxShadow: { soft: "0 18px 55px rgba(11, 15, 14, 0.08)" }
  }},
  plugins: []
};
export default config;
