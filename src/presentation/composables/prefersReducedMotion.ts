/** True when the user asks for reduced motion. Environments without matchMedia count as no preference. */
export const prefersReducedMotion = (): boolean =>
    typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
