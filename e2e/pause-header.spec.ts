import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('Pause menuは重複見出しを出さずclose操作を維持する', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({ version: 4, progress: { exp: 0, gold: 0, inventory: { patchKit: 0 }, clearedStageIds: [], clearedAreaIds: [], completedSideQuestIds: [], unlockedStageIds: [], unlockedSkillIds: [] } }))
      localStorage.setItem(rpgKey, JSON.stringify({ version: 5, state: { equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null }, ownedEquipmentIds: ['training-blade', 'traveler-coat'], partyMemberIds: [], partyEquipment: {}, worldMapId: 'overworld', worldPosition: { x: 20, y: 14 }, stepsSinceEncounter: 0, encounterCount: 0, currentHp: 100, openedTreasureIds: [] } }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )
  await page.goto('/world')
  await page.getByRole('button', { name: 'Pause menuを開く' }).click()

  const dialog = page.getByRole('dialog', { name: 'Pause menu' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('PAUSE', { exact: true })).toHaveCount(0)
  await expect(dialog.getByText('CODE KNIGHT', { exact: true })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Pause menuを閉じる' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})
