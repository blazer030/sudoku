import { LocalStorageGameRepository } from "@/infrastructure/game/LocalStorageGameRepository";
import type { GameState } from "@/application/GameState";

const sampleState: GameState = {
    difficulty: "easy",
    answer: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0)),
    cells: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ({ clue: 0, entry: 0, notes: [] }))),
    elapsedSeconds: 42,
    completed: false,
    hintsUsed: 0,
};

describe("LocalStorageGameRepository", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("load returns null when no game is saved", async () => {
        const repo = new LocalStorageGameRepository();
        await expect(repo.load()).resolves.toBeNull();
    });

    it("save then load roundtrips the game state", async () => {
        const repo = new LocalStorageGameRepository();
        await repo.save(sampleState);
        await expect(repo.load()).resolves.toEqual(sampleState);
    });

    it("clear removes the saved game", async () => {
        const repo = new LocalStorageGameRepository();
        await repo.save(sampleState);
        await repo.clear();
        await expect(repo.load()).resolves.toBeNull();
    });
});
