import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import eslintPlugin from "vite-plugin-eslint";

// https://vitejs.dev/config/
export default defineConfig({
    base: process.env.VITE_BASE_URL,
    plugins: [
        react(),
        eslintPlugin({
            include: ["./src/**/*.tsx", "./src/**/*.ts"],
        })
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        }
    }
});
