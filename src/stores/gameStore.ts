import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import type { Difficulty } from "@/domain";
import { PuzzleCell } from "@/domain/board/PuzzleCell";
import { Sudoku } from "@/domain/game/Sudoku";
import { GameStateConverter, type GameState } from "@/application/GameState";
import { generatePuzzleAsync } from "@/application/PuzzleGenerationService";
import type { AnalyticsService } from "@/application/analytics/AnalyticsService";
import type { GameRepository } from "@/application/game/GameRepository";

export const useGameStore = defineStore("game", () => {
    const difficulty = ref<Difficulty | null>(null);
    const sudoku = shallowRef<Sudoku | null>(null);
    const elapsedSeconds = ref(0);
    const hasActiveGame = computed(() => sudoku.value !== null);
    const savedGame = ref<GameState | null>(null);
    let analytics: AnalyticsService | null = null;
    let gameRepository: GameRepository | null = null;

    const setAnalytics = (service: AnalyticsService) => {
        analytics = service;
    };

    const setGameRepository = (repo: GameRepository) => {
        gameRepository = repo;
    };

    const loadFromRepository = async () => {
        if (gameRepository === null) return;
        savedGame.value = await gameRepository.load();
    };

    const persistGame = (state: GameState) => {
        savedGame.value = state;
        if (gameRepository === null) return;
        // Fire-and-forget; failures (e.g. storage quota) must not break the UI flow.
        gameRepository.save(state).catch(() => { /* swallowed by design */ });
    };

    const clearSavedGame = async () => {
        savedGame.value = null;
        if (gameRepository === null) return;
        await gameRepository.clear();
    };

    const setDifficulty = (value: Difficulty) => {
        difficulty.value = value;
    };

    const startNewGame = async (newDifficulty: Difficulty) => {
        const { puzzle, answer } = await generatePuzzleAsync(newDifficulty);
        const puzzleCells = puzzle.map((row) => row.map((value) => new PuzzleCell(value)));
        sudoku.value = Sudoku.restoreSave(answer, puzzleCells);
        difficulty.value = newDifficulty;
        elapsedSeconds.value = 0;
        void analytics?.logEvent({ name: "game_start", difficulty: newDifficulty });
    };

    const loadSavedGame = (state: GameState) => {
        sudoku.value = GameStateConverter.toSudoku(state);
        difficulty.value = state.difficulty;
        elapsedSeconds.value = state.elapsedSeconds;
    };

    return {
        difficulty,
        setDifficulty,
        sudoku,
        hasActiveGame,
        startNewGame,
        loadSavedGame,
        elapsedSeconds,
        setAnalytics,
        savedGame,
        setGameRepository,
        loadFromRepository,
        persistGame,
        clearSavedGame,
    };
});
