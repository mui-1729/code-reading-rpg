import { expect, test } from '@playwright/test'
import { selectPauseTab } from './pause-menu-helpers'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('プレイヤー向け主要UIは日本語を基本にしtechnical termを維持する', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 200,
          inventory: { patchKit: 1 },
          clearedStageIds: [],
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 4],
          unlockedSkillIds: ['trace', 'pulse', 'nova'],
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
          worldPosition: { x: 21, y: 12 },
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

  await expect(page.getByLabel('ワールドマップ')).toBeVisible()
  await expect(page.getByLabel('次の目的')).toBeVisible()
  await expect(page.getByRole('button', { name: 'ショップを見る' })).toBeVisible()
  await expect(page.getByRole('button', { name: '右へ移動' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^INTERACT/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'ショップを見る' }).click()
  const shop = page.getByRole('dialog', { name: 'ショップ' })
  await expect(shop.getByText('所持ゴールド', { exact: true })).toBeVisible()
  await shop.getByRole('button', { name: 'ショップを閉じる' }).click()

  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const menu = page.getByRole('dialog', { name: 'メニュー' })
  const selector = menu.locator('.pause-tab-trigger')
  await expect(selector).toContainText('ステータス')
  await selector.click()
  const picker = menu.getByRole('listbox', { name: 'メニュー項目を選ぶ' })
  await expect(picker.getByRole('option', { name: 'コード図鑑', exact: true })).toBeVisible()
  await selector.click()
  await selectPauseTab(menu, 'マップ')
  await expect(menu.getByRole('region', { name: 'ワールドマップ' })).toBeVisible()
})
