import { describe, expect, it } from "vitest";
import { formatTime } from "@/utils/formatTime";

describe("formatTime", () => {
    it("should format 0 seconds as 00:00", () => {
        expect(formatTime(0)).toBe("00:00");
    });

    it("should format seconds under a minute", () => {
        expect(formatTime(45)).toBe("00:45");
    });

    it("should format exact minutes", () => {
        expect(formatTime(120)).toBe("02:00");
    });

    it("should format minutes and seconds", () => {
        expect(formatTime(204)).toBe("03:24");
    });
});
