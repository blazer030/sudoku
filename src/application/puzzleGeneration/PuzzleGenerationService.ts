import PuzzleWorker from "@/workers/puzzleGenerator.worker?worker";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";

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

export function generatePuzzleAsync(difficulty: Difficulty): Promise<GeneratedPuzzle> {
    return new Promise((resolve, reject) => {
        const instance = ensureWorker();
        const id = crypto.randomUUID();
        const listener = (event: MessageEvent<WorkerResponse>) => {
            if (event.data.id !== id) return;
            instance.removeEventListener("message", listener);
            if (event.data.error !== undefined) {
                reject(new Error(event.data.error));
            } else if (event.data.result) {
                resolve(event.data.result);
            }
        };
        instance.addEventListener("message", listener);
        instance.postMessage({ id, difficulty });
    });
}
