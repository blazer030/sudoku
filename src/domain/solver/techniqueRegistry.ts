import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import type { BoardState } from "@/domain/solver/BoardState";
import type { SolveStep, TechniqueId } from "@/domain/solver/SolveStep";
import { Claiming } from "@/domain/solver/techniques/Claiming";
import { Fish } from "@/domain/solver/techniques/Fish";
import { HiddenSingle } from "@/domain/solver/techniques/HiddenSingle";
import { HiddenSubset } from "@/domain/solver/techniques/HiddenSubset";
import { NakedSingle } from "@/domain/solver/techniques/NakedSingle";
import { NakedSubset } from "@/domain/solver/techniques/NakedSubset";
import { Pointing } from "@/domain/solver/techniques/Pointing";
import type { Technique } from "@/domain/solver/techniques/Technique";
import { WWing } from "@/domain/solver/techniques/WWing";
import { WXYZWing } from "@/domain/solver/techniques/WXYZWing";
import { XChain } from "@/domain/solver/techniques/XChain";
import { XYChain } from "@/domain/solver/techniques/XYChain";
import { XYWing } from "@/domain/solver/techniques/XYWing";
import { XYZWing } from "@/domain/solver/techniques/XYZWing";

/** Every technique the solver knows, in the order it tries them: the simplest that applies is the step taken. */
export const TECHNIQUES: Readonly<Record<TechniqueId, () => Technique>> = {
    nakedSingle: () => new NakedSingle(),
    hiddenSingle: () => new HiddenSingle(),
    nakedPair: () => new NakedSubset(2),
    nakedTriple: () => new NakedSubset(3),
    nakedQuad: () => new NakedSubset(4),
    hiddenPair: () => new HiddenSubset(2),
    hiddenTriple: () => new HiddenSubset(3),
    hiddenQuad: () => new HiddenSubset(4),
    pointing: () => new Pointing(),
    claiming: () => new Claiming(),
    xWing: () => new Fish(2),
    swordfish: () => new Fish(3),
    jellyfish: () => new Fish(4),
    xyWing: () => new XYWing(),
    wWing: () => new WWing(),
    xyzWing: () => new XYZWing(),
    wxyzWing: () => new WXYZWing(),
    xChain: () => new XChain(),
    xyChain: () => new XYChain(),
};

/** The technique ids in solving order. */
export const TECHNIQUE_IDS = Object.keys(TECHNIQUES) as TechniqueId[];

const EASY_TECHNIQUE_IDS: readonly TechniqueId[] = ["nakedSingle", "hiddenSingle"];
const MEDIUM_TECHNIQUE_IDS: readonly TechniqueId[] = [
    ...EASY_TECHNIQUE_IDS,
    "nakedPair", "nakedTriple", "nakedQuad",
    "hiddenPair", "hiddenTriple", "hiddenQuad",
    "pointing", "claiming",
];

/** The techniques a puzzle of each difficulty may need: each tier takes the one below and more. */
export const TECHNIQUE_IDS_BY_DIFFICULTY: Readonly<Record<Difficulty, readonly TechniqueId[]>> = {
    easy: EASY_TECHNIQUE_IDS,
    medium: MEDIUM_TECHNIQUE_IDS,
    hard: TECHNIQUE_IDS,
};

/** Fresh instances of the techniques, in the order given. */
export const createTechniques = (ids: readonly TechniqueId[]): Technique[] => ids.map(id => TECHNIQUES[id]());

/** The step of the first technique that applies, or null when none does. */
export const findFirstStep = (state: BoardState, techniques: readonly Technique[]): SolveStep | null => {
    for (const technique of techniques) {
        const step = technique.find(state);
        if (step) return step;
    }
    return null;
};
