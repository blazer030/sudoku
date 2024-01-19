class PuzzleCell {
    private readonly _answer: number;
    private readonly _isHole: boolean;
    private _note: number[];

    get answer(): number {
        return this._answer;
    }

    get isHole(): boolean {
        return this._isHole;
    }

    get note(): number[] {
        return this._note;
    }

    set note(value: number) {
        if (this._note.includes(value)) {
            this._note = this._note.filter((x) => x !== value);
        } else {
            this._note.push(value);
        }
    }

    constructor(answer: number, isHole: boolean) {
        this._answer = answer;
        this._isHole = isHole;
        this._note = [];
    }
}

export default PuzzleCell;
