import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedLocalMap(
  page: Page,
  mapId: 'js-forest' | 'js-deep-forest',
  position: { x: number; y: number },
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, mapId, position }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 100,
          inventory: { patchKit: 0 },
          clearedStageIds: [1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15, 16, 17, 18, 19, 20, 21, 22],
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15, 16, 17, 18, 19, 20, 21, 22],
          unlockedSkillIds: ['trace', 'pulse', 'nova'],
        },
      }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 5,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: ['byte'],
          partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
          worldMapId: mapId,
          worldPosition: position,
          stepsSinceEncounter: 0,
          encounterCount: 0,
          currentHp: 108,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY, mapId, position },
  )
  await page.goto('/world')
}

async function roadAxes(page: Page) {
  return page.locator('.world-viewport .terrain-road').evaluateAll((tiles) => {
    const points = tiles.map((tile) => ({
      x: Number((tile as HTMLElement).dataset.worldX),
      y: Number((tile as HTMLElement).dataset.worldY),
    }))
    return {
      count: points.length,
      xCount: new Set(points.map((point) => point.x)).size,
      yCount: new Set(points.map((point) => point.y)).size,
    }
  })
}

test('@responsive Forestはmobile 11×9内でも水平一本道ではなく分岐を見せる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedLocalMap(page, 'js-forest', { x: 25, y: 16 })

  const viewport = page.locator('.world-viewport[data-world-map="js-forest"]')
  await expect(viewport).toBeVisible()
  const roads = await roadAxes(page)
  expect(roads.count).toBeGreaterThan(6)
  expect(roads.xCount).toBeGreaterThan(4)
  expect(roads.yCount).toBeGreaterThan(2)
  await expect(viewport.locator('.terrain-water')).not.toHaveCount(0)
})

test('@responsive Deep ForestはForestより奥でも折れ曲がるmain routeと湿った景観を見せる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedLocalMap(page, 'js-deep-forest', { x: 28, y: 26 })

  const viewport = page.locator('.world-viewport[data-world-map="js-deep-forest"]')
  await expect(viewport).toBeVisible()
  const roads = await roadAxes(page)
  expect(roads.count).toBeGreaterThan(6)
  expect(roads.xCount).toBeGreaterThan(4)
  expect(roads.yCount).toBeGreaterThan(2)
  await expect(viewport.locator('.terrain-water, .terrain-deep-woods')).not.toHaveCount(0)
})

test('固定Battleの目印は文字札ではなく自然景観objectとして表示する', async ({ page }) => {
  await seedLocalMap(page, 'js-forest', { x: 21, y: 23 })

  const landmark = page.locator('.world-progression-landmark[data-progression-battle="12"]')
  await expect(landmark).toBeVisible()
  await expect(landmark).toHaveAttribute('aria-label', '倒木の先で道が合流する場所')
  expect((await landmark.textContent())?.trim()).toBe('')
  const scenery = await landmark.evaluate((element) => ({
    before: getComputedStyle(element, '::before').content,
    after: getComputedStyle(element, '::after').content,
  }))
  expect(scenery.before === 'none' && scenery.after === 'none').toBe(false)
})
