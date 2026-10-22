import { describe, expect, it } from "vitest";
import { countPlayStreak } from "@/application/statistics/playStreak";

const localIso = (year: number, monthIndex: number, day: number, hour = 12, minute = 0): string =>
    new Date(year, monthIndex, day, hour, minute).toISOString();

const now = new Date(2026, 9, 22, 9, 0);

describe("countPlayStreak", () => {
    it("should be 0 without games", () => {
        expect(countPlayStreak([], now)).toBe(0);
    });

    it("should count consecutive days up to today", () => {
        const dates = [localIso(2026, 9, 22), localIso(2026, 9, 21), localIso(2026, 9, 20)];

        expect(countPlayStreak(dates, now)).toBe(3);
    });

    it("should count a day once however many games it has", () => {
        const dates = [localIso(2026, 9, 22, 8), localIso(2026, 9, 22, 8, 30)];

        expect(countPlayStreak(dates, now)).toBe(1);
    });

    it("should start from yesterday when today has no game", () => {
        const dates = [localIso(2026, 9, 21), localIso(2026, 9, 20)];

        expect(countPlayStreak(dates, now)).toBe(2);
    });

    it("should be 0 when the last game was two days ago", () => {
        expect(countPlayStreak([localIso(2026, 9, 20)], now)).toBe(0);
    });

    it("should break at a missed day", () => {
        const dates = [localIso(2026, 9, 22), localIso(2026, 9, 20), localIso(2026, 9, 19)];

        expect(countPlayStreak(dates, now)).toBe(1);
    });

    it("should count a game just after local midnight as that local day", () => {
        const dates = [localIso(2026, 9, 22, 0, 5), localIso(2026, 9, 21, 23, 55)];

        expect(countPlayStreak(dates, now)).toBe(2);
    });

    it("should cross a month boundary", () => {
        const firstOfNovember = new Date(2026, 10, 1, 10, 0);
        const dates = [localIso(2026, 10, 1), localIso(2026, 9, 31), localIso(2026, 9, 30)];

        expect(countPlayStreak(dates, firstOfNovember)).toBe(3);
    });

    it("should ignore unreadable dates", () => {
        expect(countPlayStreak(["not a date", localIso(2026, 9, 22)], now)).toBe(1);
    });
});
