import { expect, test } from '@playwright/test'
import { selectPauseTab } from './pause-menu-helpers'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('装備slotは現在装備1件だけを表示し、pickerから変更と「なし」を選べる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
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
            unlockedStageIds: [],
            unlockedSkillIds: [],
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
            ownedEquipmentIds: ['training-blade', 'guard-edge', 'traveler-coat'],
            partyMemberIds: [],
            partyEquipment: {},
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
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const pause = page.getByRole('dialog', { name: 'メニュー' })
  await selectPauseTab(pause, '装備')

  const weaponSlot = pause.locator('[data-equipment-slot="weapon"]')
  const weaponTrigger = weaponSlot.getByRole('button', { name: /武器を選ぶ/ })

  await expect(weaponSlot.locator('[data-equipment-id]')).toHaveCount(0)
  await expect(weaponSlot.locator('header strong')).toHaveText('Training Blade')
  await expect(weaponTrigger).toHaveAttribute('aria-expanded', 'false')

  await weaponTrigger.click()
  const picker = page.getByRole('dialog', { name: '武器を選ぶ' })
  await expect(picker).toBeVisible()
  await expect(weaponTrigger).toHaveAttribute('aria-expanded', 'true')

  const choices = picker.getByRole('option')
  await expect(choices.last()).toHaveAttribute('data-equipment-id', 'none')
  await expect(picker.getByRole('option', { name: 'Training Blade 選択中' })).toHaveAttribute('aria-selected', 'true')

  await picker.getByRole('option', { name: 'Guard Edge を装備' }).click()
  await expect(picker).toBeHidden()
  await expect(weaponSlot.locator('header strong')).toHaveText('Guard Edge')
  await expect(weaponTrigger).toHaveAttribute('aria-expanded', 'false')

  await weaponTrigger.click()
  await expect(page.getByRole('dialog', { name: '武器を選ぶ' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: '武器を選ぶ' })).toBeHidden()
  await expect(pause).toBeVisible()

  await weaponTrigger.click()
  const reopened = page.getByRole('dialog', { name: '武器を選ぶ' })
  await reopened.getByRole('option', { name: '武器 なし' }).click()
  await expect(reopened).toBeHidden()
  await expect(weaponSlot.locator('header strong')).toHaveText('なし')

  await weaponTrigger.click()
  const noneSelectedPicker = page.getByRole('dialog', { name: '武器を選ぶ' })
  await expect(noneSelectedPicker.getByRole('option').last()).toHaveAttribute('data-equipment-id', 'none')
  await expect(noneSelectedPicker.getByRole('option', { name: '武器 なし 選択中' })).toHaveAttribute('aria-selected', 'true')

  const menuBox = await pause.boundingBox()
  expect(menuBox?.height ?? 0).toBeLessThanOrEqual(844 * 0.97)
})
