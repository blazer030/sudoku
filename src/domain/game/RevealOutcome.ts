import type { CellReference } from "@/domain/board/CellReference";

export interface RevealOutcome {
    cell: CellReference;
    value: number;
}
