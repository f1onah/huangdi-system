import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        klein: "#002FA7",
        mist: "#0B0F1A",
        ink: "#FFFFFF",
        success: "#00C896",
        warning: "#F59E0B",
        danger: "#FF4D4F",
      },
      borderRadius: {
        glass: "20px",
      },
      boxShadow: {
        lift: "0 22px 70px rgba(0, 47, 167, 0.18)",
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 24px 80px rgba(0,47,167,0.24)",
      },
    },
  },
  plugins: [],
};

export default config;
