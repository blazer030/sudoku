import { inject } from "vue";
import { useRouter } from "vue-router";
import { ANALYTICS_KEY } from "@/application/analytics/AnalyticsService";
import { computeAbandonProgress } from "@/application/analytics/computeAbandonProgress";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import { provideNewGameDialog } from "@/presentation/components/new-game-dialog/useNewGameDialog";
import { usePuzzleLoader } from "@/presentation/components/puzzle-loader/usePuzzleLoader";
import { ROUTER_PATH } from "@/router";
import { useGameStore } from "@/stores/gameStore";
import { useStatisticsStore } from "@/stores/statisticsStore";

/**
 * Starting a game from a page that offers it: asks first about an unfinished game, then generates the
 * puzzle behind the loader and opens the game. The page renders NewGameDialog and PuzzleLoader.
 */
export const useNewGameFlow = () => {
    const router = useRouter();
    const gameStore = useGameStore();
    const statisticsStore = useStatisticsStore();
    const newGameDialog = provideNewGameDialog();
    const puzzleLoader = usePuzzleLoader();
    const analytics = inject(ANALYTICS_KEY);

    const continueGame = () => {
        const saved = gameStore.savedGame;
        if (saved) {
            gameStore.loadSavedGame(saved);
        }
        void router.push(ROUTER_PATH.game);
    };

    const startGame = async (difficulty: Difficulty) => {
        await puzzleLoader.runWithLoader(() => gameStore.startNewGame(difficulty));
        void router.push(ROUTER_PATH.game);
    };

    const startNewGame = async (difficulty: Difficulty) => {
        if (gameStore.savedGame !== null) {
            const unfinished = gameStore.savedGame;
            const result = await newGameDialog.open({ difficulty: unfinished.difficulty, elapsedSeconds: unfinished.elapsedSeconds });
            if (result === "stay") return;
            if (result === "continue") {
                continueGame();
                return;
            }
            const saved = gameStore.savedGame;
            const { progressPct, correctPct, incorrectPct } = computeAbandonProgress(saved.cells, saved.answer);
            void analytics?.logEvent({
                name: "game_abandon",
                difficulty: saved.difficulty,
                progress_pct: progressPct,
                correct_pct: correctPct,
                incorrect_pct: incorrectPct,
            });
            statisticsStore.recordGame({
                difficulty: saved.difficulty,
                elapsedSeconds: saved.elapsedSeconds,
                completed: false,
                hintsUsed: saved.hintsUsed,
                replay: saved.replay,
            });
            await gameStore.clearSavedGame();
        }
        await startGame(difficulty);
    };

    return { startNewGame, continueGame, puzzleLoader };
};
