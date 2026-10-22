import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import type { Difficulty } from "@/domain";
import { PuzzleCell } from "@/domain/board/PuzzleCell";
import { Sudoku } from "@/domain/game/Sudoku";
import { GameStateConverter, type GameState } from "@/application/game/GameState";
import { generatePuzzleAsync } from "@/application/puzzleGeneration/PuzzleGenerationService";
import type { AnalyticsService } from "@/application/analytics/AnalyticsService";
import type { GameRepository } from "@/application/game/GameRepository";
import type { GameReplayData } from "@/application/statistics/StatisticsRepository";

export const useGameStore = defineStore("game", () => {
    const difficulty = ref<Difficulty | null>(null);
    const sudoku = shallowRef<Sudoku | null>(null);
    const elapsedSeconds = ref(0);
    // Replay recorded before the active game was saved; null for a new game or an old save
    const replay = shallowRef<GameReplayData | null>(null);
    const hasActiveGame = computed(() => sudoku.value !== null);
    const savedGame = ref<GameState | null>(null);
    // Raised by every new game, so the game screen can remount for it without leaving the route
    const gameSerial = ref(0);
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
        replay.value = null;
        gameSerial.value++;
        void analytics?.logEvent({ name: "game_start", difficulty: newDifficulty });
    };

    const loadSavedGame = (state: GameState) => {
        sudoku.value = GameStateConverter.toSudoku(state);
        difficulty.value = state.difficulty;
        elapsedSeconds.value = state.elapsedSeconds;
        replay.value = state.replay ?? null;
    };

    return {
        difficulty,
        setDifficulty,
        sudoku,
        hasActiveGame,
        gameSerial,
        startNewGame,
        loadSavedGame,
        elapsedSeconds,
        replay,
        setAnalytics,
        savedGame,
        setGameRepository,
        loadFromRepository,
        persistGame,
        clearSavedGame,
    };
});
