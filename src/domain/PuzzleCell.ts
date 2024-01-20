class PuzzleCell {
    private readonly _value: number;
    private _input: number;
    private _notes: number[];

    get input(): number {
        return this._input;
    }

    set input(value: number) {
        this._input = value;
    }

    get isTip(): boolean {
        return this._value > 0;
    }

    get isSlot(): boolean {
        return this._value === 0;
    }

    get isEntered(): boolean {
        return this._input > 0;
    }

    get value(): number {
        return this._value;
    }

    get notes(): number[] {
        return this._notes;
    }

    set notes(value: number) {
        if (this._notes.includes(value)) {
            this._notes = this._notes.filter((x) => x !== value);
        } else {
            this._notes.push(value);
        }
    }

    get hasNotes(): boolean {
        return this._notes.length > 0;
    }

    constructor(answer: number) {
        this._value = answer;
        this._input = 0;
        this._notes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
}

export default PuzzleCell;
