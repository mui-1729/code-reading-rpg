import { expect, test } from '@playwright/test'
import { selectPauseTab } from './pause-menu-helpers'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorld(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 100,
            gold: 100,
            inventory: { patchKit: 2 },
            clearedStageIds: [1, 7, 8, 9],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 7, 8, 9, 10],
            unlockedSkillIds: ['trace', 'pulse'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 5,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'guard-edge', 'traveler-coat', 'debug-charm'],
            partyMemberIds: ['byte'],
            partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
            worldMapId: 'overworld',
            worldPosition: { x: 20, y: 14 },
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

async function getMenuHeight(page: import('@playwright/test').Page) {
  const box = await page.locator('.pause-menu').boundingBox()
  expect(box).not.toBeNull()
  return box?.height ?? 0
}

test('@responsive Pause menuはtab内容量に関係なく同じshell高さを保つ', async ({ page }) => {
  await seedWorld(page)
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const menu = page.getByRole('dialog', { name: 'メニュー' })

  const initialHeight = await getMenuHeight(page)
  const heights = [initialHeight]

  for (const tab of ['マップ', '装備', '仲間', '設定']) {
    await selectPauseTab(menu, tab)
    heights.push(await getMenuHeight(page))
  }

  for (const height of heights) {
    expect(Math.abs(height - initialHeight)).toBeLessThanOrEqual(1)
  }

  const viewportHeight = page.viewportSize()?.height ?? 0
  const menuBox = await page.locator('.pause-menu').boundingBox()
  expect(menuBox).not.toBeNull()
  if (menuBox) {
    expect(menuBox.y).toBeGreaterThanOrEqual(0)
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(viewportHeight + 1)
  }
})