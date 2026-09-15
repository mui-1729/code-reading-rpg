import { expect, test } from '@playwright/test'
import { selectPauseTab } from './pause-menu-helpers'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('ワールドマップは接続cardを積み上げず、探索済み/地図所持mapだけ出口pinを示す', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 2000,
          gold: 200,
          inventory: { patchKit: 1 },
          clearedStageIds: Array.from({ length: 22 }, (_, index) => index + 1),
          clearedAreaIds: ['javascript', 'typescript'],
          completedSideQuestIds: [],
          unlockedStageIds: [],
          unlockedSkillIds: [],
        },
      }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 8,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: ['byte'],
          partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
          worldMapId: 'overworld',
          worldPosition: { x: 20, y: 14 },
          safeCheckpoint: {
            id: 'central-hub',
            mapId: 'overworld',
            position: { x: 20, y: 14 },
          },
          stepsSinceEncounter: 0,
          encounterCount: 0,
          currentHp: 140,
          openedTreasureIds: [],
          revealedWorldCells: {},
          ownedWorldMapIds: ['js-forest'],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )

  await page.goto('/world')
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const menu = page.getByRole('dialog', { name: 'メニュー' })
  await selectPauseTab(menu, 'マップ')

  const atlas = page.getByRole('region', { name: 'ワールドマップ' })
  await expect(atlas.locator('.atlas-route-network')).toHaveCount(0)
  await expect(atlas.getByText('エリアのつながり', { exact: true })).toHaveCount(0)
  await expect(atlas.locator('[data-atlas-region]')).toHaveCount(6)
  await expect(atlas.locator('[data-atlas-region="js-forest-settlement"]')).toContainText('森番の集落')

  // Overworldの現在地周辺しか探索していないため、遠方の出口位置はまだ漏らさない。
  await expect(atlas.locator('[data-atlas-map="overworld"] [data-atlas-landmark="exit"]')).toHaveCount(0)
  await expect(atlas.locator('.atlas-terrain-legend')).toContainText('↔出口')

  // 所持しているForest地域地図は通常地形とpublicな出口を確認できる。
  await atlas.locator('[data-atlas-region="js-forest"]').click()
  await expect(atlas.locator('[data-atlas-map="js-forest"]')).toBeVisible()
  await expect(atlas.locator('[data-atlas-map="js-forest"] [data-atlas-landmark="exit"]')).toHaveCount(2)
})
