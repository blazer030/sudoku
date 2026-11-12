import { readdirSync, statSync } from "fs";
import { join } from "path";

/** Every file under a directory, at any depth, keeping only those with one of the extensions when any are given. */
export const collectFiles = (directory: string, extensions: readonly string[] = []): string[] =>
    readdirSync(directory).flatMap((name) => {
        const path = join(directory, name);
        if (statSync(path).isDirectory()) return collectFiles(path, extensions);
        return extensions.length === 0 || extensions.some(extension => name.endsWith(extension)) ? [path] : [];
    });
