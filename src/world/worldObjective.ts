import {
  getAreaBattleSequence,
  getAreaClearedBattleCount,
  getNextAccessibleBattleId,
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
    clearNext: 'INCIDENT CLOSED // TypeScript地方へ進む',
  },
  {
    region: 'typescript',
    label: 'TYPESCRIPT FRONTIER',
    areaId: 'typescript',
    bossBattleId: 6,
    clearNext: 'INCIDENT CLOSED // REAL WORLDへRETURN済み',
  },
]

function getDefinition(region: WorldObjectiveRegion): RegionDefinition {
  return definitions.find((definition) => definition.region === region) ?? definitions[0]
}

function getNextLabel(region: WorldObjectiveRegion, battleId: number | undefined): string {
  if (battleId === undefined) return 'NEXT // Worldを探索する'

  if (region === 'typescript') {
    if (battleId === 4) return 'INVESTIGATE // API更新後のtargetずれを再現する'
    if (battleId === 5) return 'INVESTIGATE // optional / unionの波及経路を追う'
    return 'ROOT CAUSE // 東のFrontier Compilerを確認する'
  }

  if (battleId >= 7 && battleId <= 9) return `TRAINING // Battle ${battleId}を完了する`
  if (battleId >= 10 && battleId <= 12) return `FOREST // Battle ${battleId}の条件を読む`
  if (battleId === 13) return 'MID-BOSS // 森の守り人を突破する'
  if (battleId >= 14 && battleId <= 22) return `DEEP FOREST // Battle ${battleId}を読む`
  if (battleId === 1) return 'INCIDENT // 草原で最初のtarget異変を追う'
  if (battleId === 2) return 'INCIDENT // 二つ目のtarget異変を追う'
  return 'ROOT CAUSE // 北西のCode Coreを確認する'
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
