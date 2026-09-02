import { expect, test, type Page } from '@playwright/test'
import { JS_COMPLETE, JS_MIDBOSS_PREREQS } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorldAtlas(
  page: Page,
  clearedStageIds: readonly number[] = [],
  worldMapId = 'js-forest',
  worldPosition = { x: 20, y: 20 },
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, clearedStageIds, worldMapId, worldPosition }) => {
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
            clearedAreaIds: clearedStageIds.includes(3) ? ['javascript'] : [],
            completedSideQuestIds: [],
            unlockedStageIds: [7],
            unlockedSkillIds: ['trace', 'pulse', 'nova'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 5,
          state: {
            equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: [],
            partyEquipment: {},
            worldMapId,
            worldPosition,
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
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      clearedStageIds,
      worldMapId,
      worldPosition,
    },
  )
  await page.goto('/world')
}

async function openAtlas(page: Page) {
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  await page.getByRole('button', { name: 'マップ', exact: true }).click()
  return page.getByRole('region', { name: 'ワールドマップ' })
}

test('Atlasは現在地のエリアを最初に開きraw座標を通常UIへ出さない', async ({ page }) => {
  await seedWorldAtlas(page, JS_MIDBOSS_PREREQS)
  const atlas = await openAtlas(page)

  await expect(atlas).toBeVisible()
  await expect(atlas.getByText('現在地 · FOREST', { exact: true })).toBeVisible()
  await expect(atlas.getByText(/現在地 · FOREST \(/)).toHaveCount(0)
  await expect(atlas.locator('[data-atlas-region="js-forest"]')).toHaveAttribute('aria-pressed', 'true')
  await expect(atlas.locator('[data-atlas-map="js-forest"]')).toBeVisible()
  await expect(atlas.getByLabel('現在地', { exact: true })).toBeVisible()
})

test('選択した1 regionだけをrenderしmap追加で全terrain cellを積み上げない', async ({ page }) => {
  await seedWorldAtlas(page, JS_COMPLETE)
  const atlas = await openAtlas(page)

  const forestGrid = atlas.locator('.atlas-terrain-grid')
  await expect(forestGrid).toHaveAttribute('data-terrain-width', '31')
  await expect(forestGrid).toHaveAttribute('data-terrain-height', '27')
  await expect(atlas.locator('.atlas-terrain-cell')).toHaveCount(31 * 27)
  await expect(atlas.locator('[data-atlas-map]')).toHaveCount(1)

  await atlas.locator('[data-atlas-region="overworld"]').click()
  await expect(atlas.locator('[data-atlas-map="overworld"]')).toBeVisible()
  await expect(atlas.locator('.atlas-terrain-grid')).toHaveAttribute('data-terrain-width', '40')
  await expect(atlas.locator('.atlas-terrain-cell')).toHaveCount(40 * 28)
  await expect(atlas.locator('[data-atlas-map]')).toHaveCount(1)
})

test('出口 / 中ボス / 宝箱はterrain下の文字一覧ではなく実位置pinで見える', async ({ page }) => {
  await seedWorldAtlas(page, JS_MIDBOSS_PREREQS)
  const atlas = await openAtlas(page)

  await expect(atlas.locator('[data-atlas-landmark="exit"]')).toHaveCount(2)
  await expect(atlas.locator('[data-atlas-landmark="midboss"]')).toHaveCount(1)
  await expect(atlas.locator('[data-atlas-landmark="treasure"]')).toHaveCount(1)
  await expect(atlas.locator('.atlas-landmark-list')).toHaveCount(0)

  const treasurePosition = await atlas.locator('[data-atlas-landmark="treasure"]').evaluate((pin) => ({
    left: (pin as HTMLElement).style.left,
    top: (pin as HTMLElement).style.top,
  }))
  expect(treasurePosition.left).toMatch(/%$/)
  expect(treasurePosition.top).toMatch(/%$/)
})

test('未解放regionは名称とlandmarkをspoilerせず未発見として残す', async ({ page }) => {
  await seedWorldAtlas(page, [], 'overworld', { x: 20, y: 14 })
  const atlas = await openAtlas(page)

  await expect(atlas.getByText('未発見エリア', { exact: true })).toHaveCount(4)
  await expect(atlas.getByText('TS FRONTIER', { exact: true })).toHaveCount(0)
  await expect(atlas.locator('[data-atlas-region="ts-frontier"]')).toBeDisabled()

  await page.getByRole('button', { name: 'メニューを閉じる' }).click()
  await seedWorldAtlas(page, JS_COMPLETE, 'overworld', { x: 20, y: 14 })
  const discoveredAtlas = await openAtlas(page)
  await expect(discoveredAtlas.locator('[data-atlas-region="ts-frontier"]')).toContainText('TS FRONTIER')
  await expect(discoveredAtlas.locator('[data-atlas-region="ts-frontier"]')).toBeEnabled()
})

test('terrainは色だけでなくpattern / glyphを持つ', async ({ page }) => {
  await seedWorldAtlas(page, JS_COMPLETE)
  const atlas = await openAtlas(page)

  const patterns = await atlas.evaluate(() => {
    const style = (selector: string) => {
      const element = document.querySelector(selector)
      return element ? getComputedStyle(element).backgroundImage : ''
    }
    return {
      water: style('.atlas-terrain-cell.terrain-water'),
      woods: style('.atlas-terrain-cell.terrain-woods'),
    }
  })
  expect(patterns.water).not.toBe('none')
  expect(patterns.woods).not.toBe('none')
  await expect(atlas.locator('.atlas-terrain-legend')).toContainText('≈水')
  await expect(atlas.locator('.atlas-terrain-legend')).toContainText('♠森')
})

test('390pxでは全体表示がdefaultでregion全体をviewport内へ収め100%へ切替可能', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedWorldAtlas(page, JS_MIDBOSS_PREREQS)
  const atlas = await openAtlas(page)
  const canvas = atlas.locator('.atlas-detail-canvas')
  const scrollport = atlas.locator('.atlas-scrollport')

  await expect(atlas).toHaveAttribute('data-atlas-zoom', 'fit')
  expect(await canvas.evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(
    await scrollport.evaluate((el) => el.clientWidth),
  )

  await atlas.getByRole('button', { name: '100%', exact: true }).click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '100')
  expect(await scrollport.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)

  await atlas.getByRole('button', { name: '全体', exact: true }).click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', 'fit')
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  ).toBe(false)
})

test('zoom controlsは全体表示から75〜150%のdetail zoomへ移れる', async ({ page }) => {
  await seedWorldAtlas(page, JS_MIDBOSS_PREREQS)
  const atlas = await openAtlas(page)
  const zoomIn = atlas.getByRole('button', { name: 'ワールドマップを拡大' })
  const zoomOut = atlas.getByRole('button', { name: 'ワールドマップを縮小' })

  await zoomIn.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '125')
  await zoomIn.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '150')
  await zoomOut.click()
  await zoomOut.click()
  await zoomOut.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '75')
})
