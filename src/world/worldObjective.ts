import type { PlayerProgress } from '../progression'

export type WorldObjectiveRegion = 'javascript' | 'typescript'
export type WorldObjectiveStatus = 'encounter' | 'boss' | 'clear'

export type WorldObjective = {
  region: WorldObjectiveRegion
  label: string
  clearedBattles: number
  totalBattles: 3
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
  stageIds: readonly [number, number, number]
  areaId: string
  encounterFirst: string
  encounterNext: string
  bossNext: string
  clearNext: string
}

const definitions: readonly RegionDefinition[] = [
  {
    region: 'javascript',
    label: 'JAVASCRIPT KINGDOM',
    stageIds: [1, 2, 3],
    areaId: 'javascript',
    encounterFirst: '西の草原の異変を調べる',
    encounterNext: '黒い結晶の痕跡を追う',
    bossNext: '西の砦へ向かう',
    clearNext: '王国に平和が戻った',
  },
  {
    region: 'typescript',
    label: 'TYPESCRIPT FOREST',
    stageIds: [4, 5, 6],
    areaId: 'typescript',
    encounterFirst: '森でTypeScript Battle',
    encounterNext: '森で次のTypeScript Battle',
    bossNext: '東のBOSSへ',
    clearNext: 'AREA CLEAR',
  },
]

function getDefinition(region: WorldObjectiveRegion): RegionDefinition {
  return definitions.find((definition) => definition.region === region) ?? definitions[0]
}

export function getWorldObjective(
  region: WorldObjectiveRegion,
  progress: WorldProgressSnapshot,
): WorldObjective {
  const definition = getDefinition(region)
  const clearedBattles = definition.stageIds.filter((stageId) =>
    progress.clearedStageIds.includes(stageId),
  ).length
  const areaCleared =
    progress.clearedAreaIds.includes(definition.areaId) ||
    progress.clearedStageIds.includes(definition.stageIds[2])
  const bossUnlocked =
    areaCleared ||
    progress.unlockedStageIds.includes(definition.stageIds[2]) ||
    progress.clearedStageIds.includes(definition.stageIds[1])

  if (areaCleared) {
    return {
      region,
      label: definition.label,
      clearedBattles: 3,
      totalBattles: 3,
      status: 'clear',
      next: definition.clearNext,
      bossUnlocked: true,
    }
  }

  if (bossUnlocked) {
    return {
      region,
      label: definition.label,
      clearedBattles: Math.max(2, clearedBattles),
      totalBattles: 3,
      status: 'boss',
      next: definition.bossNext,
      bossUnlocked: true,
    }
  }

  return {
    region,
    label: definition.label,
    clearedBattles,
    totalBattles: 3,
    status: 'encounter',
    next: clearedBattles === 0 ? definition.encounterFirst : definition.encounterNext,
    bossUnlocked: false,
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
        progressLabel: '3 / 3',
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
