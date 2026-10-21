import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
    appId: "io.github.blazer030.sudoku",
    appName: "Sudoku",
    webDir: "dist",
    server: {
        androidScheme: "https",
    },
};

export default config;
