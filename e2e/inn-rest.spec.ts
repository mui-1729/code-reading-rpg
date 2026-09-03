import { readStoredGameState } from './storedGameState'
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
  return readStoredGameState(page)
}

test.describe('宿', () => {
  test('HP満タンでは20Gを消費せず休めないことを明示する', async ({ page }) => {
    await seedInnState(page, { gold: 50, currentHp: 108 })

    await page.getByRole('button', { name: '宿で休む' }).click()
    const inn = page.getByRole('dialog', { name: '宿' })
    await expect(inn.getByText('108 / 108', { exact: true })).toBeVisible()
    await expect(inn.getByText('満タン', { exact: true })).toBeVisible()
    await expect(inn.getByText('50 G → 50 G', { exact: true })).toBeVisible()
    await expect(inn.getByText('料金不要 · HP満タン', { exact: true })).toBeVisible()
    await expect(inn.getByRole('button', { name: 'HP満タン' })).toBeDisabled()

    const stored = await storedInnState(page)
    expect(stored.progress.progress.gold).toBe(50)
    expect(stored.rpg.state.currentHp).toBe(108)
  })

  test('ゴールド不足では不足額を表示しHP / Goldを変更しない', async ({ page }) => {
    await seedInnState(page, { gold: 7, currentHp: 40 })

    await page.getByRole('button', { name: '宿で休む' }).click()
    const inn = page.getByRole('dialog', { name: '宿' })
    await expect(inn.getByText('40 / 108', { exact: true })).toBeVisible()
    await expect(inn.getByText('+68 HP', { exact: true })).toBeVisible()
    await expect(inn.getByText('7 G → —', { exact: true })).toBeVisible()
    await expect(inn.locator('.inn-cost-card em')).toHaveText('あと 13 G必要')
    await expect(inn.getByRole('button', { name: 'あと 13 G必要' })).toBeDisabled()

    const stored = await storedInnState(page)
    expect(stored.progress.progress.gold).toBe(7)
    expect(stored.rpg.state.currentHp).toBe(40)
  })
})
