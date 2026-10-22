import { readFileSync } from "fs";
import { loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { defineConfig } from "vitest/config";

const { version } = JSON.parse(readFileSync("./package.json", "utf-8")) as { version: string };

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
    process.env = { ...loadEnv(mode, process.cwd()), ...process.env };

    const isCapacitorBuild = process.env.VITE_CAPACITOR === "1";

    return defineConfig({
        base: process.env.VITE_BASE_URL,
        define: {
            __APP_VERSION__: JSON.stringify(version),
            __VUE_I18N_LEGACY_API__: false,
            __VUE_I18N_FULL_INSTALL__: true,
            __INTLIFY_PROD_DEVTOOLS__: false,
        },
        plugins: [
            vue(),
            ...(isCapacitorBuild ? [] : [
                VitePWA({
                    registerType: "autoUpdate",
                    workbox: {
                        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
                    },
                    manifest: false,
                }),
            ]),
        ],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src"),
            }
        },
        test: {
            globals: true,
            environment: "jsdom",
            exclude: ["**/node_modules/**", "**/dist/**", "**/.worktrees/**"],
            setupFiles: ["src/__tests__/setup.ts"],
            pool: "forks",
            poolOptions: {
                forks: {
                    execArgv: ["--disable-warning=ExperimentalWarning"],
                },
            },
        },
    });
}
