// Stands in for the bundled worker: records what the page posts and lets the test answer or fail.
class FakeWorker {
    static instances: FakeWorker[] = [];
    posted: { id: string; difficulty: string }[] = [];
    terminated = false;
    private readonly listeners: Record<string, ((event: unknown) => void)[]> = {};

    constructor() {
        FakeWorker.instances.push(this);
    }

    addEventListener(type: string, listener: (event: unknown) => void) {
        (this.listeners[type] ??= []).push(listener);
    }

    removeEventListener(type: string, listener: (event: unknown) => void) {
        this.listeners[type] = (this.listeners[type] ?? []).filter(each => each !== listener);
    }

    postMessage(message: { id: string; difficulty: string }) {
        this.posted.push(message);
    }

    terminate() {
        this.terminated = true;
    }

    emit(type: string, event: unknown) {
        for (const listener of [...(this.listeners[type] ?? [])]) listener(event);
    }
}

vi.mock("@/workers/puzzleGenerator.worker?worker", () => ({ default: FakeWorker }));

const lastWorker = (): FakeWorker => {
    const worker = FakeWorker.instances[FakeWorker.instances.length - 1] as FakeWorker | undefined;
    if (!worker) throw new Error("expected a worker to be started");
    return worker;
};

const isFullGrid = (grid: number[][]): boolean =>
    grid.length === 9 && grid.every(row => row.length === 9 && row.every(value => value >= 1 && value <= 9));

describe("generatePuzzleAsync", () => {
    beforeEach(() => {
        vi.resetModules();
        FakeWorker.instances = [];
    });

    const loadService = async () => import("@/application/puzzleGeneration/PuzzleGenerationService");

    it("should resolve with the worker's puzzle", async () => {
        const { generatePuzzleAsync } = await loadService();
        const generated = generatePuzzleAsync("easy");
        const worker = lastWorker();
        const result = { puzzle: [[0]], answer: [[1]] };

        worker.emit("message", { data: { id: worker.posted[0].id, result } });

        await expect(generated).resolves.toEqual(result);
    });

    // A worker that fails to load or throws used to leave the new game waiting for ever
    it("should generate on the page when the worker fails", async () => {
        const { generatePuzzleAsync } = await loadService();
        const generated = generatePuzzleAsync("easy");

        lastWorker().emit("error", new Event("error"));

        const { answer } = await generated;
        expect(isFullGrid(answer)).toBe(true);
    });

    it("should start a fresh worker for the next game after one fails", async () => {
        const { generatePuzzleAsync } = await loadService();
        const first = generatePuzzleAsync("easy");
        const failed = lastWorker();
        failed.emit("error", new Event("error"));
        await first;

        void generatePuzzleAsync("easy");

        expect(failed.terminated).toBe(true);
        expect(lastWorker()).not.toBe(failed);
    });

    it("should reject a reply that carries neither a puzzle nor an error", async () => {
        const { generatePuzzleAsync } = await loadService();
        const generated = generatePuzzleAsync("easy");
        const worker = lastWorker();

        worker.emit("message", { data: { id: worker.posted[0].id } });

        await expect(generated).rejects.toThrow();
    });
});
