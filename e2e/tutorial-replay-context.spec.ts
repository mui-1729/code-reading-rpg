import { readStoredRpg } from './storedGameState'
import { expect, test, type Page } from '@playwright/test'

const TUTORIAL_KEY = 'code-reading-rpg:tutorial'
const RPG_KEY = 'code-reading-rpg:rpg-state'

async function seedReplayState(
  page: Page,
  worldMapId: 'overworld' | 'js-deep-forest',
  worldPosition: { x: number; y: number },
) {
  await page.goto('/')
  await page.evaluate(
    ({ tutorialKey, rpgKey, mapId, position }) => {
      localStorage.clear()
      localStorage.setItem('code-reading-rpg:player-progress', JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 0,
          inventory: { patchKit: 0 },
          clearedStageIds: mapId === 'js-deep-forest' ? [9, 14] : [],
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [7],
          unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'completed', phase: 'battle' }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 4,
        state: {
          equipment: { weapon: 'guard-edge', armor: 'vital-coat', accessory: 'debug-charm' },
          ownedEquipmentIds: ['training-blade', 'guard-edge', 'traveler-coat', 'vital-coat', 'debug-charm'],
          partyMemberIds: ['byte'],
          partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
          worldMapId: mapId,
          worldPosition: position,
          stepsSinceEncounter: 9,
          encounterCount: 12,
          currentHp: 73,
          openedTreasureIds: ['js-debug-cache'],
        },
      }))
    },
    { tutorialKey: TUTORIAL_KEY, rpgKey: RPG_KEY, mapId: worldMapId, position: worldPosition },
  )
}

async function replayTutorial(page: Page) {
  await page.getByRole('button', { name: 'Pause menuを開く' }).click()
  const menu = page.getByRole('dialog', { name: 'Pause menu' })
  await menu.getByRole('button', { name: 'SYSTEM' }).click()
  await menu.getByRole('button', { name: 'REPLAY TUTORIAL' }).click()
}

async function storedRpg(page: Page) {
  return readStoredRpg(page)
}

test('Battle中のREPLAY TUTORIALはWorld開始地点へ戻りMOVEから始める', async ({ page }) => {
  await seedReplayState(page, 'overworld', { x: 8, y: 8 })
  await page.goto('/javascript/battle/7?seed=replay-from-battle&returnTo=%2Fworld')

  const story = page.locator('.battle-story-overlay')
  if (await story.isVisible()) {
    await story.getByRole('button', { name: 'SKIP' }).click()
  }
  await replayTutorial(page)

  await expect(page).toHaveURL(/\/world$/)
  await expect(page.locator('.tutorial-prompt-field')).toContainText('MOVE')
  const map = page.getByLabel('Open world map')
  await expect(map).toHaveAttribute('data-world-map', 'overworld')
  await expect(map).toHaveAttribute('data-world-x', '20')
  await expect(map).toHaveAttribute('data-world-y', '14')

  const stored = await storedRpg(page)
  expect(stored.state.partyMemberIds).toEqual(['byte'])
  expect(stored.state.equipment).toEqual({ weapon: 'guard-edge', armor: 'vital-coat', accessory: 'debug-charm' })
  expect(stored.state.currentHp).toBe(73)
  expect(stored.state.encounterCount).toBe(12)
  expect(stored.state.openedTreasureIds).toEqual(['js-debug-cache'])
})

test('Deep ForestからREPLAYしても同じWorld開始地点へ戻す', async ({ page }) => {
  await seedReplayState(page, 'js-deep-forest', { x: 5, y: 10 })
  await page.goto('/world')
  await expect(page.getByLabel('Deep Forest map')).toBeVisible()

  await replayTutorial(page)

  const map = page.getByLabel('Open world map')
  await expect(map).toHaveAttribute('data-world-map', 'overworld')
  await expect(map).toHaveAttribute('data-world-x', '20')
  await expect(map).toHaveAttribute('data-world-y', '14')
  await expect(page.locator('.tutorial-prompt-field')).toContainText('MOVE')
  const stored = await storedRpg(page)
  expect(stored.state.partyMemberIds).toEqual(['byte'])
  expect(stored.state.currentHp).toBe(73)
})

test('通常の初回direct Battle entryは従来どおりBattle phaseへfallbackする', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((key) => {
    localStorage.clear()
    localStorage.setItem(key, JSON.stringify({ version: 1, status: 'active', phase: 'field-move' }))
  }, TUTORIAL_KEY)
  await page.goto('/javascript/battle/7?seed=direct-first-time')

  await expect.poll(async () =>
    page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.phase, TUTORIAL_KEY),
  ).toBe('battle')
})
