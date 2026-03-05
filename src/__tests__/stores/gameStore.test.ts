import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useGameStore } from "@/stores/gameStore";

describe("gameStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("should have null as default difficulty", () => {
        const store = useGameStore();
        expect(store.difficulty).toBeNull();
    });

    it("should have no active game by default", () => {
        const store = useGameStore();
        expect(store.sudoku).toBeNull();
        expect(store.hasActiveGame).toBe(false);
    });

    it("startNewGame should create a new game in store", () => {
        const store = useGameStore();
        store.startNewGame("medium");

        expect(store.sudoku).not.toBeNull();
        expect(store.difficulty).toBe("medium");
        expect(store.hasActiveGame).toBe(true);
    });

    it("should update difficulty via setDifficulty", () => {
        const store = useGameStore();
        store.setDifficulty("hard");
        expect(store.difficulty).toBe("hard");
    });
});
