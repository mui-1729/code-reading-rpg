import { expect, test, type Page } from '@playwright/test'
import { JS_COMPLETE } from './canonical-progress-fixtures'
import { selectPauseTab } from './pause-menu-helpers'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function openForestAtlas(page: Page, openedTreasureIds: string[]) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, clearedStageIds, openedTreasureIds }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 0,
          inventory: { patchKit: 0 },
          clearedStageIds,
          clearedAreaIds: ['javascript'],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 7],
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
          worldMapId: 'js-forest',
          worldPosition: { x: 28, y: 10 },
          stepsSinceEncounter: 0,
          encounterCount: 0,
          currentHp: 108,
          openedTreasureIds,
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      clearedStageIds: JS_COMPLETE,
      openedTreasureIds,
    },
  )
  await page.goto('/world')
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const menu = page.getByRole('dialog', { name: 'メニュー' })
  await selectPauseTab(menu, 'マップ')
  return page.locator('[data-atlas-map="js-forest"]')
}

test('未開封の宝箱はAtlas上で正確な位置を表示しない', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const forest = await openForestAtlas(page, [])

  const unopenedTreasure = forest.locator('.atlas-landmark-pin.is-treasure:not(.is-opened)')
  await expect(unopenedTreasure).toHaveCount(1)
  await expect(unopenedTreasure).toBeHidden()

  await expect(forest.locator('.atlas-landmark-pin.is-exit').first()).toBeVisible()
})

test('発見済み宝箱だけは探索履歴として控えめにAtlasへ残せる', async ({ page }) => {
  const forest = await openForestAtlas(page, ['js-forest-supply'])

  const openedTreasure = forest.locator('.atlas-landmark-pin.is-treasure.is-opened')
  await expect(openedTreasure).toBeVisible()
  await expect(openedTreasure).toHaveAttribute('aria-label', /宝箱 · 開封済み/)
  const opacity = await openedTreasure.evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity))
  expect(opacity).toBeLessThan(0.6)
})
