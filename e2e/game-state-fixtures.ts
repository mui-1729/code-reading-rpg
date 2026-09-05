import type { Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const DEFAULT_UNLOCKED_SKILL_IDS = [
  'trace',
  'pulse',
  'nova',
  'ts-scan',
  'ts-guard',
  'ts-label',
] as const

type LegacyProgressOverrides = {
  exp?: number
  gold?: number
  patchKit?: number
  clearedStageIds?: readonly number[]
  unlockedStageIds?: readonly number[]
}

type LegacyRpgOverrides = {
  currentHp?: number
  worldPosition?: { x: number; y: number }
}

type LegacyGameStateSeed = {
  progress?: LegacyProgressOverrides
  rpg?: LegacyRpgOverrides
}

/**
 * Seeds the legacy storage records used by E2E migration scenarios.
 *
 * Keep scenario-specific values in each spec and keep only the shared legacy
 * schema/defaults here. Assertions should continue to read the committed root
 * game state through storedGameState.ts.
 */
export async function seedLegacyGameState(page: Page, seed: LegacyGameStateSeed = {}) {
  const progress = seed.progress ?? {}
  const rpg = seed.rpg ?? {}

  const progressSnapshot = {
    version: 4,
    progress: {
      exp: progress.exp ?? 0,
      gold: progress.gold ?? 0,
      inventory: { patchKit: progress.patchKit ?? 0 },
      clearedStageIds: [...(progress.clearedStageIds ?? [])],
      clearedAreaIds: [],
      completedSideQuestIds: [],
      unlockedStageIds: [...(progress.unlockedStageIds ?? [])],
      unlockedSkillIds: [...DEFAULT_UNLOCKED_SKILL_IDS],
    },
  }

  const rpgSnapshot = {
    version: 3,
    state: {
      equipment: {
        weapon: 'training-blade',
        armor: 'traveler-coat',
        accessory: null,
      },
      ownedEquipmentIds: ['training-blade', 'traveler-coat'],
      partyMemberIds: [],
      partyEquipment: {},
      worldPosition: rpg.worldPosition ?? { x: 20, y: 14 },
      stepsSinceEncounter: 8,
      encounterCount: 0,
      currentHp: rpg.currentHp ?? 108,
      openedTreasureIds: [],
    },
  }

  const tutorialSnapshot = { version: 1, status: 'skipped', phase: 'battle' }

  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, progressSnapshot, rpgSnapshot, tutorialSnapshot }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify(progressSnapshot))
      localStorage.setItem(rpgKey, JSON.stringify(rpgSnapshot))
      localStorage.setItem(tutorialKey, JSON.stringify(tutorialSnapshot))
    },
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      progressSnapshot,
      rpgSnapshot,
      tutorialSnapshot,
    },
  )
}
