import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedAtlas(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 10,
            inventory: { patchKit: 0 },
            clearedStageIds: [7, 8, 9, 10, 11, 12, 13, 14, 15],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 2, 3, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
            unlockedSkillIds: ['trace', 'pulse', 'nova'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 4,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: ['byte'],
            partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
            worldMapId: 'js-forest',
            worldPosition: { x: 21, y: 20 },
            stepsSinceEncounter: 0,
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

test('MAPから全5地域と現在地を確認しzoomできる', async ({ page }) => {
  await seedAtlas(page)

  await page.getByRole('button', { name: 'World mapを開く' }).click()
  const dialog = page.getByRole('dialog', { name: 'World map' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('World Atlas')).toBeVisible()

  for (const mapId of ['js-village', 'overworld', 'js-forest', 'js-deep-forest', 'ts-frontier']) {
    await expect(dialog.locator(`[data-atlas-map="${mapId}"]`)).toBeVisible()
  }

  const currentMap = dialog.locator('[data-atlas-map="js-forest"]')
  await expect(currentMap).toHaveClass(/is-current/)
  await expect(currentMap.locator('.world-atlas-tile.is-player')).toHaveCount(1)
  await expect(dialog.getByText('ZOOM 100%')).toBeVisible()

  await dialog.getByRole('button', { name: 'Zoom in map' }).click()
  await expect(dialog.getByText('ZOOM 125%')).toBeVisible()

  await dialog.getByRole('slider', { name: 'Map zoom' }).fill('200')
  await expect(dialog.getByText('ZOOM 200%')).toBeVisible()
})

test('390px幅でもWorld Atlas自体は画面横幅を壊さない', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedAtlas(page)
  await page.getByRole('button', { name: 'World mapを開く' }).click()

  const dialog = page.getByRole('dialog', { name: 'World map' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Zoom in map' }).click()
  await dialog.getByRole('button', { name: 'Zoom in map' }).click()

  const documentOverflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(documentOverflows).toBe(false)

  await expect(dialog.locator('.world-atlas-map-scroll').first()).toBeVisible()
})
