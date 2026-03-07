const MAX_HINTS = 4
const FREE_HINTS = 1

export class HintTracker {
  private _totalUsed = 0

  get totalUsed(): number {
    return this._totalUsed
  }

  get recordedUsed(): number {
    return Math.max(0, this._totalUsed - FREE_HINTS)
  }

  get remainingHints(): number {
    return MAX_HINTS - this._totalUsed
  }

  get canUseHint(): boolean {
    return this._totalUsed < MAX_HINTS
  }

  useHint(): void {
    if (!this.canUseHint) return
    this._totalUsed++
  }

  restore(totalUsed: number): void {
    this._totalUsed = totalUsed
  }
}
