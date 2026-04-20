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

export type Scope =
    | { kind: "row"; row: number }
    | { kind: "column"; column: number }
    | { kind: "box"; boxRow: number; boxColumn: number };

export interface ChainLink {
    from: CellReference;
    to: CellReference;
    digit: number;
    type: "strong" | "weak";
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
    | "claiming"
    | "xWing"
    | "swordfish"
    | "jellyfish"
    | "xyWing"
    | "wWing"
    | "xyzWing"
    | "wxyzWing"
    | "xChain"
    | "xyChain";

export interface SolveStep {
    technique: TechniqueId;
    focus: CellReference[];
    assignments: Assignment[];
    eliminations: Elimination[];
    scopes: Scope[];
    supporters?: CellReference[];
    chainLinks?: ChainLink[];
}
