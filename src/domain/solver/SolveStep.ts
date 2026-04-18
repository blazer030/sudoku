export interface CellReference {
    row: number;
    column: number;
}

export interface Assignment {
    cell: CellReference;
    digit: number;
}

export type TechniqueId = "nakedSingle" | "hiddenSingle";

export interface SolveStep {
    technique: TechniqueId;
    assignments: Assignment[];
}
