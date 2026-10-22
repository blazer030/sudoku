/**
 * The hint panel's height with its explanation at the smallest size it may shrink to: everything
 * that must stay on screen, the step row, one line of explanation, the buttons and the caption.
 */
export const minimumPanelHeight = (panel: HTMLElement): number => {
    const explanation = panel.querySelector<HTMLElement>("[data-testid='hint-explanation-region']");
    if (explanation === null) return panel.scrollHeight;
    const explanationMinimum = Number.parseFloat(getComputedStyle(explanation).minHeight) || 0;
    return panel.scrollHeight - Math.max(0, explanation.clientHeight - explanationMinimum);
};

/** How far the panel rises over the board so its smallest layout still ends inside `room`. */
export const panelLift = (room: number, minimumHeight: number): number =>
    Math.max(0, Math.ceil(minimumHeight - room));
