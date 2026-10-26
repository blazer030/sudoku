// Relative imports only: scripts/ import this file through src/theme/palettes.ts.
import { themeBuilder, type DarkThemeColors, type LightThemeColors, type Neutrals, type StyleDefinition } from "../../../theme/paletteBuilder";
import { mixColors } from "../../../theme/contrast";

// Chalkboard: one fixed palette per mode, from the style-research canvas (Chalk.dc.html). 黑板 (dark) is
// white chalk on a green board with yellow chalk for everything chosen and blue chalk for the player's digits;
// 白板 (light) is black marker on a whiteboard with an orange marker and a blue one. The board and its cells
// are transparent on the page, so every board wash is mixed over the page, as the canvas lays them.
const CHALKBOARD = {
    board: "#2E4B3C",
    chalk: "#F4F1E8",
    paleChalk: "#CFD8CC",
    yellowChalk: "#F7C873",
    onYellowChalk: "#233A2E",
    blueChalk: "#A6D8F2",
    redChalk: "#FF9E9E",
    // The canvas's dialogs: a breath lighter than the board, as far as the red chalk still reads on it
    card: "#30503F",
    // The chalk dust the canvas lays its washes in
    dust: "#FFFFFF",
    // The wooden chalk tray and its lit top edge
    tray: "#8A5A34",
    trayEdge: "#A06C42",
} as const;

const WHITEBOARD = {
    board: "#F5F6F3",
    marker: "#1F2328",
    paleMarker: "#4F5660",
    orangeMarker: "#B04A00",
    onOrangeMarker: "#FFFFFF",
    blueMarker: "#1D5FC2",
    redMarker: "#C62828",
    // The cards' white sheen over the board
    sheen: "#FFFFFF",
    // The grey marker tray and its lit top edge
    tray: "#D7DADF",
    trayEdge: "#E6E8EB",
    // The app icon's frame (the canvas's --ai-frame), a shade darker than the tray
    frame: "#C9CDD3",
} as const;

// The canvas's washes (peer 7.5% or 5%, same digit 14%, soft 18%), as far as the inks drawn on them still read.
// 黑板's red chalk reads only 4.9:1 on the bare board, so the hint's scope and pattern cells, which carry its
// struck-out notes, are barely dusted; the peer and same-digit washes keep the canvas's strength, since an error
// cell takes the error surface instead, and the soft wash eases to 14% under the yellow chalk. 白板's orange
// marker is drawn on the same-digit, pattern and soft washes, so they stay at 8%.
const CHALKBOARD_WASH = { peer: 0.075, scope: 0.02, sameDigit: 0.14, pattern: 0.035, soft: 0.14, error: 0.05 } as const;
const WHITEBOARD_WASH = { peer: 0.05, scope: 0.05, sameDigit: 0.08, pattern: 0.08, soft: 0.08, error: 0.07 } as const;

const CHALKBOARD_DARK_NEUTRALS: Neutrals<DarkThemeColors> = {
    "background": CHALKBOARD.board,
    "card": CHALKBOARD.card,
    "border": mixColors(CHALKBOARD.chalk, 0.6, CHALKBOARD.board),
    "foreground": CHALKBOARD.chalk,
    "foreground-secondary": CHALKBOARD.paleChalk,
    // Between the pale chalk and the board, so the text levels stay apart
    "foreground-muted": "#B4C2B6",
    // Clues sit on the bare board, like every other cell
    "cell-clue": CHALKBOARD.board,
    "danger": CHALKBOARD.redChalk,
    "danger-hover": "#FF8A8A",
    "error": CHALKBOARD.redChalk,
    "error-surface": mixColors(CHALKBOARD.redChalk, CHALKBOARD_WASH.error, CHALKBOARD.board),
    "shadow": "#14231B",
    "on-primary": CHALKBOARD.onYellowChalk,
    "on-danger": CHALKBOARD.onYellowChalk,
    "scrim": "#0A140F",
    "on-scrim": CHALKBOARD.chalk,
    "toast": CHALKBOARD.onYellowChalk,
    "on-toast": CHALKBOARD.chalk,
};

