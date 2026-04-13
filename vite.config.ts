import { readFileSync } from "fs";
import { loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { defineConfig } from "vitest/config";

const { version } = JSON.parse(readFileSync("./package.json", "utf-8")) as { version: string };

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
    process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

    return defineConfig({
        base: process.env.VITE_BASE_URL,
        define: {
            __APP_VERSION__: JSON.stringify(version),
        },
        plugins: [
            vue(),
            VitePWA({
                registerType: "autoUpdate",
                workbox: {
                    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
                    runtimeCaching: [
                        {
                            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                            handler: "CacheFirst",
                            options: {
                                cacheName: "google-fonts-cache",
                                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                                cacheableResponse: { statuses: [0, 200] },
                            },
                        },
                        {
                            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                            handler: "CacheFirst",
                            options: {
                                cacheName: "gstatic-fonts-cache",
                                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                                cacheableResponse: { statuses: [0, 200] },
                            },
                        },
                    ],
                },
                manifest: false,
            }),
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
