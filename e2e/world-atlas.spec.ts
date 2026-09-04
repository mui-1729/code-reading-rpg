import { expect, test, type Page } from '@playwright/test'
import { JS_COMPLETE, JS_MIDBOSS_PREREQS } from './canonical-progress-fixtures'
import { selectPauseTab } from './pause-menu-helpers'

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
          version: 6,
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
  const menu = page.getByRole('dialog', { name: 'メニュー' })
  await selectPauseTab(menu, 'マップ')
  return page.getByRole('region', { name: 'ワールドマップ' })
}

test('Atlasは現在地のエリアを最初に開きraw座標を通常UIへ出さない', async ({ page }) => {
  await seedWorldAtlas(page, JS_MIDBOSS_PREREQS)
  const atlas = await openAtlas(page)

  await expect(atlas).toBeVisible()
  await expect(atlas.getByText('現在地 · JavaScriptの森', { exact: true })).toBeVisible()
  await expect(atlas.getByText(/現在地 · JavaScriptの森 \(/)).toHaveCount(0)
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
  await expect(atlas.locator('.atlas-terrain-grid')).toHaveAttribute('data-terrain-width', '70')
  await expect(atlas.locator('.atlas-terrain-grid')).toHaveAttribute('data-terrain-height', '50')
  await expect(atlas.locator('.atlas-terrain-cell')).toHaveCount(70 * 50)
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

test('未解放regionは個別placeholderを増やさずcompactな未発見summaryだけ残す', async ({ page }) => {
  await seedWorldAtlas(page, [], 'overworld', { x: 20, y: 14 })
  const atlas = await openAtlas(page)

  await expect(atlas.locator('[data-atlas-region]')).toHaveCount(1)
  await expect(atlas.locator('[data-atlas-region="overworld"]')).toBeEnabled()
  await expect(atlas.locator('[data-atlas-region="ts-frontier"]')).toHaveCount(0)
  await expect(atlas.getByText('未発見エリアあり', { exact: true })).toHaveCount(1)
  await expect(atlas.getByText('TypeScript辺境', { exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: 'メニューを閉じる' }).click()
  await seedWorldAtlas(page, JS_COMPLETE, 'overworld', { x: 20, y: 14 })
  const discoveredAtlas = await openAtlas(page)
  await expect(discoveredAtlas.locator('[data-atlas-region]')).toHaveCount(5)
  await expect(discoveredAtlas.locator('[data-atlas-region="ts-frontier"]')).toContainText('TypeScript辺境')
  await expect(discoveredAtlas.getByText('未発見エリアあり', { exact: true })).toHaveCount(0)
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

test('390pxでは100%で全体を収め、拡大後は地図を縦横にpanできる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedWorldAtlas(page, JS_MIDBOSS_PREREQS)
  const atlas = await openAtlas(page)
  const canvas = atlas.locator('.atlas-detail-canvas')
  const scrollport = atlas.locator('.atlas-scrollport')
  const zoomIn = atlas.getByRole('button', { name: 'ワールドマップを拡大' })
  const zoomOut = atlas.getByRole('button', { name: 'ワールドマップを縮小' })

  await expect(atlas).toHaveAttribute('data-atlas-zoom', '100')
  expect(await canvas.evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(
    await scrollport.evaluate((el) => el.clientWidth + 1),
  )

  await zoomIn.click()
  await zoomIn.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '150')
  const panRange = await scrollport.evaluate((el) => ({
    horizontal: el.scrollWidth - el.clientWidth,
    vertical: el.scrollHeight - el.clientHeight,
    touchAction: getComputedStyle(el).touchAction,
  }))
  expect(panRange.horizontal).toBeGreaterThan(0)
  expect(panRange.vertical).toBeGreaterThan(0)
  expect(panRange.touchAction).toContain('pan-x')
  expect(panRange.touchAction).toContain('pan-y')

  const moved = await scrollport.evaluate((el) => {
    el.scrollLeft = el.scrollWidth
    el.scrollTop = el.scrollHeight
    return { left: el.scrollLeft, top: el.scrollTop }
  })
  expect(moved.left).toBeGreaterThan(0)
  expect(moved.top).toBeGreaterThan(0)

  await zoomOut.click()
  await zoomOut.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '100')
  await expect(zoomOut).toBeDisabled()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  ).toBe(false)
})

test('mobile landscapeでも150%地図をpage overflowなしで縦横にpanできる', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await seedWorldAtlas(page, JS_MIDBOSS_PREREQS)
  const atlas = await openAtlas(page)
  const scrollport = atlas.locator('.atlas-scrollport')
  const zoomIn = atlas.getByRole('button', { name: 'ワールドマップを拡大' })

  await zoomIn.click()
  await zoomIn.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '150')

  const panRange = await scrollport.evaluate((el) => ({
    horizontal: el.scrollWidth - el.clientWidth,
    vertical: el.scrollHeight - el.clientHeight,
  }))
  expect(panRange.horizontal).toBeGreaterThan(0)
  expect(panRange.vertical).toBeGreaterThan(0)

  const moved = await scrollport.evaluate((el) => {
    el.scrollLeft = el.scrollWidth
    el.scrollTop = el.scrollHeight
    return { left: el.scrollLeft, top: el.scrollTop }
  })
  expect(moved.left).toBeGreaterThan(0)
  expect(moved.top).toBeGreaterThan(0)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  ).toBe(false)
})

test('zoom controlsは100〜150%だけを移動する', async ({ page }) => {
  await seedWorldAtlas(page, JS_MIDBOSS_PREREQS)
  const atlas = await openAtlas(page)
  const zoomIn = atlas.getByRole('button', { name: 'ワールドマップを拡大' })
  const zoomOut = atlas.getByRole('button', { name: 'ワールドマップを縮小' })

  await expect(atlas).toHaveAttribute('data-atlas-zoom', '100')
  await expect(zoomOut).toBeDisabled()
  await zoomIn.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '125')
  await zoomIn.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '150')
  await expect(zoomIn).toBeDisabled()
  await zoomOut.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '125')
  await zoomOut.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '100')
  await expect(zoomOut).toBeDisabled()
})
