import { expect, test, type Page } from '@playwright/test'
import { JS_COMPLETE } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'
const ZOOM_SETTLE_MS = 180

async function seedAtlas(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, clearedStageIds }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 1 },
            clearedStageIds,
            clearedAreaIds: ['javascript'],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 7],
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
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
            partyMemberIds: ['byte'],
            partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
            worldMapId: 'js-forest',
            worldPosition: { x: 20, y: 20 },
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
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      clearedStageIds: JS_COMPLETE,
    },
  )
  await page.goto('/world')
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  await page.getByRole('button', { name: 'マップ', exact: true }).click()
  return page.getByRole('region', { name: 'ワールドマップ' })
}

async function settleZoom(page: Page) {
  await page.waitForTimeout(ZOOM_SETTLE_MS)
}

async function expectContained(page: Page) {
  const metrics = await page.evaluate(() => {
    const menu = document.querySelector<HTMLElement>('.pause-menu')
    const scrollport = document.querySelector<HTMLElement>('.atlas-scrollport')
    const canvas = document.querySelector<HTMLElement>('.atlas-detail-canvas')
    if (!menu || !scrollport || !canvas) throw new Error('Atlas layout missing')

    const frame = scrollport.getBoundingClientRect()
    const menuRect = menu.getBoundingClientRect()
    const canvasRect = canvas.getBoundingClientRect()
    const style = getComputedStyle(scrollport)
    const outsideX = Math.min(window.innerWidth - 1, Math.floor(frame.right + 2))
    const outsideY = Math.min(window.innerHeight - 1, Math.max(0, Math.floor(frame.top + frame.height / 2)))
    const outside = document.elementFromPoint(outsideX, outsideY)

    return {
      menuLeft: menuRect.left,
      menuRight: menuRect.right,
      frameLeft: frame.left,
      frameRight: frame.right,
      canvasLeft: canvasRect.left,
      canvasRight: canvasRect.right,
      canvasWidth: canvasRect.width,
      clientWidth: scrollport.clientWidth,
      scrollWidth: scrollport.scrollWidth,
      contain: style.contain,
      outsideIsAtlasContent: Boolean(outside?.closest('.atlas-detail-canvas, .atlas-landmark-pin')),
      pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }
  })

  expect(metrics.frameLeft).toBeGreaterThanOrEqual(metrics.menuLeft)
  expect(metrics.frameRight).toBeLessThanOrEqual(metrics.menuRight)
  expect(metrics.contain).toContain('paint')
  expect(metrics.outsideIsAtlasContent).toBe(false)
  expect(metrics.pageOverflow).toBe(false)
  return metrics
}

for (const viewport of [
  { name: 'mobile portrait', width: 390, height: 844 },
  { name: 'mobile landscape', width: 844, height: 390 },
  { name: 'desktop', width: 1280, height: 900 },
]) {
  test(`${viewport.name}で100 / 125 / 150%の地図を固定frame内へcontainする`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const atlas = await seedAtlas(page)
    const scrollport = atlas.locator('.atlas-scrollport')

    await expect(atlas).toHaveAttribute('data-atlas-zoom', '100')
    const at100 = await expectContained(page)
    expect(at100.canvasWidth).toBeLessThanOrEqual(at100.clientWidth + 8)

    const zoomIn = atlas.getByRole('button', { name: 'ワールドマップを拡大' })
    const zoomOut = atlas.getByRole('button', { name: 'ワールドマップを縮小' })
    await zoomIn.click()
    await expect(atlas).toHaveAttribute('data-atlas-zoom', '125')
    await settleZoom(page)
    const at125 = await expectContained(page)
    expect(at125.canvasWidth).toBeGreaterThan(at100.canvasWidth)

    await zoomIn.click()
    await expect(atlas).toHaveAttribute('data-atlas-zoom', '150')
    await settleZoom(page)
    const at150 = await expectContained(page)
    expect(at150.canvasWidth).toBeGreaterThan(at125.canvasWidth)
    expect(at150.scrollWidth).toBeGreaterThanOrEqual(at150.clientWidth)

    await scrollport.evaluate((element) => {
      element.scrollLeft = element.scrollWidth
      element.scrollTop = element.scrollHeight
    })
    await expectContained(page)

    await zoomOut.click()
    await zoomOut.click()
    await expect(atlas).toHaveAttribute('data-atlas-zoom', '100')
    await settleZoom(page)
    const restored = await expectContained(page)
    expect(restored.canvasWidth).toBeLessThanOrEqual(restored.clientWidth + 8)
    await expect(zoomOut).toBeDisabled()
  })
}
