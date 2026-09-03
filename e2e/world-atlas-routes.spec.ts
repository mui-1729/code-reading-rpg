import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('ワールドマップは接続cardを積み上げず各mapの出口pinで移動先を示す', async ({ page }) => {
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
        version: 5,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: ['byte'],
          partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
          worldMapId: 'overworld',
          worldPosition: { x: 20, y: 14 },
          stepsSinceEncounter: 0,
          encounterCount: 0,
          currentHp: 140,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )

  await page.goto('/world')
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  await page.getByRole('button', { name: 'マップ', exact: true }).click()

  const atlas = page.getByRole('region', { name: 'ワールドマップ' })
  await expect(atlas.locator('.atlas-route-network')).toHaveCount(0)
  await expect(atlas.getByText('エリアのつながり', { exact: true })).toHaveCount(0)
  await expect(atlas.locator('[data-atlas-region]')).toHaveCount(5)
  await expect(atlas.locator('[data-atlas-landmark="exit"]')).not.toHaveCount(0)
  await expect(atlas.locator('.atlas-terrain-legend')).toContainText('↔出口')

  await atlas.locator('[data-atlas-region="js-forest"]').click()
  await expect(atlas.locator('[data-atlas-map="js-forest"]')).toBeVisible()
  await expect(atlas.locator('[data-atlas-landmark="exit"]')).toHaveCount(2)
})
