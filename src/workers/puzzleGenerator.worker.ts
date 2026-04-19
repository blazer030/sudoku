import { SudokuGenerator, type Difficulty } from "@/domain/generator/SudokuGenerator";

interface GenerateRequest {
    id: string;
    difficulty: Difficulty;
}

const generator = new SudokuGenerator();

self.addEventListener("message", (event: MessageEvent<GenerateRequest>) => {
    const { id, difficulty } = event.data;
    try {
        const result = generator.generatePuzzle(difficulty);
        self.postMessage({ id, result });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        self.postMessage({ id, error: message });
    }
});
