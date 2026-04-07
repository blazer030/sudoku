import { describe, it, expect } from 'vitest'
import { HintTracker } from '@/domain/game/HintTracker'

describe('HintTracker', () => {
  it('初始狀態 — totalUsed=0, recordedUsed=0, remainingHints=4, canUseHint=true', () => {
    const tracker = new HintTracker()

    expect(tracker.totalUsed).toBe(0)
    expect(tracker.recordedUsed).toBe(0)
    expect(tracker.remainingHints).toBe(4)
    expect(tracker.canUseHint).toBe(true)
  })

  it('使用第 1 次（免費）— totalUsed=1, recordedUsed=0', () => {
    const tracker = new HintTracker()

    tracker.useHint()

    expect(tracker.totalUsed).toBe(1)
    expect(tracker.recordedUsed).toBe(0)
    expect(tracker.remainingHints).toBe(3)
    expect(tracker.canUseHint).toBe(true)
  })

  it('使用第 2 次 — totalUsed=2, recordedUsed=1', () => {
    const tracker = new HintTracker()

    tracker.useHint()
    tracker.useHint()

    expect(tracker.totalUsed).toBe(2)
    expect(tracker.recordedUsed).toBe(1)
    expect(tracker.remainingHints).toBe(2)
    expect(tracker.canUseHint).toBe(true)
  })

  it('使用第 4 次後 — canUseHint=false, recordedUsed=3', () => {
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

  it('超過上限時 useHint 不增加計數', () => {
    const tracker = new HintTracker()

    for (let count = 0; count < 5; count++) tracker.useHint()

    expect(tracker.totalUsed).toBe(4)
    expect(tracker.recordedUsed).toBe(3)
  })

  it('restore(totalUsed) 可恢復狀態', () => {
    const tracker = new HintTracker()

    tracker.restore(3)

    expect(tracker.totalUsed).toBe(3)
    expect(tracker.recordedUsed).toBe(2)
    expect(tracker.remainingHints).toBe(1)
    expect(tracker.canUseHint).toBe(true)
  })
})
