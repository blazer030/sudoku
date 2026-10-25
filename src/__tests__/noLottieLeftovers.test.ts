import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

// Every style draws its own loader, so the Lottie player and its animation must stay gone
const LEFTOVERS = ["vue3-" + "lottie", "sudoku-" + "loader.json"];

const collectFiles = (directory: string): string[] =>
    readdirSync(directory).flatMap((name) => {
        const path = join(directory, name);
        return statSync(path).isDirectory() ? collectFiles(path) : [path];
    });

describe("Lottie leftovers", () => {
    it("should not be referenced by any source file", () => {
        const offenders = collectFiles("src")
            .filter(path => path !== join("src", "__tests__", "noLottieLeftovers.test.ts"))
            .filter(path => /\.(ts|vue|css|json)$/.test(path))
            .filter((path) => {
                const content = readFileSync(path, "utf8");
                return LEFTOVERS.some(leftover => content.includes(leftover));
            });
        expect(offenders).toEqual([]);
    });

    it("should not be a dependency", () => {
        const manifest = readFileSync("package.json", "utf8");
        expect(manifest).not.toContain(LEFTOVERS[0]);
    });
});
