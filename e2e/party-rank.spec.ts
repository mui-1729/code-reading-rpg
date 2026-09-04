import { expect, test } from '@playwright/test'
import { selectPauseTab } from './pause-menu-helpers'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('メニューの仲間でBYTE自身のRank・追撃値・次の成長条件を確認できる', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 640,
          gold: 0,
          inventory: { patchKit: 0 },
          clearedStageIds: [1, 7, 8, 9],
          clearedAreaIds: [],
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
          partyEquipment: {},
          worldMapId: 'overworld',
          worldPosition: { x: 20, y: 14 },
          stepsSinceEncounter: 0,
          encounterCount: 0,
          currentHp: 100,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )

  await page.goto('/world')
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const menu = page.getByRole('dialog', { name: 'メニュー' })
  await selectPauseTab(menu, '仲間')

  const byte = page.getByText(/BYTE · 斥候 · ランク 3/).locator('..')
  await expect(byte).toContainText('追撃 11')
  await expect(byte).toContainText('次のランク → プレイヤーLV 7')
  await expect(byte).toContainText('ランクごとに追撃 +2')
})
