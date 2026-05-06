import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        klein: "#D4AF37",
        mist: "#070606",
        ink: "#FFFFFF",
        success: "#7AEBB2",
        warning: "#F59E0B",
        danger: "#FF4D4F",
      },
      borderRadius: {
        glass: "20px",
      },
      boxShadow: {
        lift: "0 22px 70px rgba(212, 175, 55, 0.16)",
        glow: "0 0 0 1px rgba(212,175,55,0.16), 0 24px 80px rgba(212,175,55,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
