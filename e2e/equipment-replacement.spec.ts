import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('未装備slotは自然な比較を表示し、装備解除ではなく付け替えだけを操作にする', async ({ page }) => {
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
            gold: 200,
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
            equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
            ownedEquipmentIds: ['training-blade', 'traveler-coat', 'life-charm'],
            partyMemberIds: [],
            partyEquipment: {},
            worldMapId: 'overworld',
            worldPosition: { x: 21, y: 12 },
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

  await page.getByRole('button', { name: 'INTERACT' }).click()
  const shop = page.getByRole('dialog', { name: 'ショップ' })
  const lifeCharmShop = shop.locator('[data-equipment-id="life-charm"]')
  await expect(lifeCharmShop.getByText('現在装備 · 未装備', { exact: true })).toBeVisible()
  await expect(lifeCharmShop.getByText('装備すると HP +16', { exact: true })).toBeVisible()
  await expect(shop.getByText('EMPTY', { exact: true })).toHaveCount(0)
  await shop.getByRole('button', { name: 'ショップを閉じる' }).click()

  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const pause = page.getByRole('dialog', { name: 'メニュー' })
  await pause.getByRole('button', { name: '装備' }).click()

  const accessorySlot = pause.locator('[data-equipment-slot="accessory"]')
  await expect(accessorySlot.getByText('未装備', { exact: true })).toBeVisible()
  await expect(accessorySlot.getByText('比較: 未装備 · 装備すると HP +16', { exact: true })).toBeVisible()
  await expect(pause.getByText('EMPTY', { exact: true })).toHaveCount(0)
  await expect(pause.getByRole('button', { name: '装備を外す' })).toBeHidden()

  await accessorySlot.locator('button[data-equipment-id="life-charm"]').click()
  await expect(accessorySlot.getByRole('button', { name: 'Life Charm 装備中' })).toBeVisible()

  const storedAccessory = await page.evaluate((rpgKey) => {
    const raw = localStorage.getItem(rpgKey)
    return raw ? JSON.parse(raw).state.equipment.accessory : null
  }, RPG_KEY)
  expect(storedAccessory).toBe('life-charm')
})
