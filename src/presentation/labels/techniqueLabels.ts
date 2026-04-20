import type { TechniqueId } from "@/domain/solver/SolveStep";

export const TECHNIQUE_LABELS: Record<TechniqueId, string> = {
    nakedSingle: "Naked Single",
    hiddenSingle: "Hidden Single",
    nakedPair: "Naked Pair",
    nakedTriple: "Naked Triple",
    nakedQuad: "Naked Quad",
    hiddenPair: "Hidden Pair",
    hiddenTriple: "Hidden Triple",
    hiddenQuad: "Hidden Quad",
    pointing: "Pointing",
    claiming: "Claiming",
    xWing: "X-Wing",
    swordfish: "Swordfish",
    xyWing: "XY-Wing",
    wWing: "W-Wing",
    xyzWing: "XYZ-Wing",
};
