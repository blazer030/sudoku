class PuzzleCell {
    private readonly _clue: number;
    private _entry: number;
    private _notes: number[];

    public get entry(): number {
        return this._entry;
    }

    public set entry(value: number) {
        if (this.isClue) return;

        this._entry = value;
        if (value > 0) {
            this._notes = [];
        }
    }

    public get isClue(): boolean {
        return this._clue > 0;
    }

    public get isSlot(): boolean {
        return this._clue === 0;
    }

    public get hasEntry(): boolean {
        return this._entry > 0;
    }

    public get clue(): number {
        return this._clue;
    }

    public get notes(): number[] {
        return this._notes;
    }

    public get hasNotes(): boolean {
        return this._notes.length > 0;
    }

    public constructor(clue: number) {
        this._clue = clue;
        this._entry = 0;
        this._notes = [];
    }

    public raw(): this {
        return this;
    }

    public toggleNote(value: number): void {
        if (this.isClue || this.hasEntry) return;

        if (this._notes.includes(value)) {
            this._notes = this._notes.filter((note) => note !== value);
        } else {
            this._notes.push(value);
        }
    }

    public clearNotes(): void {
        this._notes = [];
    }

    public removeNote(value: number): void {
        this._notes = this._notes.filter((note) => note !== value);
    }

    public restore(entry: number, notes: number[]): void {
        this._entry = entry;
        this._notes = [...notes];
    }
}

export default PuzzleCell;
