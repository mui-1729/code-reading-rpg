import { expect, test, type Page } from '@playwright/test'
import { JS_COMPLETE, JS_MIDBOSS_PREREQS } from './canonical-progress-fixtures'
import { selectPauseTab } from './pause-menu-helpers'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

type ExplorationSeed = {
  revealedWorldCells?: Record<string, string[]>
  ownedWorldMapIds?: string[]
}

async function seedWorldAtlas(
  page: Page,
  clearedStageIds: readonly number[] = [],
  worldMapId = 'js-forest',
  worldPosition = { x: 24, y: 25 },
  exploration: ExplorationSeed = {},
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, clearedStageIds, worldMapId, worldPosition, exploration }) => {
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
            unlockedStageIds: [1, 7],
            unlockedSkillIds: ['trace', 'pulse', 'nova'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 8,
          state: {
            equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: [],
            partyEquipment: {},
            worldMapId,
            worldPosition,
            safeCheckpoint: {
              id: 'central-hub',
              mapId: 'overworld',
              position: { x: 20, y: 14 },
            },
            stepsSinceEncounter: 0,
            encounterCount: 0,
            currentHp: 100,
            openedTreasureIds: [],
            revealedWorldCells: exploration.revealedWorldCells ?? {},
            ownedWorldMapIds: exploration.ownedWorldMapIds ?? [],
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
      exploration,
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

async function dragScrollport(page: Page, scrollport: ReturnType<Page['locator']>) {
  const box = await scrollport.boundingBox()
  if (!box) throw new Error('atlas scrollport geometry is unavailable')

  const viewport = page.viewportSize()
  if (!viewport) throw new Error('viewport geometry is unavailable')
  const pauseBox = await page.locator('.pause-content').boundingBox()
  if (!pauseBox) throw new Error('pause content geometry is unavailable')

  const visibleLeft = Math.max(box.x, pauseBox.x, 0)
  const visibleTop = Math.max(box.y, pauseBox.y, 0)
  const visibleRight = Math.min(box.x + box.width, pauseBox.x + pauseBox.width, viewport.width)
  const visibleBottom = Math.min(box.y + box.height, pauseBox.y + pauseBox.height, viewport.height)
  const visibleWidth = visibleRight - visibleLeft
  const visibleHeight = visibleBottom - visibleTop
  if (visibleWidth <= 24 || visibleHeight <= 24) {
    throw new Error('atlas scrollport does not have a usable visible drag area')
  }

  const startX = visibleLeft + visibleWidth * 0.68
  const startY = visibleTop + visibleHeight * 0.68
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(
    startX - Math.min(110, visibleWidth * 0.28),
    startY - Math.min(90, visibleHeight * 0.28),
    { steps: 8 },
  )
  await page.mouse.up()
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
  await expect(atlas.locator('[data-atlas-visibility="explored"]')).toHaveCount(25)
  await expect(atlas.locator('[data-atlas-visibility="fog"]')).toHaveCount(55 * 41 - 25)
})

test('歩くごとに探索済みcellが蓄積してAtlasへ残る', async ({ page }) => {
  await seedWorldAtlas(page, [], 'overworld', { x: 20, y: 14 })
  let atlas = await openAtlas(page)
  await expect(atlas.locator('[data-atlas-visibility="explored"]')).toHaveCount(25)

  await page.getByRole('button', { name: 'メニューを閉じる' }).click()
  await page.keyboard.press('ArrowRight')
  atlas = await openAtlas(page)
  await expect(atlas.locator('[data-atlas-visibility="explored"]')).toHaveCount(30)
})

test('選択した1 regionだけをrenderしmap追加で全terrain cellを積み上げない', async ({ page }) => {
  await seedWorldAtlas(page, JS_COMPLETE)
  const atlas = await openAtlas(page)

  const forestGrid = atlas.locator('.atlas-terrain-grid')
  await expect(forestGrid).toHaveAttribute('data-terrain-width', '55')
  await expect(forestGrid).toHaveAttribute('data-terrain-height', '41')
  await expect(atlas.locator('.atlas-terrain-cell')).toHaveCount(55 * 41)
  await expect(atlas.locator('[data-atlas-map]')).toHaveCount(1)

  await atlas.locator('[data-atlas-region="overworld"]').click()
  await expect(atlas.locator('[data-atlas-map="overworld"]')).toBeVisible()
  await expect(atlas.locator('.atlas-terrain-grid')).toHaveAttribute('data-terrain-width', '70')
  await expect(atlas.locator('.atlas-terrain-grid')).toHaveAttribute('data-terrain-height', '50')
  await expect(atlas.locator('.atlas-terrain-cell')).toHaveCount(70 * 50)
  await expect(atlas.locator('[data-atlas-map]')).toHaveCount(1)
})

test('探索済みの出口 / 中ボス / 宝箱だけを実位置pinで見せる', async ({ page }) => {
  await seedWorldAtlas(
    page,
    JS_MIDBOSS_PREREQS,
    'js-forest',
    { x: 24, y: 25 },
    { revealedWorldCells: { 'js-forest': ['54:20', '1:23', '15:16', '40:6'] } },
  )
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
  await expect(discoveredAtlas.locator('[data-atlas-region]')).toHaveCount(6)
  await expect(discoveredAtlas.locator('[data-atlas-region="js-forest-settlement"]')).toContainText('森番の集落')
  await expect(discoveredAtlas.locator('[data-atlas-region="ts-frontier"]')).toContainText('TypeScript辺境')
  await expect(discoveredAtlas.getByText('未発見エリアあり', { exact: true })).toHaveCount(0)
})

test('地域地図は通常terrainを表示するが未探索の宝箱位置を漏らさない', async ({ page }) => {
  await seedWorldAtlas(
    page,
    JS_COMPLETE,
    'js-forest',
    { x: 24, y: 25 },
    { ownedWorldMapIds: ['js-forest'] },
  )
  const atlas = await openAtlas(page)
  const cells = atlas.locator('.atlas-terrain-cell')
  const treasureCell = cells.nth(6 * 55 + 40)

  await expect(atlas.locator('[data-atlas-visibility="fog"]')).toHaveCount(0)
  await expect(treasureCell).toHaveAttribute('data-atlas-visibility', 'charted')
  await expect(treasureCell).toHaveClass(/terrain-woods/)
  await expect(treasureCell).not.toHaveClass(/terrain-treasure/)
  await expect(atlas.locator('[data-atlas-landmark="treasure"]')).toHaveCount(0)
  await expect(atlas.getByText(/地域地図購入済み/)).toBeVisible()
})

test('terrainは色だけでなくpattern / glyphを持つ', async ({ page }) => {
  await seedWorldAtlas(
    page,
    JS_COMPLETE,
    'js-forest',
    { x: 24, y: 25 },
    { ownedWorldMapIds: ['js-forest'] },
  )
  const atlas = await openAtlas(page)

  const patterns = await atlas.evaluate(() => {
    const style = (selector: string) => {
      const element = document.querySelector(selector)
      return element ? getComputedStyle(element).backgroundImage : ''
    }
    return {
      water: style('.atlas-terrain-cell.terrain-water'),
      woods: style('.atlas-terrain-cell.terrain-woods'),
      fog: style('.atlas-terrain-cell.is-fogged'),
    }
  })
  expect(patterns.water).not.toBe('none')
  expect(patterns.woods).not.toBe('none')
  expect(patterns.fog).toBe('')
  await expect(atlas.locator('.atlas-terrain-legend')).toContainText('≈水')
  await expect(atlas.locator('.atlas-terrain-legend')).toContainText('♠森')
  await expect(atlas.locator('.atlas-terrain-legend')).toContainText('■未踏')
})

test('390pxでは100%で全体を収め、拡大後は実際のdragで地図を縦横にpanできる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedWorldAtlas(page, JS_MIDBOSS_PREREQS)
  const atlas = await openAtlas(page)
  const canvas = atlas.locator('.atlas-detail-canvas')
  const scrollport = atlas.locator('.atlas-scrollport')
  const pauseContent = page.locator('.pause-content')
  const zoomIn = atlas.getByRole('button', { name: 'ワールドマップを拡大' })
  const zoomOut = atlas.getByRole('button', { name: 'ワールドマップを縮小' })

  await expect(atlas).toHaveAttribute('data-atlas-zoom', '100')
  expect(await canvas.evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(
    await scrollport.evaluate((el) => el.clientWidth + 1),
  )

  await zoomIn.click()
  await zoomIn.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '150')
  await expect(canvas).toHaveCSS('width', '975px')
  await expect.poll(async () => scrollport.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeGreaterThan(0)
  await expect.poll(async () => scrollport.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeGreaterThan(0)
  expect(await scrollport.evaluate((el) => getComputedStyle(el).touchAction)).toBe('none')

  await scrollport.scrollIntoViewIfNeeded()
  const before = await scrollport.evaluate((el) => ({ left: el.scrollLeft, top: el.scrollTop }))
  const outerBefore = await pauseContent.evaluate((el) => el.scrollTop)
  await dragScrollport(page, scrollport)
  const after = await scrollport.evaluate((el) => ({ left: el.scrollLeft, top: el.scrollTop }))
  const outerAfter = await pauseContent.evaluate((el) => el.scrollTop)

  expect(after.left).toBeGreaterThan(before.left)
  expect(after.top).toBeGreaterThan(before.top)
  expect(outerAfter).toBe(outerBefore)

  await zoomOut.click()
  await zoomOut.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '100')
  await expect(zoomOut).toBeDisabled()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  ).toBe(false)
})

test('mobile landscapeでも150%地図をpage overflowなしで実際にdragできる', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await seedWorldAtlas(page, JS_MIDBOSS_PREREQS)
  const atlas = await openAtlas(page)
  const canvas = atlas.locator('.atlas-detail-canvas')
  const scrollport = atlas.locator('.atlas-scrollport')
  const pauseContent = page.locator('.pause-content')
  const zoomIn = atlas.getByRole('button', { name: 'ワールドマップを拡大' })

  await zoomIn.click()
  await zoomIn.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '150')
  await expect(canvas).toHaveCSS('width', '975px')
  await expect.poll(async () => scrollport.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeGreaterThan(0)
  await expect.poll(async () => scrollport.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeGreaterThan(0)

  await scrollport.scrollIntoViewIfNeeded()
  const before = await scrollport.evaluate((el) => ({ left: el.scrollLeft, top: el.scrollTop }))
  const outerBefore = await pauseContent.evaluate((el) => el.scrollTop)
  await dragScrollport(page, scrollport)
  const after = await scrollport.evaluate((el) => ({ left: el.scrollLeft, top: el.scrollTop }))
  const outerAfter = await pauseContent.evaluate((el) => el.scrollTop)

  expect(after.left).toBeGreaterThan(before.left)
  expect(after.top).toBeGreaterThan(before.top)
  expect(outerAfter).toBe(outerBefore)
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
