import type { GameState } from "@/application/GameState";
import type { GameRepository } from "@/application/game/GameRepository";

const STORAGE_KEY = "sudoku-save";

export class LocalStorageGameRepository implements GameRepository {
    load(): Promise<GameState | null> {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === null) return Promise.resolve(null);
        return Promise.resolve(JSON.parse(stored) as GameState);
    }

    save(state: GameState): Promise<void> {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return Promise.resolve();
    }

    clear(): Promise<void> {
        localStorage.removeItem(STORAGE_KEY);
        return Promise.resolve();
    }
}
