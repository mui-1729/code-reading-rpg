import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function prepareWorld(page: Page) {
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
}

test('メニューは重複見出しを出さずclose操作を維持する', async ({ page }) => {
  await prepareWorld(page)
  await page.getByRole('button', { name: 'メニューを開く' }).click()

  const dialog = page.getByRole('dialog', { name: 'メニュー' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('PAUSE', { exact: true })).toHaveCount(0)
  await expect(dialog.getByText('CODE KNIGHT', { exact: true })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'メニューを閉じる' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

test('モバイルでclose buttonがメニュー枠内に収まりtab triggerと重ならない', async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 390, height: 667 },
  ]) {
    await page.setViewportSize(viewport)
    await prepareWorld(page)
    await page.getByRole('button', { name: 'メニューを開く' }).click()

    const dialog = page.getByRole('dialog', { name: 'メニュー' })
    const closeButton = dialog.getByRole('button', { name: 'メニューを閉じる' })
    const tabTrigger = dialog.locator('.pause-tab-trigger')

    const [dialogBox, closeBox, tabBox] = await Promise.all([
      dialog.boundingBox(),
      closeButton.boundingBox(),
      tabTrigger.boundingBox(),
    ])

    expect(dialogBox).not.toBeNull()
    expect(closeBox).not.toBeNull()
    expect(tabBox).not.toBeNull()
    if (!dialogBox || !closeBox || !tabBox) throw new Error('pause menu geometry is unavailable')

    expect(closeBox.width).toBeGreaterThanOrEqual(44)
    expect(closeBox.height).toBeGreaterThanOrEqual(44)
    expect(closeBox.x).toBeGreaterThanOrEqual(dialogBox.x)
    expect(closeBox.y).toBeGreaterThanOrEqual(dialogBox.y)
    expect(closeBox.x + closeBox.width).toBeLessThanOrEqual(dialogBox.x + dialogBox.width)
    expect(closeBox.y + closeBox.height).toBeLessThanOrEqual(tabBox.y)

    await closeButton.click()
    await expect(dialog).toHaveCount(0)
  }
})
