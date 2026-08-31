import { expect, test, type Page } from '@playwright/test'
import { JS_MIDBOSS_PREREQS } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorldAtlas(page: Page, clearedStageIds: readonly number[] = []) {
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
            unlockedStageIds: [7],
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
  await seedWorldAtlas(page, JS_MIDBOSS_PREREQS)
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

test('各regionはworldMap定義と同じterrain gridで道と分岐を表示する', async ({ page }) => {
  await seedWorldAtlas(page, JS_MIDBOSS_PREREQS)
  const atlas = await openAtlas(page)

  const forest = atlas.locator('[data-atlas-map="js-forest"]')
  const forestGrid = forest.locator('.atlas-terrain-grid')
  await expect(forestGrid).toHaveAttribute('data-terrain-width', '31')
  await expect(forestGrid).toHaveAttribute('data-terrain-height', '27')
  await expect(forest.locator('.atlas-terrain-cell')).toHaveCount(31 * 27)
  await expect(forest.locator('.atlas-terrain-cell.terrain-road').first()).toBeVisible()
  await expect(forest.locator('.atlas-terrain-cell.terrain-water').first()).toBeVisible()
  await expect(forest.locator('.atlas-terrain-cell.terrain-treasure').first()).toBeVisible()
  await expect(forest.locator('.atlas-terrain-cell.is-player')).toHaveCount(1)

  const overworld = atlas.locator('[data-atlas-map="overworld"]')
  await expect(overworld.locator('.atlas-terrain-grid')).toHaveAttribute('data-terrain-width', '40')
  await expect(overworld.locator('.atlas-terrain-grid')).toHaveAttribute('data-terrain-height', '28')
  await expect(overworld.locator('.atlas-terrain-cell.terrain-boss').first()).toBeVisible()
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
  await expect(atlas.locator('.atlas-terrain-grid').first()).toBeVisible()

  const documentOverflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(documentOverflows).toBe(false)
})

test('スマホAtlasでは本編terrainの疑似装飾をmini mapと凡例へ漏らさない', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await seedWorldAtlas(page)
  const atlas = await openAtlas(page)

  const woodsCell = atlas.locator('.atlas-terrain-cell.terrain-woods').first()
  const deepWoodsCell = atlas.locator('.atlas-terrain-cell.terrain-deep-woods').first()
  const mountainCell = atlas.locator('.atlas-terrain-cell.terrain-mountain').first()
  const woodsLegend = atlas.locator('.atlas-terrain-legend .atlas-legend-woods')

  await expect(woodsCell).toBeVisible()
  await expect(deepWoodsCell).toBeVisible()
  await expect(mountainCell).toBeVisible()
  await expect(woodsLegend).toBeVisible()
  await expect(atlas.locator('.atlas-terrain-legend [class*="terrain-"]')).toHaveCount(0)

  const pseudoContents = await page.evaluate(() => {
    const selectors = [
      '.atlas-terrain-cell.terrain-woods',
      '.atlas-terrain-cell.terrain-deep-woods',
      '.atlas-terrain-cell.terrain-mountain',
      '.atlas-terrain-legend .atlas-legend-woods',
    ]

    return selectors.map((selector) => {
      const element = document.querySelector(selector)
      if (!element) return null
      return {
        before: getComputedStyle(element, '::before').content,
        after: getComputedStyle(element, '::after').content,
      }
    })
  })

  expect(pseudoContents).toEqual([
    { before: 'none', after: 'none' },
    { before: 'none', after: 'none' },
    { before: 'none', after: 'none' },
    { before: 'none', after: 'none' },
  ])
})

test('393px幅でもzoomがAtlas canvasの実寸を75〜150%で変更する', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await seedWorldAtlas(page)
  const atlas = await openAtlas(page)
  const canvas = atlas.locator('.atlas-canvas')
  const zoomIn = page.getByRole('button', { name: 'Zoom in world atlas' })
  const zoomOut = page.getByRole('button', { name: 'Zoom out world atlas' })

  const widthAt100 = await canvas.evaluate((element) => element.getBoundingClientRect().width)
  expect(widthAt100).toBeGreaterThan(600)

  await zoomIn.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '125')
  await expect.poll(() => canvas.evaluate((element) => element.getBoundingClientRect().width))
    .toBeGreaterThan(widthAt100)
  const widthAt125 = await canvas.evaluate((element) => element.getBoundingClientRect().width)

  await zoomIn.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '150')
  await expect.poll(() => canvas.evaluate((element) => element.getBoundingClientRect().width))
    .toBeGreaterThan(widthAt125)

  const scrollportHasHorizontalScroll = await atlas.locator('.atlas-scrollport').evaluate(
    (element) => element.scrollWidth > element.clientWidth,
  )
  expect(scrollportHasHorizontalScroll).toBe(true)

  await zoomOut.click()
  await zoomOut.click()
  await zoomOut.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '75')
  await expect.poll(() => canvas.evaluate((element) => element.getBoundingClientRect().width))
    .toBeLessThan(widthAt100)

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false)
})
