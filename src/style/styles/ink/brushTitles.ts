/**
 * The ink style's brushed titles (data-skin title, complete-title and dialog-title): the home title, the
 * completion title and the titles of the new-game, leave-game, clear-records and walkthrough dialogs.
 * scripts/generate-fonts.ts cuts Yuji Boku to these strings in both languages, so a new brushed title
 * adds its key here; any other character falls to LXGW WenKai TC. Relative imports only: the script
 * reads this file.
 */
export const INK_BRUSH_MESSAGE_KEYS: readonly string[] = [
    "home.title",
    "game.complete.title",
    "home.giveUp.title",
    "game.leave.title",
    "settings.data.clearDialog.title",
    "walkthrough.dialog.reset.title",
    "walkthrough.dialog.noSolution.title",
    "walkthrough.dialog.multipleSolutions.title",
    "walkthrough.dialog.solutionCountUnknown.title",
];

/** The brushed titles in one language's messages, read by their dot paths. */
export const inkBrushTitles = (messages: object): string[] => INK_BRUSH_MESSAGE_KEYS.map((path) => {
    const message = path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], messages);
    if (typeof message !== "string" || message === "") throw new Error(`No brushed title at ${path}`);
    return message;
});
