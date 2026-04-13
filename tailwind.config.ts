import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontSize: {
        /** 시니어 가독성 기본 (PRD) */
        base: ["18px", { lineHeight: "1.6" }],
      },
    },
  },
  plugins: [],
};

export default config;
