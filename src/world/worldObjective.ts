import {
  getAreaBattleSequence,
  getAreaClearedBattleCount,
  getNextAccessibleBattleId,
  getProgressionNode,
  isBattleAccessible,
  type PlayerProgress,
} from '../progression'

export type WorldObjectiveRegion = 'javascript' | 'typescript'
export type WorldObjectiveStatus = 'encounter' | 'boss' | 'clear'

export type WorldObjective = {
  region: WorldObjectiveRegion
  label: string
  clearedBattles: number
  totalBattles: number
  status: WorldObjectiveStatus
  next: string
  bossUnlocked: boolean
}

export type WorldProgressFeedback = {
  kind: 'progress' | 'bossUnlocked' | 'complete'
  region: WorldObjectiveRegion
  heading: 'WORLD PROGRESS' | 'BOSS UNLOCKED' | 'WORLD COMPLETE'
  label: string
  progressLabel: string
  next?: string
}

type WorldProgressSnapshot = Pick<
  PlayerProgress,
  'clearedStageIds' | 'clearedAreaIds' | 'unlockedStageIds'
>

type RegionDefinition = {
  region: WorldObjectiveRegion
  label: string
  areaId: string
  bossBattleId: number
  clearNext: string
}

const definitions: readonly RegionDefinition[] = [
  {
    region: 'javascript',
    label: 'JAVASCRIPT KINGDOM',
    areaId: 'javascript',
    bossBattleId: 3,
    clearNext: '事件解決 // TypeScript地方へ進む',
  },
  {
    region: 'typescript',
    label: 'TYPESCRIPT FRONTIER',
    areaId: 'typescript',
    bossBattleId: 6,
    clearNext: '事件解決 // REAL WORLDへ帰還済み',
  },
]

function getDefinition(region: WorldObjectiveRegion): RegionDefinition {
  return definitions.find((definition) => definition.region === region) ?? definitions[0]
}

function getNextLabel(region: WorldObjectiveRegion, battleId: number | undefined): string {
  if (battleId === undefined) return '次の目的 // Worldを探索する'

  const progressionKey = getProgressionNode(battleId)?.key

  if (region === 'typescript') {
    if (progressionKey === 'ts-api-contract') return '調査 // API更新後の対象ずれを再現する'
    if (progressionKey === 'ts-optional-union') return '調査 // optional / unionの波及経路を追う'
    return '根本原因 // 東のFrontier Compilerを確認する'
  }

  if (progressionKey?.startsWith('js-training-')) {
    return '事件の準備 // Villageで必要な読み方を確認する'
  }
  if (progressionKey === 'js-incident-first') {
    return '最初の異常 // 草原で対象の異常を再現する'
  }
  if (progressionKey?.startsWith('js-forest-')) {
    return '手がかりを追う // Forestで対象条件の流れを追う'
  }
  if (progressionKey === 'js-incident-second') {
    return '第二の異常 // Deep Forest入口で影響拡大を確認する'
  }
  if (progressionKey?.startsWith('js-deep-')) {
    return '原因を追う // Deep Forestを西へ進み原因へ近づく'
  }
  return '根本原因 // Code Coreを確認する'
}

export function getWorldObjective(
  region: WorldObjectiveRegion,
  progress: WorldProgressSnapshot,
): WorldObjective {
  const definition = getDefinition(region)
  const totalBattles = getAreaBattleSequence(region).length
  const clearedBattles = getAreaClearedBattleCount(region, progress.clearedStageIds)
  const areaCleared =
    progress.clearedAreaIds.includes(definition.areaId) ||
    progress.clearedStageIds.includes(definition.bossBattleId)
  const bossUnlocked =
    areaCleared || isBattleAccessible(definition.bossBattleId, progress.clearedStageIds)
  const nextBattleId = getNextAccessibleBattleId(region, progress.clearedStageIds)

  if (areaCleared) {
    return {
      region,
      label: definition.label,
      clearedBattles,
      totalBattles,
      status: 'clear',
      next: definition.clearNext,
      bossUnlocked: true,
    }
  }

  if (bossUnlocked && nextBattleId === definition.bossBattleId) {
    return {
      region,
      label: definition.label,
      clearedBattles,
      totalBattles,
      status: 'boss',
      next: getNextLabel(region, nextBattleId),
      bossUnlocked: true,
    }
  }

  return {
    region,
    label: definition.label,
    clearedBattles,
    totalBattles,
    status: 'encounter',
    next: getNextLabel(region, nextBattleId),
    bossUnlocked,
  }
}

export function getWorldObjectives(progress: WorldProgressSnapshot): WorldObjective[] {
  return definitions.map((definition) => getWorldObjective(definition.region, progress))
}

export function getWorldProgressChange(
  before: WorldProgressSnapshot,
  after: WorldProgressSnapshot,
): WorldProgressFeedback | null {
  for (const definition of definitions) {
    const previous = getWorldObjective(definition.region, before)
    const current = getWorldObjective(definition.region, after)

    if (current.status === 'clear' && previous.status !== 'clear') {
      return {
        kind: 'complete',
        region: current.region,
        heading: 'WORLD COMPLETE',
        label: current.label,
        progressLabel: `${current.clearedBattles} / ${current.totalBattles}`,
        next: current.next,
      }
    }

    if (current.status === 'boss' && previous.status !== 'boss') {
      return {
        kind: 'bossUnlocked',
        region: current.region,
        heading: 'BOSS UNLOCKED',
        label: current.label,
        progressLabel: `${current.clearedBattles} / ${current.totalBattles}`,
        next: current.next,
      }
    }

    if (current.clearedBattles > previous.clearedBattles) {
      return {
        kind: 'progress',
        region: current.region,
        heading: 'WORLD PROGRESS',
        label: current.label,
        progressLabel: `${current.clearedBattles} / ${current.totalBattles}`,
        next: current.next,
      }
    }
  }

  return null
}
