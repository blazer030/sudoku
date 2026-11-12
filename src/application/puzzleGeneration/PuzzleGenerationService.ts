import PuzzleWorker from "@/workers/puzzleGenerator.worker?worker";
import { SudokuGenerator, type Difficulty } from "@/domain/generator/SudokuGenerator";

export interface GeneratedPuzzle {
    puzzle: number[][];
    answer: number[][];
}

interface WorkerResponse {
    id: string;
    result?: GeneratedPuzzle;
    error?: string;
}

let worker: Worker | null = null;

function ensureWorker(): Worker {
    worker ??= new PuzzleWorker();
    return worker;
}

// A worker that failed to load or threw is dropped, so the next game starts a fresh one
function dropWorker(failed: Worker): void {
    failed.terminate();
    if (worker === failed) worker = null;
}

/**
 * Generates a puzzle off the main thread, in one worker kept for every game. When the worker fails,
 * the puzzle is generated on the page instead, so a new game never waits for ever.
 */
export function generatePuzzleAsync(difficulty: Difficulty): Promise<GeneratedPuzzle> {
    return new Promise((resolve, reject) => {
        const instance = ensureWorker();
        const id = crypto.randomUUID();
        const stopListening = () => {
            instance.removeEventListener("message", onMessage);
            instance.removeEventListener("error", onError);
        };
        const onMessage = (event: MessageEvent<WorkerResponse>) => {
            if (event.data.id !== id) return;
            stopListening();
            if (event.data.result) resolve(event.data.result);
            else reject(new Error(event.data.error ?? "The puzzle generation failed"));
        };
        const onError = () => {
            stopListening();
            dropWorker(instance);
            try {
                resolve(new SudokuGenerator().generatePuzzle(difficulty));
            } catch (error) {
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        };
        instance.addEventListener("message", onMessage);
        instance.addEventListener("error", onError);
        instance.postMessage({ id, difficulty });
    });
}
