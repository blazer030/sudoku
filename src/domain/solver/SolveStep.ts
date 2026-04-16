export interface CellReference {
    row: number;
    column: number;
}

export interface Assignment {
    cell: CellReference;
    digit: number;
}

export interface SolveStep {
    technique: "nakedSingle";
    assignments: Assignment[];
}
