import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedVillage(page: Page, position: { x: number; y: number }) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, position }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 100,
          inventory: { patchKit: 0 },
          clearedStageIds: [1],
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 7],
          unlockedSkillIds: ['trace', 'pulse', 'nova'],
        },
      }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 6,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: ['byte'],
          partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
          worldMapId: 'js-village',
          worldPosition: position,
          stepsSinceEncounter: 0,
          encounterCount: 0,
          currentHp: 108,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY, position },
  )
  await page.goto('/world')
}

test('GREENFIELD南門から中央districtまで歩くとcameraが追従し離れた道具屋へ到達できる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedVillage(page, { x: 10, y: 21 })

  const viewport = page.locator('.world-viewport[data-world-map="js-village"]')
  await expect(viewport).toHaveAttribute('data-world-y', '21')
  await expect(viewport.locator('[data-world-x="10"][data-world-y="24"].terrain-exit')).toBeVisible()
  await expect(viewport.locator('[data-world-x="15"][data-world-y="11"]')).toHaveCount(0)

  for (let step = 0; step < 9; step += 1) {
    await page.getByRole('button', { name: '上へ移動' }).click()
  }

  await expect(viewport).toHaveAttribute('data-world-y', '12')
  await expect(viewport.locator('[data-world-x="10"][data-world-y="24"]')).toHaveCount(0)
  await expect(viewport.locator('[data-world-x="15"][data-world-y="11"].terrain-house')).toBeVisible()

  for (let step = 0; step < 5; step += 1) {
    await page.getByRole('button', { name: '右へ移動' }).click()
  }
  await expect(viewport).toHaveAttribute('data-world-x', '15')
  await page.getByRole('button', { name: '上へ移動' }).click()
  await expect(viewport).toHaveAttribute('data-world-y', '12')
  await expect(page.getByRole('button', { name: '道具屋を見る' })).toBeVisible()
})

test('GREENFIELD東側の川は通常tileでは進行を止め、橋のrowだけ横断できる', async ({ page }) => {
  await seedVillage(page, { x: 20, y: 13 })

  const viewport = page.locator('.world-viewport[data-world-map="js-village"]')
  const stream = viewport.locator('[data-world-x="21"][data-world-y="13"].terrain-water')
  await expect(stream).toBeVisible()

  await page.getByRole('button', { name: '右へ移動' }).click()
  await expect(viewport).toHaveAttribute('data-world-x', '20')
  await expect(viewport).toHaveAttribute('data-world-y', '13')
  await expect(page.locator('.world-player-sprite')).toHaveAttribute('data-facing', 'right')

  await page.getByRole('button', { name: '下へ移動' }).click()
  await expect(viewport).toHaveAttribute('data-world-y', '14')
  const bridge = viewport.locator('[data-world-x="21"][data-world-y="14"].terrain-road')
  await expect(bridge).toBeVisible()
  await page.getByRole('button', { name: '右へ移動' }).click()
  await expect(viewport).toHaveAttribute('data-world-x', '21')
  await expect(viewport).toHaveAttribute('data-world-y', '14')
})
