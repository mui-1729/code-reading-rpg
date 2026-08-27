import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedBossState(page: Page) {
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
            clearedStageIds: [1, 2],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 2, 3, 4],
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper', 'lock', 'alert', 'moon-edge'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 3,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: [],
            partyEquipment: {},
            worldPosition: { x: 20, y: 14 },
            stepsSinceEncounter: 8,
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
}

async function executeSkill(page: Page, name: string) {
  const card = page.getByRole('button', { name: new RegExp(`^${name}\\b`) })
  await expect(card).toBeEnabled()
  await card.click()
  await expect(card).toHaveClass(/selected/)
  await card.click()
  await expect(card).toBeEnabled({ timeout: 10_000 })
}

test('Boss GUARDはminion生存中だけdamageを1に抑え、全滅後にOPENする', async ({ page }) => {
  await seedBossState(page)
  await page.goto('/javascript/battle/3?seed=boss-guard-e2e&returnTo=%2Fworld')

  const bossCard = page.locator('.enemy-card.is-boss-enemy')
  await expect(bossCard).toBeVisible()
  await expect(page.getByLabel('Boss guard active')).toBeVisible()
  await expect(bossCard.getByText(/enemies\.some/)).toBeVisible()
  await expect(bossCard.getByText('156/156', { exact: true })).toBeVisible()

  await executeSkill(page, 'JUDGE')
  await expect(bossCard.getByText('155/156', { exact: true })).toBeVisible()
  await expect(page.getByText(/BOSS GUARD/).last()).toBeVisible()

  await executeSkill(page, 'MOON EDGE')
  await executeSkill(page, 'PULSE')
  await executeSkill(page, 'PULSE')

  await expect(page.getByLabel('Boss guard open')).toBeVisible()

  await executeSkill(page, 'JUDGE')
  await expect(bossCard.getByText('98/156', { exact: true })).toBeVisible()
})
