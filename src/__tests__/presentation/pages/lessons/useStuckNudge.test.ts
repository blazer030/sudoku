import { effectScope, nextTick } from "vue";
import { HIDDEN_SINGLE } from "@/domain/lessons/content/basicsAndEasy";
import type { Lesson } from "@/domain/lessons/Lesson";
import { useLessonSession } from "@/presentation/pages/lessons/useLessonSession";
import { STUCK_IDLE_MS, useStuckNudge } from "@/presentation/pages/lessons/useStuckNudge";

// The lesson's first practice: light a 3 on the board
const firstPractice = HIDDEN_SINGLE.steps.findIndex(step => step.kind === "light");

const start = (lesson: Lesson = HIDDEN_SINGLE) => {
    const scope = effectScope();
    const result = scope.run(() => {
        const session = useLessonSession(lesson);
        session.goTo(firstPractice);
        return { session, nudged: useStuckNudge(session) };
    });
    if (result === undefined) throw new Error("The scope did not run");
    return { ...result, stop: () => { scope.stop(); } };
};

// An empty cell: lighting needs a filled one, so this brings a correcting message
const tapEmpty = (session: ReturnType<typeof useLessonSession>) => { session.tapCell(0, 0); };

describe("useStuckNudge", () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it("should nudge after three wrong answers in a row", async () => {
        const { session, nudged, stop } = start();
        tapEmpty(session);
        tapEmpty(session);
        await nextTick();
        expect(nudged.value).toBe(false);

        tapEmpty(session);
        await nextTick();
        expect(nudged.value).toBe(true);
        stop();
    });

    it("should nudge after thirty seconds without an action, and not before", async () => {
        const { nudged, stop } = start();
        await nextTick();

        vi.advanceTimersByTime(STUCK_IDLE_MS - 1);
        expect(nudged.value).toBe(false);
        vi.advanceTimersByTime(1);
        expect(nudged.value).toBe(true);
        stop();
    });

    it("should count the thirty seconds again after any action", async () => {
        const { session, nudged, stop } = start();
        await nextTick();
        vi.advanceTimersByTime(STUCK_IDLE_MS - 1000);

        tapEmpty(session);
        await nextTick();
        vi.advanceTimersByTime(1000);
        expect(nudged.value).toBe(false);
        stop();
    });

    it("should end the nudge when the player asks for a hint", async () => {
        const { session, nudged, stop } = start();
        await nextTick();
        vi.advanceTimersByTime(STUCK_IDLE_MS);
        expect(nudged.value).toBe(true);

        session.requestHint();
        await nextTick();
        expect(nudged.value).toBe(false);
        stop();
    });

    it("should never nudge on an explanation step", async () => {
        const { session, nudged, stop } = start();
        session.goTo(0);
        await nextTick();
        vi.advanceTimersByTime(STUCK_IDLE_MS * 2);

        expect(nudged.value).toBe(false);
        stop();
    });

    it("should not nudge once every hint is used", async () => {
        const { session, nudged, stop } = start();
        const step = HIDDEN_SINGLE.steps[firstPractice];
        const hints = step.kind === "light" ? step.hints.length : 0;
        for (let level = 0; level < hints; level++) session.requestHint();
        tapEmpty(session);
        tapEmpty(session);
        tapEmpty(session);
        await nextTick();
        vi.advanceTimersByTime(STUCK_IDLE_MS);

        expect(session.practice.value.missesInARow).toBe(3);
        expect(nudged.value).toBe(false);
        stop();
    });
});
