import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "./", // ✅ 상대 경로로 빌드
  plugins: [react()],
  server: {
    port: 3000, // ← 여기를 원하는 포트로
  },
});
