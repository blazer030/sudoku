export class HintTracker {
  private _totalUsed = 0

  get totalUsed(): number {
    return this._totalUsed
  }

  useHint(): void {
    this._totalUsed++
  }

  restore(totalUsed: number): void {
    this._totalUsed = totalUsed
  }
}
