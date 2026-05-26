import localforage from "localforage";
import type { GameState } from "@/application/GameState";
import type { GameRepository } from "@/application/game/GameRepository";

const SAVE_KEY = "saved-game";

const store = localforage.createInstance({
    name: "sudoku",
    storeName: "game",
});

export class IndexedDBGameRepository implements GameRepository {
    async load(): Promise<GameState | null> {
        return await store.getItem<GameState>(SAVE_KEY);
    }

    async save(state: GameState): Promise<void> {
        await store.setItem(SAVE_KEY, state);
    }

    async clear(): Promise<void> {
        await store.removeItem(SAVE_KEY);
    }
}
