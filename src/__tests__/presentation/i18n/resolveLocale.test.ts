import { resolveLocale } from "@/presentation/i18n/resolveLocale";

describe("resolveLocale", () => {
    it.each([
        [["zh-TW"], "zh-Hant"], [["zh-Hant-TW"], "zh-Hant"], [["zh-HK"], "zh-Hant"], [["zh-MO"], "zh-Hant"],
        [["zh-Hant"], "zh-Hant"], [["zh-CN"], "en"], [["zh-Hans-TW"], "en"], [["zh"], "en"], [["zh-SG"], "en"],
        [["en-US", "zh-TW"], "en"], [["ja-JP"], "en"], [[], "en"],
    ])("should resolve system languages %j to %s", (languages, expected) => {
        expect(resolveLocale("system", languages)).toBe(expected);
    });

    it("should return the explicit preference regardless of system languages", () => {
        expect(resolveLocale("en", ["zh-TW"])).toBe("en");
        expect(resolveLocale("zh-Hant", ["en-US"])).toBe("zh-Hant");
    });
});
