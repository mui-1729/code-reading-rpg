import { describe, expect, it } from 'vitest'
import { createInitialPlayerProgress } from '../progression/progression'
import { createInitialRpgState } from '../rpg/state'
import {
  BATTLE_RETURN_ENCOUNTER_COOLDOWN,
  commitBattleSession,
  getVisibleBattleState,
  rollbackBattleSession,
  startBattleSession,
  updateBattleSession,
  type BattleRollbackMode,
  type BattleTransactionState,
} from './sessionTransaction'

const identity = { id: 'attempt-a', areaId: 'javascript', battleId: 7, seed: 'fixed-seed', returnTo: '/world' }
const initial = (): BattleTransactionState => ({
  progress: { ...createInitialPlayerProgress(), gold: 70, inventory: { patchKit: 2 } },
  rpgState: {
    ...createInitialRpgState(),
    currentHp: 40,
    stepsSinceEncounter: 4,
    worldPosition: { x: 8, y: 8 },
  },
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

  it.each<BattleRollbackMode>(['retry', 'abort', 'reload'])(
    '%s restores the exact Battle-start HP, inventory, world and progress state',
    (mode) => {
      const before = initial()
      const started = useKit(startBattleSession(before, identity))
      const changed = updateBattleSession(started, identity.id, (current) => ({
        progress: { ...current.progress, gold: 999, clearedStageIds: [7] },
        rpgState: { ...current.rpgState, partyMemberIds: ['byte'], worldPosition: { x: 1, y: 1 } },
      }))
      expect(rollbackBattleSession(changed, identity.id, mode)).toEqual({ ...before, battleSession: undefined })
    },
  )

  it('checkpoint restores Battle-start resources and position without free healing, then grants a safe encounter window', () => {
    const before = initial()
    const changed = useKit(startBattleSession(before, identity))
    const returned = rollbackBattleSession(changed, identity.id, 'checkpoint')

    expect(returned.progress.inventory.patchKit).toBe(2)
    expect(returned.rpgState.currentHp).toBe(40)
    expect(returned.rpgState.worldPosition).toEqual({ x: 8, y: 8 })
    expect(returned.rpgState.stepsSinceEncounter).toBe(BATTLE_RETURN_ENCOUNTER_COOLDOWN)
    expect(returned.battleSession).toBeUndefined()
  })

  it('RUN/escape uses abort rollback so tentative damage and PATCH KIT usage do not persist', () => {
    const before = initial()
    const changed = useKit(startBattleSession(before, identity))
    const escaped = rollbackBattleSession(changed, identity.id, 'abort')

    expect(escaped.progress.inventory.patchKit).toBe(2)
    expect(escaped.rpgState.currentHp).toBe(40)
    expect(escaped.rpgState.worldPosition).toEqual(before.rpgState.worldPosition)
    expect(escaped.battleSession).toBeUndefined()
  })

  it('VICTORY commits reward and current HP atomically and only once', () => {
    const changed = useKit(startBattleSession(initial(), identity))
    const reward = (state: BattleTransactionState) => ({
      ...state, progress: { ...state.progress, gold: state.progress.gold + 20 },
    })
    const committed = commitBattleSession(changed, identity.id, 'VICTORY', reward)
    expect(committed.progress.gold).toBe(90)
    expect(committed.progress.inventory.patchKit).toBe(1)
    expect(committed.rpgState.currentHp).toBe(64)
    expect(commitBattleSession(committed, identity.id, 'VICTORY', reward)).toBe(committed)
  })

  it('changing battle first rolls back; stale callbacks/cleanup cannot mutate the next attempt', () => {
    const before = initial()
    const changed = useKit(startBattleSession(before, identity))
    const next = startBattleSession(changed, { ...identity, id: 'attempt-b', battleId: 8 })
    expect(next.progress).toEqual(before.progress)
    expect(next.rpgState).toEqual(before.rpgState)
    expect(useKit(next)).toBe(next)
    expect(commitBattleSession(next, identity.id, 'VICTORY')).toBe(next)
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
