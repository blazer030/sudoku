import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { Difficulty } from "@/domain";
import type {
    GameReplayData,
    GameResult,
    StatisticsRepository,
} from "@/application/statistics/StatisticsRepository";

export interface RecordGameInput {
    difficulty: Difficulty;
    elapsedSeconds: number;
    completed: boolean;
    hintsUsed?: number;
    replay?: GameReplayData;
}

export interface DifficultyStats {
    gamesWon: number;
    gamesPlayed: number;
    bestTime: number | null;
    averageTime: number | null;
}

export interface OverallStats {
    gamesWon: number;
    gamesPlayed: number;
    winRate: number;
}

export interface Statistics {
    easy: DifficultyStats;
    medium: DifficultyStats;
    hard: DifficultyStats;
    overall: OverallStats;
    recentGames: GameResult[];
}

const computeDifficultyStats = (games: GameResult[]): DifficultyStats => {
    const wonGames = games.filter((game) => game.completed);
    return {
        gamesWon: wonGames.length,
        gamesPlayed: games.length,
        bestTime: wonGames.length > 0
            ? Math.min(...wonGames.map((game) => game.elapsedSeconds))
            : null,
        averageTime: wonGames.length > 0
            ? wonGames.reduce((sum, game) => sum + game.elapsedSeconds, 0) / wonGames.length
            : null,
    };
};

export const useStatisticsStore = defineStore("statistics", () => {
    const history = ref<GameResult[]>([]);
    let repository: StatisticsRepository | null = null;

    const setRepository = (repo: StatisticsRepository) => {
        repository = repo;
    };

    const loadFromRepository = async () => {
        if (repository === null) return;
        history.value = await repository.load();
    };

    const persist = () => {
        if (repository === null) return;
        // Fire-and-forget; failures (e.g. storage quota) must not break the UI flow.
        repository.save(history.value).catch(() => { /* swallowed by design */ });
    };

    const recordGame = (input: RecordGameInput) => {
        history.value.push({
            ...input,
            hintsUsed: input.hintsUsed ?? 0,
            date: new Date().toISOString(),
        });
        persist();
    };

    const clearAll = async () => {
        history.value = [];
        if (repository === null) return;
        await repository.clear();
    };

    const statistics = computed<Statistics>(() => {
        const games = history.value;
        const byDifficulty = (difficulty: Difficulty) =>
            games.filter((game) => game.difficulty === difficulty);
        const totalWon = games.filter((game) => game.completed).length;
        return {
            easy: computeDifficultyStats(byDifficulty("easy")),
            medium: computeDifficultyStats(byDifficulty("medium")),
            hard: computeDifficultyStats(byDifficulty("hard")),
            overall: {
                gamesWon: totalWon,
                gamesPlayed: games.length,
                winRate: games.length > 0 ? totalWon / games.length : 0,
            },
            recentGames: [...games].reverse(),
        };
    });

    return {
        history,
        statistics,
        setRepository,
        loadFromRepository,
        recordGame,
        clearAll,
    };
});
