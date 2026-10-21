import { useI18n } from "vue-i18n";
import { BOX_SIZE } from "@/domain/board/constants";
import type { CellReference, Scope, SolveStep } from "@/domain/solver/SolveStep";

type ExplanationParameters = Record<string, string | number>;

const compareReadingOrder = (left: CellReference, right: CellReference): number =>
    left.row - right.row || left.column - right.column;

const uniqueCells = (cells: CellReference[]): CellReference[] => {
    const seen = new Set<string>();
    return cells
        .filter((cell) => {
            const key = `${cell.row}:${cell.column}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .sort(compareReadingOrder);
};

const uniqueDigits = (digits: number[]): number[] =>
    [...new Set(digits)].sort((left, right) => left - right);

// Rows, columns and boxes are numbered 1–9; boxes run from the top left to the bottom right.
const scopeNumber = (scope: Scope): number => {
    if (scope.kind === "row") return scope.row + 1;
    if (scope.kind === "column") return scope.column + 1;
    return scope.boxRow + scope.boxColumn / BOX_SIZE + 1;
};

/** Returns a function that explains a solver step in plain words, in the current locale. */
export const useHintExplanation = (): ((step: SolveStep) => string) => {
    const { t } = useI18n();

    const joinAll = (items: string[]): string =>
        items.reduce((previous, next, position) =>
            t(position === items.length - 1 ? "hintMode.list.last" : "hintMode.list.join", { previous, next }),
        );

    const cellName = (cell: CellReference): string =>
        t("hintMode.place.cell", { row: cell.row + 1, column: cell.column + 1 });

    // Names one or two cells outright; longer lists name the first cell and count the rest.
    const cellsName = (cells: CellReference[]): string => {
        const ordered = uniqueCells(cells);
        if (ordered.length <= 2) return joinAll(ordered.map(cellName));
        return t("hintMode.list.more", {
            first: cellName(ordered[0]),
            total: ordered.length,
            others: ordered.length - 1,
        });
    };

    const houseName = (scope: Scope): string =>
        t(`hintMode.place.${scope.kind}`, { number: scopeNumber(scope) });

    const linesName = (scopes: Scope[]): string => {
        const numbers = scopes.map(scopeNumber).sort((left, right) => left - right).map(String);
        const key = scopes[0].kind === "row" ? "hintMode.place.rows" : "hintMode.place.columns";
        return t(key, { numbers: joinAll(numbers) });
    };

    const eliminationParameters = (step: SolveStep): ExplanationParameters => ({
        digit: step.eliminations[0].digit,
        targets: cellsName(step.eliminations.map((elimination) => elimination.cell)),
    });

    const parametersFor = (step: SolveStep): ExplanationParameters => {
        switch (step.technique) {
        case "nakedSingle": {
            const [assignment] = step.assignments;
            return { cell: cellName(assignment.cell), digit: assignment.digit };
        }
        case "hiddenSingle": {
            const [assignment] = step.assignments;
            return { cell: cellName(assignment.cell), digit: assignment.digit, house: houseName(step.scopes[0]) };
        }
        case "nakedPair":
        case "nakedTriple":
        case "nakedQuad":
        case "hiddenPair":
        case "hiddenTriple":
        case "hiddenQuad":
            return {
                cells: cellsName(step.focus),
                house: houseName(step.scopes[0]),
                digits: joinAll(uniqueDigits(step.eliminations.map((elimination) => elimination.digit)).map(String)),
            };
        case "pointing":
        case "claiming": {
            const [box] = step.scopes.filter((scope) => scope.kind === "box");
            const [line] = step.scopes.filter((scope) => scope.kind !== "box");
            return {
                ...eliminationParameters(step),
                box: houseName(box),
                line: houseName(line),
                cells: cellsName(step.focus),
            };
        }
        case "xWing":
        case "swordfish":
        case "jellyfish": {
            // Fish steps list the base lines first, then the cover lines of the other orientation.
            const baseKind = step.scopes[0].kind;
            return {
                ...eliminationParameters(step),
                baseLines: linesName(step.scopes.filter((scope) => scope.kind === baseKind)),
                coverLines: linesName(step.scopes.filter((scope) => scope.kind !== baseKind)),
            };
        }
        case "xyWing":
        case "xyzWing":
        case "wxyzWing": {
            const [pivot, pincerOne, pincerTwo] = step.focus;
            return {
                ...eliminationParameters(step),
                pivot: cellName(pivot),
                pincerOne: cellName(pincerOne),
                pincerTwo: cellName(pincerTwo),
            };
        }
        case "wWing": {
            const [endpointOne, endpointTwo] = step.focus;
            const [supporterOne, supporterTwo] = step.supporters ?? [];
            return {
                ...eliminationParameters(step),
                endpointOne: cellName(endpointOne),
                endpointTwo: cellName(endpointTwo),
                supporterOne: cellName(supporterOne),
                supporterTwo: cellName(supporterTwo),
            };
        }
        case "xChain":
        case "xyChain":
            return {
                ...eliminationParameters(step),
                head: cellName(step.focus[0]),
                tail: cellName(step.focus[step.focus.length - 1]),
            };
        }
    };

    return (step) => t(`hintMode.explanation.${step.technique}`, parametersFor(step));
};
