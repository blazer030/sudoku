export class HintTracker {
    private _totalUsed = 0;

    public get totalUsed(): number {
        return this._totalUsed;
    }

    public useHint(): void {
        this._totalUsed++;
    }

    public restore(totalUsed: number): void {
        this._totalUsed = totalUsed;
    }
}
