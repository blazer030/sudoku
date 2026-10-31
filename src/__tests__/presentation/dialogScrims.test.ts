import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

// A dialog's card is centred on its scrim. On a window shorter than the card (split screen, a short
// landscape strip) the scrim scrolls it instead, from the card's top, so no part is cut off out of reach.

const collectVueFiles = (directory: string): string[] =>
    readdirSync(directory).flatMap((name) => {
        const path = join(directory, name);
        if (statSync(path).isDirectory()) return collectVueFiles(path);
        return name.endsWith(".vue") ? [path] : [];
    });

const scrimTags = collectVueFiles("src/presentation").flatMap(path =>
    [...readFileSync(path, "utf8").matchAll(/<\w+\b(?:[^>"']|"[^"]*"|'[^']*')*>/g)]
        .map(([tag]) => tag)
        .filter(tag => tag.includes('data-skin="dialog-scrim"'))
        .map(tag => [path, tag] as const));

const classesOf = (tag: string): string[] => /\bclass="([^"]*)"/.exec(tag)?.[1].split(/\s+/) ?? [];

describe("dialog scrims", () => {
    it("should reach every dialog, the completion card's among them", () => {
        expect(scrimTags.map(([path]) => path)).toEqual(expect.arrayContaining([
            "src/presentation/pages/game/components/GameCompleteModal.vue",
            "src/presentation/pages/game/components/LeaveGameDialog.vue",
        ]));
    });

    it.each(scrimTags.filter(([, tag]) => classesOf(tag).includes("items-center") || classesOf(tag).includes("items-center-safe")))(
        "%s scrolls a card taller than the window, from its top",
        (_path, tag) => {
            const classes = classesOf(tag);

            expect(classes).toContain("overflow-y-auto");
            // Plain centring overflows both ends, leaving the card's top out of the scroll's reach
            expect(classes).toContain("items-center-safe");
            expect(classes).not.toContain("items-center");
            expect(classes).toContain("py-safe-larger");
        },
    );

    it("should keep the card clear of the system bars by the larger inset on both sides, so a card that fits stays centred", () => {
        const utility = /@utility py-safe-larger \{([^}]*)\}/.exec(readFileSync("src/style/index.css", "utf8"))?.[1] ?? "";

        expect(utility).toContain("padding-block: max(var(--safe-area-inset-top, env(safe-area-inset-top)), var(--safe-area-inset-bottom, env(safe-area-inset-bottom)))");
    });
});
