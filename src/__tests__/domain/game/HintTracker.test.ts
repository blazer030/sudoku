import { describe, it, expect } from 'vitest'
import { HintTracker } from '@/domain/game/HintTracker'

describe('HintTracker', () => {
  it('should have correct initial state', () => {
    const tracker = new HintTracker()

    expect(tracker.totalUsed).toBe(0)
    expect(tracker.recordedUsed).toBe(0)
    expect(tracker.remainingHints).toBe(4)
    expect(tracker.canUseHint).toBe(true)
  })

  it('should not count first hint as recorded (free hint)', () => {
    const tracker = new HintTracker()

    tracker.useHint()

    expect(tracker.totalUsed).toBe(1)
    expect(tracker.recordedUsed).toBe(0)
    expect(tracker.remainingHints).toBe(3)
    expect(tracker.canUseHint).toBe(true)
  })

  it('should record second hint usage', () => {
    const tracker = new HintTracker()

    tracker.useHint()
    tracker.useHint()

    expect(tracker.totalUsed).toBe(2)
    expect(tracker.recordedUsed).toBe(1)
    expect(tracker.remainingHints).toBe(2)
    expect(tracker.canUseHint).toBe(true)
  })

  it('should disallow hints after using all 4', () => {
    const tracker = new HintTracker()

    tracker.useHint()
    tracker.useHint()
    tracker.useHint()
    tracker.useHint()

    expect(tracker.totalUsed).toBe(4)
    expect(tracker.recordedUsed).toBe(3)
    expect(tracker.remainingHints).toBe(0)
    expect(tracker.canUseHint).toBe(false)
  })

  it('should not increment count beyond max limit', () => {
    const tracker = new HintTracker()

    for (let count = 0; count < 5; count++) tracker.useHint()

    expect(tracker.totalUsed).toBe(4)
    expect(tracker.recordedUsed).toBe(3)
  })

  it('should restore state from totalUsed', () => {
    const tracker = new HintTracker()

    tracker.restore(3)

    expect(tracker.totalUsed).toBe(3)
    expect(tracker.recordedUsed).toBe(2)
    expect(tracker.remainingHints).toBe(1)
    expect(tracker.canUseHint).toBe(true)
  })
})
