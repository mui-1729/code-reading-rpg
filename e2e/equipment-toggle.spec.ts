import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('装備はslotごとの選択式で、候補末尾の「なし」から未装備へ切り替えられる', async ({ page }) => {
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
  await page.getByRole('button', { name: '装備', exact: true }).click()

  const trainingBlade = page.locator('[data-equipment-id="training-blade"]')
  const guardEdge = page.locator('[data-equipment-id="guard-edge"]')
  const weaponSlot = page.locator('[data-equipment-slot="weapon"]')
  const none = weaponSlot.locator('[data-equipment-id="none"]')
  const choices = weaponSlot.locator('.equipment-options > button')

  await expect(trainingBlade).toHaveAttribute('data-equipment-state', 'equipped')
  await expect(trainingBlade).toHaveAttribute('aria-label', 'Training Blade 装備中')
  await expect(trainingBlade).toHaveAttribute('aria-pressed', 'true')
  await expect(weaponSlot.locator('header strong')).toHaveText('Training Blade')
  await expect(choices.last()).toHaveAttribute('data-equipment-id', 'none')
  await expect(none).toHaveAttribute('aria-label', '武器 なし')

  await none.click()
  await expect(none).toHaveAttribute('aria-pressed', 'true')
  await expect(trainingBlade).toHaveAttribute('aria-pressed', 'false')
  await expect(weaponSlot.locator('header strong')).toHaveText('なし')

  await trainingBlade.click()
  await expect(trainingBlade).toHaveAttribute('aria-pressed', 'true')
  await expect(weaponSlot.locator('header strong')).toHaveText('Training Blade')

  await trainingBlade.click()
  await expect(trainingBlade).toHaveAttribute('aria-pressed', 'true')
  await expect(weaponSlot.locator('header strong')).toHaveText('Training Blade')

  await guardEdge.click()
  await expect(guardEdge).toHaveAttribute('data-equipment-state', 'equipped')
  await expect(trainingBlade).toHaveAttribute('data-equipment-state', 'owned')
  await expect(weaponSlot.locator('header strong')).toHaveText('Guard Edge')
})
