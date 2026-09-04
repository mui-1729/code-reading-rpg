import { expect, test, type Page } from '@playwright/test'
import { selectPauseTab } from './pause-menu-helpers'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedArrival(page: Page) {
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
            gold: 0,
            inventory: { patchKit: 0 },
            clearedStageIds: [],
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
          version: 6,
          state: {
            equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: [],
            partyEquipment: {},
            worldMapId: 'overworld',
            worldPosition: { x: 20, y: 14 },
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
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )
}

test('@responsive 初期Overworldは到着Hubを読めるが遠方のVillage / Forest / TypeScript gateを同一viewportへ詰め込まない', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedArrival(page)
  await page.goto('/world')

  const world = page.locator('.world-viewport[data-world-map="overworld"]')
  await expect(world).toBeVisible()
  await expect(world).toHaveAttribute('data-world-x', '20')
  await expect(world).toHaveAttribute('data-world-y', '14')

  const landing = world.locator('[data-world-x="20"][data-world-y="14"]')
  await expect(landing).toBeVisible()
  const landingMark = await landing.evaluate((element) => ({
    before: getComputedStyle(element, '::before').clipPath,
    after: getComputedStyle(element, '::after').backgroundColor,
  }))
  expect(landingMark.before).not.toBe('none')
  expect(landingMark.after).not.toBe('rgba(0, 0, 0, 0)')

  await expect(world.locator('[data-world-x="19"][data-world-y="14"].terrain-road')).toBeVisible()
  await expect(world.locator('[data-world-x="20"][data-world-y="12"].terrain-shop')).toBeVisible()
  await expect(world.locator('[data-world-x="19"][data-world-y="13"].terrain-npc')).toBeVisible()
  await expect(world.locator('[data-world-x="21"][data-world-y="16"].terrain-recovery')).toBeVisible()
  await expect(world.locator('.terrain-village')).toHaveCount(0)
  await expect(world.locator('.terrain-gate')).toHaveCount(0)

  await page.keyboard.press('ArrowRight')
  await expect(world).toHaveAttribute('data-world-x', '21')
  await page.keyboard.press('ArrowRight')
  await expect(world).toHaveAttribute('data-world-x', '22')
  await page.keyboard.press('ArrowRight')
  await expect(world).toHaveAttribute('data-world-x', '23')

  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  ).toBe(false)
})

test('World Atlasも70×50 Fieldの到着地点・Village・Forest・TypeScript gateを離れた実位置で共有する', async ({ page }) => {
  await seedArrival(page)
  await page.goto('/world')

  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const menu = page.getByRole('dialog', { name: 'メニュー' })
  await selectPauseTab(menu, 'マップ')

  const atlas = page.getByRole('region', { name: 'ワールドマップ' })
  await expect(atlas).toBeVisible()
  const grid = atlas.locator('[data-atlas-map="overworld"] .atlas-terrain-grid')
  await expect(grid).toHaveAttribute('data-terrain-width', '70')
  await expect(grid).toHaveAttribute('data-terrain-height', '50')
  const cells = atlas.locator('[data-atlas-map="overworld"] .atlas-terrain-cell')
  const at = (x: number, y: number) => cells.nth(y * 70 + x)

  await expect(at(19, 14)).toHaveClass(/terrain-road/)
  await expect(at(20, 14)).toHaveClass(/terrain-road/)
  await expect(at(10, 22)).toHaveClass(/terrain-village/)
  await expect(at(34, 34)).toHaveClass(/terrain-woods/)
  await expect(at(52, 14)).toHaveClass(/terrain-stone/)
  await expect(at(62, 14)).toHaveClass(/terrain-gate/)
})
