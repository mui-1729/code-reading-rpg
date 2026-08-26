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
  it('FieldのMOVE → INTERACT → Battleを順に進める', () => {
    const initial = createInitialTutorialState()
    const afterMove = completeFieldMove(initial)
    const afterInteract = completeFieldInteraction(afterMove)
    const completed = completeBattleTutorial(afterInteract)

    expect(initial).toEqual({ version: 1, status: 'active', phase: 'field-move' })
    expect(afterMove.phase).toBe('field-interact')
    expect(afterInteract.phase).toBe('battle')
    expect(completed.status).toBe('completed')
    expect(completed.phase).toBe('battle')
  })

  it('Battleへ直接入った場合はField stepを飛ばす', () => {
    const state = enterBattleTutorial(createInitialTutorialState())

    expect(state).toEqual({ version: 1, status: 'active', phase: 'battle' })
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
