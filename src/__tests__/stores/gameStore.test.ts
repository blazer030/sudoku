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

    it("should update difficulty via setDifficulty", () => {
        const store = useGameStore();
        store.setDifficulty("hard");
        expect(store.difficulty).toBe("hard");
    });
});
