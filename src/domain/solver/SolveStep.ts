export interface CellReference {
    row: number;
    column: number;
}

export interface Assignment {
    cell: CellReference;
    digit: number;
}

export interface Elimination {
    cell: CellReference;
    digit: number;
}

export type TechniqueId =
    | "nakedSingle"
    | "hiddenSingle"
    | "nakedPair"
    | "nakedTriple"
    | "nakedQuad"
    | "hiddenPair"
    | "hiddenTriple"
    | "hiddenQuad"
    | "pointing"
    | "claiming";

export interface SolveStep {
    technique: TechniqueId;
    focus: CellReference[];
    assignments: Assignment[];
    eliminations: Elimination[];
}
