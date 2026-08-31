import { readStoredRpg } from './storedGameState'
import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorld(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 12,
            gold: 20,
            inventory: { patchKit: 0 },
            clearedStageIds: [1],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 7],
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 3,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: ['byte'],
            partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
            worldPosition: { x: 14, y: 13 },
            stepsSinceEncounter: 8,
            encounterCount: 0,
            currentHp: 108,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )
  await page.goto('/world')
}

async function storedRpgState(page: Page) {
  return readStoredRpg(page)
}

test('JS-01後のOverworld → Village → reload → Overworld round tripを保存する', async ({ page }) => {
  await seedWorld(page)

  const viewport = page.locator('.world-viewport')
  await expect(viewport).toHaveAttribute('data-world-map', 'overworld')
  await expect(viewport).toHaveAttribute('data-world-x', '14')
  await expect(viewport).toHaveAttribute('data-world-y', '13')

  await page.getByRole('button', { name: 'Move up' }).click()

  await expect(page.getByRole('heading', { name: 'GREENFIELD VILLAGE' })).toBeVisible()
  await expect(viewport).toHaveAttribute('data-world-map', 'js-village')
  await expect(viewport).toHaveAttribute('data-world-x', '10')
  await expect(viewport).toHaveAttribute('data-world-y', '12')

  await expect.poll(async () => (await storedRpgState(page)).version).toBe(5)
  await expect.poll(async () => (await storedRpgState(page)).state.worldMapId).toBe('js-village')
  await expect.poll(async () => (await storedRpgState(page)).state.worldPosition).toEqual({
    x: 10,
    y: 12,
  })

  await page.reload()
  await expect(page.getByRole('heading', { name: 'GREENFIELD VILLAGE' })).toBeVisible()
  await expect(viewport).toHaveAttribute('data-world-map', 'js-village')
  await expect(viewport).toHaveAttribute('data-world-x', '10')
  await expect(viewport).toHaveAttribute('data-world-y', '12')

  await page.getByRole('button', { name: 'Move down' }).click()
  await expect(viewport).toHaveAttribute('data-world-y', '13')
  await page.getByRole('button', { name: 'Move down' }).click()

  await expect(page.getByRole('heading', { name: 'CODE WORLD' })).toBeVisible()
  await expect(viewport).toHaveAttribute('data-world-map', 'overworld')
  await expect(viewport).toHaveAttribute('data-world-x', '14')
  await expect(viewport).toHaveAttribute('data-world-y', '13')
  await expect.poll(async () => (await storedRpgState(page)).state.worldMapId).toBe('overworld')
})
