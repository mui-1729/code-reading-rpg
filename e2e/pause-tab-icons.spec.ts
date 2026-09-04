import { expect, test } from '@playwright/test'
import { selectPauseTab } from './pause-menu-helpers'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const tabLabels = ['ステータス', 'マップ', 'アイテム', '装備', '仲間', 'コード図鑑', '設定'] as const

test('390pxのPause selectorは7種類のpixel iconとlabelから1件を選べる', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
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
  await page.getByRole('button', { name: 'メニューを開く' }).click()

  const dialog = page.getByRole('dialog', { name: 'メニュー' })
  const selector = dialog.getByRole('navigation', { name: 'メニュー項目' })
  const trigger = selector.locator('.pause-tab-trigger')
  await expect(dialog).toBeVisible()
  await expect(selector).toBeVisible()
  await expect(trigger).toContainText('ステータス')

  await trigger.click()
  const picker = selector.getByRole('listbox', { name: 'メニュー項目を選ぶ' })
  const iconSources: string[] = []
  for (const label of tabLabels) {
    const option = picker.getByRole('option', { name: label, exact: true })
    const icon = option.locator('img.pause-tab-icon')
    await expect(option).toBeVisible()
    await expect(icon).toBeVisible()
    await expect(icon).toHaveAttribute('alt', '')
    await expect(icon).toHaveAttribute('aria-hidden', 'true')
    await expect.poll(() => icon.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    const source = await icon.getAttribute('src')
    expect(source).not.toBeNull()
    iconSources.push(source ?? '')
  }
  expect(new Set(iconSources).size).toBe(tabLabels.length)
  await trigger.click()

  await selectPauseTab(dialog, 'マップ')
  await expect(trigger).toContainText('マップ')
  await expect(trigger).toHaveAttribute('data-pause-tab', 'map')
  const selectedIcon = trigger.locator('img.pause-tab-icon')
  await expect(selectedIcon).toHaveAttribute('data-pause-tab-icon', 'map')

  const pageOverflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(pageOverflows).toBe(false)

  const screenshot = await selector.screenshot({ path: testInfo.outputPath('pause-selector.png') })
  expect(screenshot.byteLength).toBeGreaterThan(1000)
})
