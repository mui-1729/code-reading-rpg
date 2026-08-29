import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorldAtlas(page: Page, clearedStageIds: number[] = []) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, clearedStageIds }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 0 },
            clearedStageIds,
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 4, 7],
            unlockedSkillIds: ['trace', 'pulse', 'nova'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 4,
          state: {
            equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: [],
            partyEquipment: {},
            worldMapId: 'js-forest',
            worldPosition: { x: 20, y: 20 },
            stepsSinceEncounter: 0,
            encounterCount: 0,
            currentHp: 100,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY, clearedStageIds },
  )
  await page.goto('/world')
}

async function openAtlas(page: Page) {
  await page.getByRole('button', { name: 'Pause menuを開く' }).click()
  await page.getByRole('button', { name: 'MAP', exact: true }).click()
  return page.getByRole('region', { name: 'World Atlas' })
}

test('MENUのMAPから5地域と現在地を確認できる', async ({ page }) => {
  await seedWorldAtlas(page)
  const atlas = await openAtlas(page)

  await expect(atlas).toBeVisible()
  await expect(atlas.getByText('OVERWORLD', { exact: true })).toBeVisible()
  await expect(atlas.getByText('GREENFIELD VILLAGE', { exact: true })).toBeVisible()
  await expect(atlas.getByText('FOREST', { exact: true })).toBeVisible()
  await expect(atlas.getByText('DEEP FOREST', { exact: true })).toBeVisible()
  await expect(atlas.getByText('TS FRONTIER', { exact: true })).toBeVisible()
  await expect(atlas.getByText(/CURRENT · FOREST \(20, 20\)/)).toBeVisible()
  await expect(atlas.getByLabel('YOU at 20, 20')).toBeVisible()
})

test('進行条件付きregionはLOCKED表示になりclear後はOPENになる', async ({ page }) => {
  await seedWorldAtlas(page)
  let atlas = await openAtlas(page)
  await expect(atlas.locator('[data-atlas-map="ts-frontier"]')).toContainText('LOCKED · CLEAR BATTLE 3')
  await expect(atlas.locator('[data-atlas-map="js-deep-forest"]')).toContainText('LOCKED · CLEAR BATTLE 14')

  await page.getByRole('button', { name: '×' }).click()
  await seedWorldAtlas(page, [3, 9, 14])
  atlas = await openAtlas(page)
  await expect(atlas.locator('[data-atlas-map="ts-frontier"]')).toContainText('OPEN')
  await expect(atlas.locator('[data-atlas-map="js-forest"]')).toContainText('OPEN')
  await expect(atlas.locator('[data-atlas-map="js-deep-forest"]')).toContainText('OPEN')
})

test('zoom controlsでAtlas倍率を変更できる', async ({ page }) => {
  await seedWorldAtlas(page)
  const atlas = await openAtlas(page)

  await expect(atlas).toHaveAttribute('data-atlas-zoom', '100')
  await page.getByRole('button', { name: 'Zoom in world atlas' }).click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '125')
  await page.getByRole('button', { name: 'Zoom out world atlas' }).click()
  await page.getByRole('button', { name: 'Zoom out world atlas' }).click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '75')
})

test('390px幅でもMAPタブがdocumentの横overflowを発生させない', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedWorldAtlas(page)
  const atlas = await openAtlas(page)
  await expect(atlas).toBeVisible()

  const documentOverflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(documentOverflows).toBe(false)
})
