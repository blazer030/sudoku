import { afterEach, describe, expect, it, vi } from "vitest";
import { checkPuzzleAsync } from "@/application/puzzleCheck/PuzzleCheckService";
import { checkPuzzle, type PuzzleCheck } from "@/application/puzzleCheck/checkPuzzle";
import { singlesPuzzle } from "@/__tests__/fixtures/singlesPuzzle";

// Stands in for the browser Worker: records what the page posts and lets the test answer.
class FakeWorker {
    static instances: FakeWorker[] = [];
    posted: unknown[] = [];
    terminated = false;
    private readonly listeners: Record<string, ((event: unknown) => void)[]> = {};

    constructor(public readonly url: URL | string, public readonly options?: WorkerOptions) {
        FakeWorker.instances.push(this);
    }

    addEventListener(type: string, listener: (event: unknown) => void) {
        (this.listeners[type] ??= []).push(listener);
    }

    postMessage(message: unknown) {
        this.posted.push(message);
    }

    terminate() {
        this.terminated = true;
    }

    emit(type: string, event: unknown) {
        for (const listener of this.listeners[type] ?? []) listener(event);
    }
}

const lastWorker = (): FakeWorker => {
    const worker = FakeWorker.instances[FakeWorker.instances.length - 1] as FakeWorker | undefined;
    if (!worker) throw new Error("expected a worker to be started");
    return worker;
};

afterEach(() => {
    vi.unstubAllGlobals();
    FakeWorker.instances = [];
});

describe("checkPuzzleAsync", () => {
    describe("without Worker support", () => {
        it("should check the puzzle on the page and give the same answer", async () => {
            expect(typeof Worker).toBe("undefined");

            await expect(checkPuzzleAsync(singlesPuzzle)).resolves.toEqual(checkPuzzle(singlesPuzzle));
        });

        it("should reject with an AbortError when already cancelled", async () => {
            const run = new AbortController();
            run.abort();

            await expect(checkPuzzleAsync(singlesPuzzle, run.signal)).rejects.toMatchObject({ name: "AbortError" });
        });
    });

    describe("with Worker support", () => {
        it("should post the puzzle to a module worker and resolve with its answer, then stop the worker", async () => {
            vi.stubGlobal("Worker", FakeWorker);
            const answer: PuzzleCheck = { solutionCount: 1, path: [] };

            const pending = checkPuzzleAsync(singlesPuzzle);
            const worker = lastWorker();
            worker.emit("message", { data: { result: answer } });

            await expect(pending).resolves.toEqual(answer);
            expect(worker.options).toEqual({ type: "module" });
            expect(worker.posted).toEqual([{ values: singlesPuzzle }]);
            expect(worker.terminated).toBe(true);
        });

        it("should reject with the worker's error message", async () => {
            vi.stubGlobal("Worker", FakeWorker);

            const pending = checkPuzzleAsync(singlesPuzzle);
            lastWorker().emit("message", { data: { error: "boom" } });

            await expect(pending).rejects.toThrow("boom");
            expect(lastWorker().terminated).toBe(true);
        });

        it("should stop the worker and reject with an AbortError when cancelled", async () => {
            vi.stubGlobal("Worker", FakeWorker);
            const run = new AbortController();

            const pending = checkPuzzleAsync(singlesPuzzle, run.signal);
            run.abort();

            await expect(pending).rejects.toMatchObject({ name: "AbortError" });
            expect(lastWorker().terminated).toBe(true);
        });

        it("should fall back to checking on the page when the worker fails to load", async () => {
            vi.stubGlobal("Worker", FakeWorker);

            const pending = checkPuzzleAsync(singlesPuzzle);
            lastWorker().emit("error", new Event("error"));

            await expect(pending).resolves.toEqual(checkPuzzle(singlesPuzzle));
            expect(lastWorker().terminated).toBe(true);
        });
    });
});
