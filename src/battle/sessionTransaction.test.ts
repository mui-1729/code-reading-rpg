import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression/progression'
import { createInitialRpgState } from '../rpg/state'
import { createDefeatRecoveryState } from './resultHandoff'
import {
  commitBattleSession, getVisibleBattleState, rollbackBattleSession, startBattleSession, updateBattleSession,
  type BattleTransactionState,
} from './sessionTransaction'

const identity = { id: 'attempt-a', areaId: 'javascript', battleId: 7, seed: 'fixed-seed', returnTo: '/world' }
const initial = (): BattleTransactionState => ({
  progress: { ...createInitialPlayerProgress(), gold: 70, inventory: { patchKit: 2 } },
  rpgState: { ...createInitialRpgState(), currentHp: 40 },
})
const useKit = (state: BattleTransactionState) => updateBattleSession(state, identity.id, (current) => ({
  progress: { ...current.progress, inventory: { patchKit: 1 } },
  rpgState: { ...current.rpgState, currentHp: 64 },
}))

describe('Battle attempt transaction', () => {
  it('START snapshots both domains without mutating them; duplicate START is idempotent', () => {
    const before = initial()
    const started = startBattleSession(before, identity)
    const healed = useKit(started)
    expect(before.battleSession).toBeUndefined()
    expect(healed.battleSession).toEqual({ ...before, identity })
    expect(startBattleSession(healed, identity)).toBe(healed)
    expect(before.rpgState.currentHp).toBe(40)
    expect(before.progress.inventory.patchKit).toBe(2)
  })

  it.each(['ABORT', 'RELOAD'])('%s restores HP, inventory and all world/progress state together', () => {
    const before = initial()
    const started = useKit(startBattleSession(before, identity))
    const changed = updateBattleSession(started, identity.id, (current) => ({
      progress: { ...current.progress, gold: 999, clearedStageIds: [7] },
      rpgState: { ...current.rpgState, partyMemberIds: ['byte'], worldPosition: { x: 1, y: 1 } },
    }))
    expect(rollbackBattleSession(changed)).toEqual({ ...before, battleSession: undefined })
  })

  it('RUN commits damage/kit usage with no reward and cannot subsequently be aborted', () => {
    const changed = useKit(startBattleSession(initial(), identity))
    const committed = commitBattleSession(changed, identity.id, 'RUN')
    expect(committed.progress).toEqual(changed.progress)
    expect(committed.rpgState).toEqual(changed.rpgState)
    expect(committed.battleSession).toBeUndefined()
    expect(rollbackBattleSession(committed, identity.id)).toBe(committed)
  })

  it('VICTORY commits reward and current HP atomically and only once', () => {
    const changed = useKit(startBattleSession(initial(), identity))
    const reward = (state: BattleTransactionState) => ({
      ...state, progress: { ...state.progress, gold: state.progress.gold + 20 },
    })
    const committed = commitBattleSession(changed, identity.id, 'VICTORY', reward)
    expect(committed.progress.gold).toBe(90)
    expect(committed.rpgState.currentHp).toBe(64)
    expect(commitBattleSession(committed, identity.id, 'VICTORY', reward)).toBe(committed)
  })

  it('DEFEAT commits the existing hub recovery policy and consumed kit', () => {
    const changed = useKit(startBattleSession(initial(), identity))
    const committed = commitBattleSession(changed, identity.id, 'DEFEAT', (state) => ({
      ...state, rpgState: createDefeatRecoveryState(state.rpgState, 88),
    }))
    expect(committed.rpgState).toMatchObject({ currentHp: 88, worldMapId: 'overworld', stepsSinceEncounter: 8 })
    expect(committed.progress.inventory.patchKit).toBe(1)
    expect(rollbackBattleSession(committed)).toBe(committed)
  })

  it('changing battle first rolls back; stale callbacks/cleanup cannot mutate the next attempt', () => {
    const before = initial()
    const changed = useKit(startBattleSession(before, identity))
    const next = startBattleSession(changed, { ...identity, id: 'attempt-b', battleId: 8 })
    expect(next.progress).toEqual(before.progress)
    expect(next.rpgState).toEqual(before.rpgState)
    expect(useKit(next)).toBe(next)
    expect(commitBattleSession(next, identity.id, 'RUN')).toBe(next)
    expect(rollbackBattleSession(next, identity.id)).toBe(next)
  })

  it('StrictMode setup/cleanup/setup retains the original snapshot', () => {
    const before = initial()
    const first = startBattleSession(before, identity)
    const replay = startBattleSession(rollbackBattleSession(first, identity.id), identity)
    expect(replay).toEqual(first)
    expect(rollbackBattleSession(rollbackBattleSession(replay))).toEqual({ ...before, battleSession: undefined })
  })

  it('Tutorial replay aborts before repositioning; later unmount cannot restore the old position', () => {
    const before = initial()
    before.rpgState.worldPosition = { x: 8, y: 8 }
    const changed = useKit(startBattleSession(before, identity))
    const aborted = rollbackBattleSession(changed)
    const replay = {
      ...aborted,
      rpgState: { ...aborted.rpgState, worldPosition: { x: 20, y: 14 }, stepsSinceEncounter: 0 },
    }
    expect(rollbackBattleSession(replay, identity.id)).toBe(replay)
    expect(replay.rpgState.currentHp).toBe(40)
    expect(replay.progress.inventory.patchKit).toBe(2)
    expect(replay.rpgState.worldPosition).toEqual({ x: 20, y: 14 })
    expect(useKit(replay)).toBe(replay)
  })

  it('foreign World actions use the start snapshot, never tentative healing with rolled-back inventory', () => {
    const before = initial()
    const foreign = useKit(startBattleSession(before, identity))
    expect(getVisibleBattleState(foreign, identity.id).rpgState.currentHp).toBe(64)
    const visible = getVisibleBattleState(foreign, null)
    expect(visible.rpgState.currentHp).toBe(40)
    expect(visible.progress.inventory.patchKit).toBe(2)
    // World movement and Shop both calculate absolute actions from public context.
    const moved = { ...visible.rpgState, worldPosition: { x: 21, y: 14 } }
    const purchased = { ...visible.progress, gold: 40, inventory: { patchKit: 3 } }
    const committed = { ...rollbackBattleSession(foreign), rpgState: moved, progress: purchased }
    expect(committed.rpgState.currentHp).toBe(40)
    expect(committed.progress.inventory.patchKit).toBe(3)
    expect(committed.battleSession).toBeUndefined()
  })
})
