const localDayKey = (date: Date): string =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

/**
 * Counts the consecutive local calendar days, ending today or yesterday, that hold at least one game.
 * Completion-agnostic by design: it only sees dates, so a given-up game keeps the streak alive.
 */
export const countPlayStreak = (gameDates: readonly string[], now: Date): number => {
    const playedDays = new Set<string>();
    for (const gameDate of gameDates) {
        const date = new Date(gameDate);
        if (Number.isNaN(date.getTime())) continue;
        playedDays.add(localDayKey(date));
    }

    // Step by calendar day rather than by a fixed number of milliseconds so DST changes cannot skip a day.
    const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (!playedDays.has(localDayKey(cursor))) {
        cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;
    while (playedDays.has(localDayKey(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
};