const CHALKBOARD_LIGHT_NEUTRALS: Neutrals<LightThemeColors> = {
    "background": WHITEBOARD.board,
    "card": mixColors(WHITEBOARD.sheen, 0.7, WHITEBOARD.board),
    "border": mixColors(WHITEBOARD.marker, 0.7, WHITEBOARD.board),
    "foreground": WHITEBOARD.marker,
    "foreground-secondary": WHITEBOARD.paleMarker,
    // A shade lighter than the pale marker, still readable on the board and the card
    "foreground-muted": "#636A74",
    "cell-clue": WHITEBOARD.board,
    "danger": WHITEBOARD.redMarker,
    "danger-hover": "#A82121",
    "error": WHITEBOARD.redMarker,
    "error-surface": mixColors(WHITEBOARD.redMarker, WHITEBOARD_WASH.error, WHITEBOARD.board),
    "shadow": WHITEBOARD.marker,
    "on-primary": WHITEBOARD.onOrangeMarker,
    "on-danger": WHITEBOARD.onOrangeMarker,
    "scrim": WHITEBOARD.marker,
    "on-scrim": WHITEBOARD.onOrangeMarker,
    "toast": WHITEBOARD.marker,
    "on-toast": WHITEBOARD.board,
};

// The continue card is a framed card in the board's text; the selected and focus cells have no fill (the
// skin rings them); peer and scope cells are a faint wash of dust or marker, same-digit and pattern cells
// the primary's. The tray, the erase smudge and the board's erased smears and the app icon's frame (the
// wooden tray's wood round the 黑板, grey round the 白板) are chalkboard's own colours. The smudge and the smears
// are the dust or marker itself: the skin lays them as faint washes (color-mix with transparent, at the canvas's
// strength), since they lie over the page's light and shade, a hint's washes and the cards, not the bare board.
const chalkboardTheme = themeBuilder(
    CHALKBOARD_LIGHT_NEUTRALS,
    CHALKBOARD_DARK_NEUTRALS,
    {
        "featured": CHALKBOARD_LIGHT_NEUTRALS.card,
        "on-featured": WHITEBOARD.marker,
        "cell-selected": WHITEBOARD.board,
        "cell-focus": WHITEBOARD.board,
        "cell-peer": mixColors(WHITEBOARD.marker, WHITEBOARD_WASH.peer, WHITEBOARD.board),
        "cell-scope": mixColors(WHITEBOARD.marker, WHITEBOARD_WASH.scope, WHITEBOARD.board),
        "cell-pattern": mixColors(WHITEBOARD.orangeMarker, WHITEBOARD_WASH.pattern, WHITEBOARD.board),
        "tray": WHITEBOARD.tray,
        "tray-edge": WHITEBOARD.trayEdge,
        "smudge": WHITEBOARD.marker,
        "smear": WHITEBOARD.marker,
        "icon-frame": WHITEBOARD.frame,
    },
    {
        "featured": CHALKBOARD_DARK_NEUTRALS.card,
        "on-featured": CHALKBOARD.chalk,
        "primary-light": mixColors(CHALKBOARD.yellowChalk, CHALKBOARD_WASH.soft, CHALKBOARD.board),
        "highlight": mixColors(CHALKBOARD.yellowChalk, CHALKBOARD_WASH.sameDigit, CHALKBOARD.board),
        "cell-selected": CHALKBOARD.board,
        "cell-focus": CHALKBOARD.board,
        "cell-peer": mixColors(CHALKBOARD.dust, CHALKBOARD_WASH.peer, CHALKBOARD.board),
        "cell-scope": mixColors(CHALKBOARD.dust, CHALKBOARD_WASH.scope, CHALKBOARD.board),
        "cell-pattern": mixColors(CHALKBOARD.yellowChalk, CHALKBOARD_WASH.pattern, CHALKBOARD.board),
        "tray": CHALKBOARD.tray,
        "tray-edge": CHALKBOARD.trayEdge,
        "smudge": CHALKBOARD.dust,
        "smear": CHALKBOARD.dust,
        "icon-frame": CHALKBOARD.tray,
    },
);

export const CHALKBOARD_STYLE: StyleDefinition = {
    id: "chalkboard",
    themes: [
        chalkboardTheme("classic",
            {
                "primary": WHITEBOARD.orangeMarker,
                "primary-hover": "#963F00",
                "primary-light": mixColors(WHITEBOARD.orangeMarker, WHITEBOARD_WASH.soft, WHITEBOARD.board),
                "accent": WHITEBOARD.blueMarker,
                "highlight": mixColors(WHITEBOARD.orangeMarker, WHITEBOARD_WASH.sameDigit, WHITEBOARD.board),
            },
            { "primary": CHALKBOARD.yellowChalk, "primary-hover": "#F9D48F", "accent": CHALKBOARD.blueChalk }),
    ],
};
