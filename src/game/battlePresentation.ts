import type { BgmTrack } from '../audio/gameAudio'
import type { Battle } from './types'

export type BattleSceneId =
  | 'overworld-incident'
  | 'village-training'
  | 'javascript-forest'
  | 'javascript-deep-forest'
  | 'javascript-core-boss'
  | 'typescript-frontier'
  | 'typescript-core-boss'

export type BattleArenaKind = 'incident' | 'training' | 'field' | 'boss'

export type BattlePresentation = {
  sceneId: BattleSceneId
  arenaKind: BattleArenaKind
  locationLabel: string
  bgmTrack: BgmTrack
  bossDisplayName?: string
  bossVisualId?: 'core-wyrm' | 'contract-titan'
}

const PRESENTATION_BY_BATTLE_ID: Readonly<Record<number, BattlePresentation>> = {
  1: {
    sceneId: 'overworld-incident',
    arenaKind: 'incident',
    locationLabel: 'CENTRAL WILDS · INCIDENT',
    bgmTrack: 'battle',
  },
  7: {
    sceneId: 'village-training',
    arenaKind: 'training',
    locationLabel: 'GREENFIELD TRAINING YARD',
    bgmTrack: 'battle',
  },
  8: {
    sceneId: 'village-training',
    arenaKind: 'training',
    locationLabel: 'GREENFIELD TRAINING YARD',
    bgmTrack: 'battle',
  },
  9: {
    sceneId: 'village-training',
    arenaKind: 'training',
    locationLabel: 'GREENFIELD TRAINING YARD',
    bgmTrack: 'battle',
  },
  10: {
    sceneId: 'javascript-forest',
    arenaKind: 'field',
    locationLabel: 'JAVASCRIPT FOREST',
    bgmTrack: 'battleForest',
  },
  11: {
    sceneId: 'javascript-forest',
    arenaKind: 'field',
    locationLabel: 'JAVASCRIPT FOREST',
    bgmTrack: 'battleForest',
  },
  12: {
    sceneId: 'javascript-forest',
    arenaKind: 'field',
    locationLabel: 'JAVASCRIPT FOREST',
    bgmTrack: 'battleForest',
  },
  13: {
    sceneId: 'javascript-forest',
    arenaKind: 'boss',
    locationLabel: 'FOREST GUARDIAN GROVE',
    bgmTrack: 'battleBoss',
  },
  14: {
    sceneId: 'javascript-forest',
    arenaKind: 'field',
    locationLabel: 'JAVASCRIPT FOREST',
    bgmTrack: 'battleForest',
  },
  2: {
    sceneId: 'javascript-deep-forest',
    arenaKind: 'incident',
    locationLabel: 'DEEP FOREST · SECOND SYMPTOM',
    bgmTrack: 'battleDeepForest',
  },
  15: {
    sceneId: 'javascript-deep-forest',
    arenaKind: 'field',
    locationLabel: 'JAVASCRIPT DEEP FOREST',
    bgmTrack: 'battleDeepForest',
  },
  16: {
    sceneId: 'javascript-deep-forest',
    arenaKind: 'field',
    locationLabel: 'JAVASCRIPT DEEP FOREST',
    bgmTrack: 'battleDeepForest',
  },
  17: {
    sceneId: 'javascript-deep-forest',
    arenaKind: 'field',
    locationLabel: 'JAVASCRIPT DEEP FOREST',
    bgmTrack: 'battleDeepForest',
  },
  18: {
    sceneId: 'javascript-deep-forest',
    arenaKind: 'field',
    locationLabel: 'JAVASCRIPT DEEP FOREST',
    bgmTrack: 'battleDeepForest',
  },
  19: {
    sceneId: 'javascript-deep-forest',
    arenaKind: 'boss',
    locationLabel: 'ROOT GUARDIAN GROVE',
    bgmTrack: 'battleBoss',
  },
  20: {
    sceneId: 'javascript-deep-forest',
    arenaKind: 'field',
    locationLabel: 'JAVASCRIPT DEEP FOREST',
    bgmTrack: 'battleDeepForest',
  },
  21: {
    sceneId: 'javascript-deep-forest',
    arenaKind: 'field',
    locationLabel: 'JAVASCRIPT DEEP FOREST',
    bgmTrack: 'battleDeepForest',
  },
  22: {
    sceneId: 'javascript-deep-forest',
    arenaKind: 'field',
    locationLabel: 'CODE CORE APPROACH',
    bgmTrack: 'battleDeepForest',
  },
  3: {
    sceneId: 'javascript-core-boss',
    arenaKind: 'boss',
    locationLabel: 'CODE CORE · ROOT CHAMBER',
    bgmTrack: 'battleJsBoss',
    bossDisplayName: 'CORE WYRM',
    bossVisualId: 'core-wyrm',
  },
  4: {
    sceneId: 'typescript-frontier',
    arenaKind: 'field',
    locationLabel: 'TYPESCRIPT FRONTIER',
    bgmTrack: 'battleTypeScript',
  },
  5: {
    sceneId: 'typescript-frontier',
    arenaKind: 'field',
    locationLabel: 'TYPESCRIPT FRONTIER',
    bgmTrack: 'battleTypeScript',
  },
  6: {
    sceneId: 'typescript-core-boss',
    arenaKind: 'boss',
    locationLabel: 'FRONTIER CORE · CONTRACT VAULT',
    bgmTrack: 'battleTsBoss',
    bossDisplayName: 'CONTRACT TITAN',
    bossVisualId: 'contract-titan',
  },
}

export function getBattlePresentation(
  battle: Pick<Battle, 'id' | 'areaId' | 'isBoss'>,
): BattlePresentation {
  const authored = PRESENTATION_BY_BATTLE_ID[battle.id]
  if (authored) return authored

  if (battle.areaId === 'typescript') {
    return {
      sceneId: battle.isBoss ? 'typescript-core-boss' : 'typescript-frontier',
      arenaKind: battle.isBoss ? 'boss' : 'field',
      locationLabel: battle.isBoss ? 'FRONTIER CORE · CONTRACT VAULT' : 'TYPESCRIPT FRONTIER',
      bgmTrack: battle.isBoss ? 'battleTsBoss' : 'battleTypeScript',
      ...(battle.isBoss
        ? { bossDisplayName: 'CONTRACT TITAN', bossVisualId: 'contract-titan' as const }
        : {}),
    }
  }

  return {
    sceneId: battle.isBoss ? 'javascript-core-boss' : 'overworld-incident',
    arenaKind: battle.isBoss ? 'boss' : 'field',
    locationLabel: battle.isBoss ? 'CODE CORE · ROOT CHAMBER' : 'CENTRAL WILDS',
    bgmTrack: battle.isBoss ? 'battleJsBoss' : 'battle',
    ...(battle.isBoss
      ? { bossDisplayName: 'CORE WYRM', bossVisualId: 'core-wyrm' as const }
      : {}),
  }
}
