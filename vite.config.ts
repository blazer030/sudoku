import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
    process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

    return defineConfig({
        base: process.env.VITE_BASE_URL,
        plugins: [
            react(),
        ],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src"),
            }
        },
        test: {
            globals: true,
            environment: "jsdom",
            setupFiles: ["./src/test-setup.ts"],
        },
    });
}
