class PuzzleCell {
    private readonly _value: number;
    private _input: number;
    private _notes: number[];

    get input(): number {
        return this._input;
    }

    set input(value: number) {
        if (this.isTip) return;
        
        this._input = value;
        if (value > 0) {
            this._notes = [];
        }
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

    toggleNote(value: number): void {
        if (this.isTip || this.isEntered) return;

        if (this._notes.includes(value)) {
            this._notes = this._notes.filter((note) => note !== value);
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
        this._notes = [];
    }
}

export default PuzzleCell;
