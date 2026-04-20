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
            "New solver techniques: X-Chain and XY-Chain for puzzles needing chain reasoning",
            "Walkthrough visualizes chain links over the board (solid for strong links, dashed for weak)",
            "Settings Version is now a link to this Changelog page",
        ],
    },
    {
        version: "1.5.1",
        date: "2026-04-20",
        changes: [
            "Fixed Walkthrough page showing playback controls before Solve was clicked",
        ],
    },
    {
        version: "1.5.0",
        date: "2026-04-20",
        changes: [
            "Added Solver Walkthrough page for entering a puzzle and watching it be solved step by step",
            "Hint now uses technique-based solving and shows the technique name in a toast",
            "Puzzle generation validates the target difficulty against technique tiers",
            "Puzzle generation runs in a Web Worker with a loading animation",
            "New solver techniques: X-Wing, Swordfish, Jellyfish, XY-Wing, W-Wing, XYZ-Wing, WXYZ-Wing",
            "Subset and Intersection techniques are also used by Hint and Walkthrough",
        ],
    },
    {
        version: "1.4.0",
        date: "2026-04-16",
        changes: [
            "Added Game Review to replay each move of a completed game",
            "Click any recent game on Statistics to open Review",
            "Draggable progress bar and smoother playback controls",
            "Sticky headers on Settings and Game Review pages",
            "Lucide icons replace emoji in step descriptions",
        ],
    },
    {
        version: "1.3.1",
        date: "2026-04-13",
        changes: [
            "Fixed a type signature bug in the game interaction flow",
        ],
    },
    {
        version: "1.3.0",
        date: "2026-04-13",
        changes: [
            "Fireworks effect on game completion with a full-board flash",
            "Each color theme now ships its own PWA icon, manifest, and favicon",
            "Theme colors unified under a single themeConfig source of truth",
            "Settings page restyled with a card-based sectioned layout",
        ],
    },
    {
        version: "1.2.0",
        date: "2026-04-08",
        changes: [
            "Redesigned Settings page with 6 color themes and gameplay toggles",
            "App-wide accent color follows the selected theme",
            "Ripple flash animation for completed rows, columns, and boxes",
            "Enter and exit animations for modals and the hint popup",
            "Hover effects for interactive buttons",
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
            "Clear All Records button with confirmation dialog on Statistics",
            "App version is now displayed on Settings",
            "Statistics numeric values use Roboto Mono",
            "Clearing a filled cell also clears the same digit from peer cells' notes",
        ],
    },
];
