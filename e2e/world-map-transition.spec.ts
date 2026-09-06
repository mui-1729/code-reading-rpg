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
          version: 6,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: ['byte'],
            partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
            worldMapId: 'overworld',
            worldPosition: { x: 10, y: 21 },
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

test('JS-01後はVillage入口で向くだけでは止まりActionで入りreload後もround tripを保存する', async ({ page }) => {
  await seedWorld(page)

  const viewport = page.locator('.world-viewport')
  const log = page.locator('.world-message p')
  await expect(viewport).toHaveAttribute('data-world-map', 'overworld')
  await expect(viewport).toHaveAttribute('data-world-x', '10')
  await expect(viewport).toHaveAttribute('data-world-y', '21')
  await expect(page.getByRole('button', { name: 'グリーンフィールド村へ入る' })).toBeEnabled()

  const before = await log.textContent()
  await page.getByRole('button', { name: '下へ移動' }).click()

  await expect(page.locator('.world-header')).toBeHidden()
  await expect(viewport).toHaveAttribute('data-world-map', 'overworld')
  await expect(viewport).toHaveAttribute('data-world-x', '10')
  await expect(viewport).toHaveAttribute('data-world-y', '21')
  await expect(page.locator('.world-player-sprite')).toHaveAttribute('data-facing', 'down')
  await expect(log).toHaveText(before ?? '')

  await page.getByRole('button', { name: 'グリーンフィールド村へ入る' }).click()

  await expect(page.getByLabel('グリーンフィールド村のマップ')).toBeVisible()
  await expect(viewport).toHaveAttribute('data-world-map', 'js-village')
  await expect(viewport).toHaveAttribute('data-world-x', '10')
  await expect(viewport).toHaveAttribute('data-world-y', '21')

  await expect.poll(async () => (await storedRpgState(page)).version).toBe(7)
  await expect.poll(async () => (await storedRpgState(page)).state.worldMapId).toBe('js-village')
  await expect.poll(async () => (await storedRpgState(page)).state.worldPosition).toEqual({
    x: 10,
    y: 21,
  })

  await page.reload()
  await expect(page.getByLabel('グリーンフィールド村のマップ')).toBeVisible()
  await expect(viewport).toHaveAttribute('data-world-map', 'js-village')
  await expect(viewport).toHaveAttribute('data-world-x', '10')
  await expect(viewport).toHaveAttribute('data-world-y', '21')

  await page.getByRole('button', { name: '下へ移動' }).click()
  await expect(viewport).toHaveAttribute('data-world-y', '22')
  await page.getByRole('button', { name: '下へ移動' }).click()
  await expect(viewport).toHaveAttribute('data-world-y', '23')
  await page.getByRole('button', { name: '下へ移動' }).click()
  await expect(viewport).toHaveAttribute('data-world-map', 'js-village')
  await expect(viewport).toHaveAttribute('data-world-y', '23')
  await page.getByRole('button', { name: 'JavaScript草原へ入る' }).click()

  await expect(page.locator('.world-header')).toBeHidden()
  await expect(viewport).toHaveAttribute('data-world-map', 'overworld')
  await expect(viewport).toHaveAttribute('data-world-x', '10')
  await expect(viewport).toHaveAttribute('data-world-y', '21')
  await expect.poll(async () => (await storedRpgState(page)).state.worldMapId).toBe('overworld')
})
