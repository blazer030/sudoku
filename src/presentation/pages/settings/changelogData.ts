export interface ChangelogEntry {
    version: string;
    date: string;
    changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "1.6.0",
        date: "2026-04-20",
        changes: [
            "New solver techniques: X-Chain and XY-Chain",
            "Walkthrough visualizes chain links over the board",
            "Added a Changelog page accessible from Settings",
        ],
    },
    {
        version: "1.5.1",
        date: "2026-04-20",
        changes: [
            "Fixed Walkthrough showing playback controls before solving starts",
        ],
    },
    {
        version: "1.5.0",
        date: "2026-04-20",
        changes: [
            "Added Solver Walkthrough page for entering puzzles and watching them solved step by step",
            "Hint now displays the name of the solving technique used",
            "New solver techniques: X-Wing, Swordfish, Jellyfish, XY-Wing, W-Wing, XYZ-Wing, WXYZ-Wing",
            "Puzzle generation enforces difficulty against the techniques required to solve",
        ],
    },
    {
        version: "1.4.0",
        date: "2026-04-16",
        changes: [
            "Added Game Review to replay completed games (open from Statistics)",
            "Smoother playback controls with a draggable progress bar",
            "Sticky headers when scrolling Settings and Game Review",
        ],
    },
    {
        version: "1.3.1",
        date: "2026-04-13",
        changes: [
            "Fixed a game interaction bug",
        ],
    },
    {
        version: "1.3.0",
        date: "2026-04-13",
        changes: [
            "Fireworks effect when completing a game",
            "Each color theme ships its own app icon and PWA manifest",
            "Settings page restyled with a sectioned card layout",
        ],
    },
    {
        version: "1.2.0",
        date: "2026-04-08",
        changes: [
            "Redesigned Settings page with 6 color themes and gameplay toggles",
            "App accent color follows the selected theme",
            "Ripple animation when completing a row, column, or box",
            "Smoother modal and hint popup transitions",
        ],
    },
    {
        version: "1.1.1",
        date: "2026-04-07",
        changes: [
            "Fixed note highlight circles distorting on small screens",
        ],
    },
    {
        version: "1.1.0",
        date: "2026-04-07",
        changes: [
            "Statistics shows an empty state when no games have been played",
            "Clear All Records button on Statistics with confirmation",
            "App version is shown on Settings",
            "Clearing a filled cell also clears the same digit from peer notes",
        ],
    },
];
