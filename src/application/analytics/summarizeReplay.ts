import type { GameReplayData } from "@/application/statistics/StatisticsRepository";

export interface ReplaySummary {
    undoCount: number;
    wrongEntries: number;
    usedNotes: 0 | 1;
}

// A replay that does not begin from a fresh board (a game resumed from a save without history)
// cannot describe the whole game, so it yields no summary instead of partial counts.
export const summarizeReplay = (replay: GameReplayData, answer: readonly (readonly number[])[]): ReplaySummary | null => {
    const startedMidGame = replay.initialBoard.some((row) =>
        row.some((cell) => cell.clue === 0 && (cell.entry !== 0 || cell.notes.length > 0))
    );
    if (startedMidGame) return null;

    let undoCount = 0;
    let wrongEntries = 0;
    let usedNotes: 0 | 1 = 0;
    replay.steps.forEach((step) => {
        if (step.action === "undo") undoCount += 1;
        if (step.action === "fill" && step.value !== answer[step.row][step.column]) wrongEntries += 1;
        if (step.action === "toggleNote" || step.action === "autoNotes") usedNotes = 1;
    });
    return { undoCount, wrongEntries, usedNotes };
};
