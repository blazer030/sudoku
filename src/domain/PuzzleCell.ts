class PuzzleCell {
    private readonly _value: number;
    private _entry: number;
    private _notes: number[];

    get entry(): number {
        return this._entry;
    }

    set entry(value: number) {
        if (this.isClue) return;

        this._entry = value;
        if (value > 0) {
            this._notes = [];
        }
    }

    get isClue(): boolean {
        return this._value > 0;
    }

    get isSlot(): boolean {
        return this._value === 0;
    }

    get hasEntry(): boolean {
        return this._entry > 0;
    }

    get value(): number {
        return this._value;
    }

    get notes(): number[] {
        return this._notes;
    }

    get hasNotes(): boolean {
        return this._notes.length > 0;
    }

    constructor(answer: number) {
        this._value = answer;
        this._entry = 0;
        this._notes = [];
    }

    toggleNote(value: number): void {
        if (this.isClue || this.hasEntry) return;

        if (this._notes.includes(value)) {
            this._notes = this._notes.filter((note) => note !== value);
        } else {
            this._notes.push(value);
        }
    }

    clearNotes(): void {
        this._notes = [];
    }

    removeNote(value: number): void {
        this._notes = this._notes.filter((note) => note !== value);
    }

    restore(entry: number, notes: number[]): void {
        this._entry = entry;
        this._notes = [...notes];
    }
}

export default PuzzleCell;
