import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedInnState(page: Page, options: { gold: number; currentHp: number }) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, gold, currentHp }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold,
            inventory: { patchKit: 0 },
            clearedStageIds: [],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 4],
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
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
            worldPosition: { x: 20, y: 16 },
            stepsSinceEncounter: 8,
            encounterCount: 0,
            currentHp,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      gold: options.gold,
      currentHp: options.currentHp,
    },
  )
  await page.goto('/world')
}

async function storedInnState(page: Page) {
  return page.evaluate(
    ({ progressKey, rpgKey }) => ({
      progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
      rpg: JSON.parse(localStorage.getItem(rpgKey) ?? 'null'),
    }),
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY },
  )
}

test.describe('Inn / Rest', () => {
  test('HP fullでは20GをchargeせずREST不可を明示する', async ({ page }) => {
    await seedInnState(page, { gold: 50, currentHp: 108 })

    await page.getByRole('button', { name: 'INTERACT' }).click()
    const inn = page.getByRole('dialog', { name: 'Inn / Rest' })
    await expect(inn.getByText('108 / 108', { exact: true })).toBeVisible()
    await expect(inn.getByText('FULL', { exact: true })).toBeVisible()
    await expect(inn.getByText('50 G → 50 G', { exact: true })).toBeVisible()
    await expect(inn.getByText('NO CHARGE · HP FULL', { exact: true })).toBeVisible()
    await expect(inn.getByRole('button', { name: 'HP FULL' })).toBeDisabled()

    const stored = await storedInnState(page)
    expect(stored.progress.progress.gold).toBe(50)
    expect(stored.rpg.state.currentHp).toBe(108)
  })

  test('Gold不足ではSHORT不足額を表示しHP / Goldを変更しない', async ({ page }) => {
    await seedInnState(page, { gold: 7, currentHp: 40 })

    await page.getByRole('button', { name: 'INTERACT' }).click()
    const inn = page.getByRole('dialog', { name: 'Inn / Rest' })
    await expect(inn.getByText('40 / 108', { exact: true })).toBeVisible()
    await expect(inn.getByText('+68 HP', { exact: true })).toBeVisible()
    await expect(inn.getByText('7 G → —', { exact: true })).toBeVisible()
    await expect(inn.getByText('SHORT 13 G', { exact: true })).toBeVisible()
    await expect(inn.getByRole('button', { name: 'SHORT 13 G' })).toBeDisabled()

    const stored = await storedInnState(page)
    expect(stored.progress.progress.gold).toBe(7)
    expect(stored.rpg.state.currentHp).toBe(40)
  })
})
