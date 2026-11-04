/** The icons the app draws. Each style with its own set draws all of them, named as lucide names them. */
export const ICON_NAMES = [
    "ChartBar",
    "Check",
    "ChevronLeft",
    "ChevronRight",
    "CircleAlert",
    "CircleHelp",
    "Crosshair",
    "Database",
    "Eraser",
    "ExternalLink",
    "Eye",
    "EyeOff",
    "Gamepad2",
    "Hash",
    "Highlighter",
    "History",
    "Info",
    "Languages",
    "LayoutGrid",
    "Lightbulb",
    "ListFilter",
    "Palette",
    "Pause",
    "Pencil",
    "PencilLine",
    "Play",
    "Plus",
    "RotateCcw",
    "Save",
    "ScanSearch",
    "Settings",
    "Shapes",
    "Smartphone",
    "Sparkles",
    "StickyNote",
    "SunMoon",
    "Timer",
    "Trash2",
    "TriangleAlert",
    "Trophy",
    "Undo2",
    "Wand2",
    "X",
] as const;

export type IconName = typeof ICON_NAMES[number];

/** A style's own drawings of every icon. */
export interface IconSet {
    viewBox: string;
    svgAttributes?: Readonly<Record<string, string>>;
    /** Markup every drawing shares, put at the start of each <svg>. */
    defs?: string;
    /** The size a drawing is really shown at, for a style that only holds up at some sizes. */
    snapSize?: (size: number) => number;
    /** Each icon's inner markup. `{id}` stands for an id unique to the instance. */
    drawings: Readonly<Record<IconName, string>>;
}
