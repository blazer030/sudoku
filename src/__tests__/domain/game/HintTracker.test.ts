import { describe, it, expect } from 'vitest'
import { HintTracker } from '@/domain/game/HintTracker'

describe('HintTracker', () => {
  it('should start with no hints used', () => {
    expect(new HintTracker().totalUsed).toBe(0)
  })

  it('should count the first hint', () => {
    const tracker = new HintTracker()

    tracker.useHint()

    expect(tracker.totalUsed).toBe(1)
  })

  it('should keep counting past the old limit of four', () => {
    const tracker = new HintTracker()

    for (let count = 0; count < 6; count++) tracker.useHint()

    expect(tracker.totalUsed).toBe(6)
  })

  it('should restore state from totalUsed', () => {
    const tracker = new HintTracker()

    tracker.restore(7)
    tracker.useHint()

    expect(tracker.totalUsed).toBe(8)
  })
})
