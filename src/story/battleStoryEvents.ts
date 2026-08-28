import { getJavaScriptPostBattleEvent, getJavaScriptPreBattleEvent } from './javascriptBattleEvents'
import { getJavaScriptFilterStoryEvent } from './javascriptFilterEvents'
import { getJavaScriptMidbossStoryEvent } from './javascriptMidbossEvents'
import { getTypeScriptPostBattleEvent, getTypeScriptPreBattleEvent } from './typescriptBattleEvents'
import type { BattleStoryEvent } from './types'

export type BattleStoryPhase = 'pre' | 'post'

const BATTLE_PATH = /^\/(javascript|typescript)\/battle\/(\d+)$/

export function getBattleStoryEvent(
  pathname: string,
  phase: BattleStoryPhase,
): BattleStoryEvent | undefined {
  const match = BATTLE_PATH.exec(pathname)
  if (!match) return undefined

  const area = match[1]
  const battleId = Number(match[2])
  if (!Number.isFinite(battleId)) return undefined

  if (area === 'javascript') {
    return (
      getJavaScriptFilterStoryEvent(battleId, phase) ??
      getJavaScriptMidbossStoryEvent(battleId, phase) ??
      (phase === 'pre'
        ? getJavaScriptPreBattleEvent(battleId)
        : getJavaScriptPostBattleEvent(battleId))
    )
  }

  return phase === 'pre'
    ? getTypeScriptPreBattleEvent(battleId)
    : getTypeScriptPostBattleEvent(battleId)
}
