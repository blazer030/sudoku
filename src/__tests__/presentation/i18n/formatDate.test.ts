import { describe, expect, it } from "vitest";
import type { AppLocale } from "@/application/settings/SettingsStorage";
import { formatDate } from "@/presentation/i18n/formatDate";

const now = new Date(2026, 9, 21, 15, 30);

describe("formatDate", () => {
    it.each([
        [new Date(2026, 9, 21, 15, 5), "en", "Today, 3:05 PM"],
        [new Date(2026, 9, 21, 15, 5), "zh-Hant", "今天 15:05"],
        [new Date(2026, 9, 20, 9, 5), "zh-Hant", "昨天 09:05"],
        [new Date(2026, 9, 20, 23, 59), "zh-Hant", "昨天 23:59"],
        [new Date(2026, 9, 18, 15, 5), "en", "Oct 18, 3:05 PM"],
        [new Date(2026, 9, 18, 15, 5), "zh-Hant", "10/18 15:05"],
        [new Date(2025, 11, 31, 8, 0), "zh-Hant", "12/31 08:00"],
    ])("should format %s in %s as %s", (date, locale, expected) => {
        expect(formatDate(date.toISOString(), locale as AppLocale, now)).toBe(expected);
    });

    describe("across a daylight saving change", () => {
        afterEach(() => {
            vi.unstubAllEnvs();
        });

        // The night clocks spring forward is 23 hours long, which used to make the day before it "today"
        it("should still call the day before the change yesterday", () => {
            vi.stubEnv("TZ", "America/New_York");
            const morningAfter = new Date(2026, 2, 9, 9, 0);

            expect(formatDate(new Date(2026, 2, 8, 20, 0).toISOString(), "zh-Hant", morningAfter)).toBe("昨天 20:00");
            expect(formatDate(new Date(2026, 2, 7, 20, 0).toISOString(), "zh-Hant", morningAfter)).toBe("3/7 20:00");
        });
    });
});
