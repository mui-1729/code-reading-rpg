import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seed(page: Page, clearedStageIds: number[] = []) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, cleared }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 0,
          inventory: { patchKit: 0 },
          clearedStageIds: cleared,
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 3, 4, 7, 8, 9, 10, 13],
          unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
        },
      }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 4,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: [],
          partyEquipment: {},
          worldMapId: 'overworld',
          worldPosition: { x: 10, y: 11 },
          stepsSinceEncounter: 0,
          encounterCount: 5,
          currentHp: 73,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY, cleared: clearedStageIds },
  )
}

async function storedProgress(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), PROGRESS_KEY)
}

async function storedRpg(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), RPG_KEY)
}

test('Overworld Random Encounterから逃走すると同じWorld位置/HPへ戻りrewardを得ない', async ({ page }) => {
  await seed(page)
  await page.goto('/javascript/battle/1?seed=encounter%3A5%3A10%3A11&returnTo=%2Fworld')

  const run = page.getByRole('button', { name: 'RUN · ESCAPE' })
  await expect(run).toBeVisible()
  await expect(run).toBeEnabled()
  await expect(page.getByText(/元いたWorld位置へ戻る/)).toBeVisible()
  await run.click()

  await expect(page).toHaveURL(/\/world$/)
  await expect(page.getByLabel('Open world map')).toHaveAttribute('data-world-x', '10')
  await expect(page.getByLabel('Open world map')).toHaveAttribute('data-world-y', '11')

  const progress = await storedProgress(page)
  expect(progress.progress.exp).toBe(0)
  expect(progress.progress.gold).toBe(0)
  expect(progress.progress.clearedStageIds).toEqual([])
  expect((await storedRpg(page)).state.currentHp).toBe(73)
})

test('fixed Lesson / Training / Boss / Mid-Bossは逃走不可を明示する', async ({ page }) => {
  await seed(page)

  for (const url of [
    '/javascript/battle/7?seed=village-training%3A7&returnTo=%2Fworld',
    '/javascript/battle/13?seed=midboss%3Ajs-forest%3A1&returnTo=%2Fworld',
    '/javascript/battle/3?seed=boss%3Ajs%3A1&returnTo=%2Fworld',
  ]) {
    await page.goto(url)
    const run = page.getByRole('button', { name: 'RUN LOCKED · FIXED BATTLE' })
    await expect(run).toBeVisible()
    await expect(run).toBeDisabled()
  }
})

test('clear済みlocal map Random復習Battleは逃走できる', async ({ page }) => {
  await seed(page, [10])
  await page.goto('/javascript/battle/10?seed=encounter%3Ajs-forest%3A7%3A20%3A9&returnTo=%2Fworld')

  await expect(page.getByRole('button', { name: 'RUN · ESCAPE' })).toBeEnabled()
})
