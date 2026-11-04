import { activeIconSet, selectIconStyle, type IconSetLoader } from "@/presentation/components/icon/activeIconSet";
import { ICON_NAMES, type IconName, type IconSet } from "@/style/iconSet";
import type { StyleId } from "@/theme/themeIds";

const set = (viewBox: string): IconSet => ({
    viewBox,
    drawings: Object.fromEntries(ICON_NAMES.map(name => [name, ""])) as Record<IconName, string>,
});

const loadersOf = (loaders: Partial<Record<StyleId, IconSetLoader>>) =>
    ({ minimal: null, ...loaders }) as Record<StyleId, IconSetLoader | null>;

/** A loader the test finishes by hand, so it can settle them in any order. */
const deferredSet = (result: IconSet) => {
    let finish: (() => void) | undefined;
    const loader: IconSetLoader = () => new Promise<IconSet>((resolve) => { finish = () => { resolve(result); }; });
    return { loader, finish: () => { finish?.(); } };
};

describe("activeIconSet", () => {
    afterEach(async () => {
        await selectIconStyle("minimal", loadersOf({}));
    });

    it("should draw lucide for a style with no set of its own", async () => {
        await selectIconStyle("pixel", loadersOf({ pixel: () => Promise.resolve(set("pixel")) }));

        await selectIconStyle("minimal", loadersOf({}));

        expect(activeIconSet.value).toBeNull();
    });

    it("should use a style's set once it has loaded", async () => {
        await selectIconStyle("pixel", loadersOf({ pixel: () => Promise.resolve(set("pixel")) }));

        expect(activeIconSet.value?.viewBox).toBe("pixel");
    });

    it("should keep the current set until the next one has loaded", async () => {
        const next = deferredSet(set("ink"));
        await selectIconStyle("pixel", loadersOf({ pixel: () => Promise.resolve(set("pixel")) }));

        const switching = selectIconStyle("ink", loadersOf({ ink: next.loader }));
        expect(activeIconSet.value?.viewBox).toBe("pixel");

        next.finish();
        await switching;
        expect(activeIconSet.value?.viewBox).toBe("ink");
    });

    it("should end on the style chosen last when an earlier one loads later", async () => {
        const slow = deferredSet(set("ink"));
        const fast = deferredSet(set("cyber"));
        const loaders = loadersOf({ ink: slow.loader, cyber: fast.loader });

        const first = selectIconStyle("ink", loaders);
        const second = selectIconStyle("cyber", loaders);
        fast.finish();
        await second;
        slow.finish();
        await first;

        expect(activeIconSet.value?.viewBox).toBe("cyber");
    });

    it("should fall back to lucide without failing when a set can't load", async () => {
        await selectIconStyle("pixel", loadersOf({ pixel: () => Promise.resolve(set("pixel")) }));

        await expect(selectIconStyle("ink", loadersOf({ ink: () => Promise.reject(new Error("chunk gone")) }))).resolves.toBeUndefined();

        expect(activeIconSet.value).toBeNull();
    });

    it("should still switch style after a set failed to load", async () => {
        await selectIconStyle("ink", loadersOf({ ink: () => Promise.reject(new Error("chunk gone")) }));

        await selectIconStyle("pixel", loadersOf({ pixel: () => Promise.resolve(set("pixel")) }));

        expect(activeIconSet.value?.viewBox).toBe("pixel");
    });
});
