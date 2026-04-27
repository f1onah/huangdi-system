import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        klein: "#002FA7",
        mist: "#F7F8FA",
        ink: "#111827",
      },
      boxShadow: {
        lift: "0 18px 45px rgba(17, 24, 39, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
