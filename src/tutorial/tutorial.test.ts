import { describe, expect, it } from 'vitest'
import {
  completeBattleTutorial,
  completeFieldInteraction,
  completeFieldMove,
  createInitialTutorialState,
  enterBattleTutorial,
  skipTutorial,
} from './tutorial'

describe('tutorial state', () => {
  it('FieldのMOVE → BYTE INTERACT → PARTY → Battleを順に進める', () => {
    const initial = createInitialTutorialState()
    const afterMove = completeFieldMove(initial)
    const afterInteract = completeFieldInteraction(afterMove)
    const battle = enterBattleTutorial(afterInteract)
    const completed = completeBattleTutorial(battle)

    expect(initial).toEqual({ version: 1, status: 'active', phase: 'field-move' })
    expect(afterMove.phase).toBe('field-interact')
    expect(afterInteract.phase).toBe('party-join')
    expect(battle.phase).toBe('battle')
    expect(completed.status).toBe('completed')
    expect(completed.phase).toBe('battle')
  })

  it('Battleへ直接入った場合はField / Party stepを飛ばす', () => {
    const state = enterBattleTutorial(createInitialTutorialState())

    expect(state).toEqual({ version: 1, status: 'active', phase: 'battle' })
  })

  it('PARTY確認前はTutorialを完了できない', () => {
    const party = completeFieldInteraction(completeFieldMove(createInitialTutorialState()))

    expect(completeBattleTutorial(party)).toEqual(party)
    expect(party.status).toBe('active')
  })

  it('想定外のstepからはforwardしない', () => {
    const initial = createInitialTutorialState()

    expect(completeFieldInteraction(initial)).toEqual(initial)
    expect(completeBattleTutorial(initial)).toEqual(initial)
  })

  it('SKIP後はstep transitionしない', () => {
    const skipped = skipTutorial(createInitialTutorialState())

    expect(skipped.status).toBe('skipped')
    expect(completeFieldMove(skipped)).toEqual(skipped)
    expect(enterBattleTutorial(skipped)).toEqual(skipped)
    expect(completeBattleTutorial(skipped)).toEqual(skipped)
  })

  it('完了済みTutorialを再度変更しない', () => {
    const completed = completeBattleTutorial(
      enterBattleTutorial(createInitialTutorialState()),
    )

    expect(completeFieldMove(completed)).toEqual(completed)
    expect(skipTutorial(completed)).toEqual(completed)
  })
})
