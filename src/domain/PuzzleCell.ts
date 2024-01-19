class PuzzleCell {
    private readonly _value: number;
    private _note: number[];

    get value(): string {
        return this._value > 0 ? this._value.toString() : "";
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

    constructor(answer: number) {
        this._value = answer;
        this._note = [];
    }
}

export default PuzzleCell;
