export interface AbandonProgress {
    progressPct: number;
    correctPct: number;
    incorrectPct: number;
}

interface ProgressCell {
    readonly clue: number;
    readonly entry: number;
}

const toPercent = (count: number, total: number): number => Math.round((count / total) * 100);

// Measures only the player's own work: clue cells are excluded from every count and from the denominator.
export const computeAbandonProgress = (puzzle: readonly (readonly ProgressCell[])[], answer: readonly (readonly number[])[]): AbandonProgress => {
    let playerCells = 0;
    let filled = 0;
    let correct = 0;
    puzzle.forEach((row, rowIndex) => {
        row.forEach((cell, columnIndex) => {
            if (cell.clue > 0) return;
            playerCells += 1;
            if (cell.entry === 0) return;
            filled += 1;
            if (cell.entry === answer[rowIndex][columnIndex]) correct += 1;
        });
    });
    if (playerCells === 0) return { progressPct: 0, correctPct: 0, incorrectPct: 0 };
    return {
        progressPct: toPercent(filled, playerCells),
        correctPct: toPercent(correct, playerCells),
        incorrectPct: toPercent(filled - correct, playerCells),
    };
};
