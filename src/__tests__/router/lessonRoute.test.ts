import { describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/core", () => ({
    Capacitor: { isNativePlatform: vi.fn(() => false), getPlatform: vi.fn(() => "web") },
}));

import { ROUTER_PATH, applyLessonGuard } from "@/router";

describe("applyLessonGuard", () => {
    it("should let a known lesson through", () => {
        expect(applyLessonGuard({ params: { lessonId: "xWing" } })).toBeUndefined();
    });

    it("should send an unknown lesson to the list", () => {
        expect(applyLessonGuard({ params: { lessonId: "nope" } })).toBe(ROUTER_PATH.lessons);
    });
});
