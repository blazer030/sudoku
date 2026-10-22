import { checkPuzzle } from "@/application/puzzleCheck/checkPuzzle";

interface CheckRequest {
    values: number[][];
}

self.addEventListener("message", (event: MessageEvent<CheckRequest>) => {
    try {
        self.postMessage({ result: checkPuzzle(event.data.values) });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        self.postMessage({ error: message });
    }
});
