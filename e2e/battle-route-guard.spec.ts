import { readStoredProgress } from './storedGameState'
import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seed(page: Page, clearedStageIds: number[], unlockedStageIds = [7]) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, cleared, unlocked }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 0,
          inventory: { patchKit: 0 },
          clearedStageIds: cleared,
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: unlocked,
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
          worldPosition: { x: 20, y: 14 },
          stepsSinceEncounter: 8,
          encounterCount: 0,
          currentHp: 100,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      cleared: clearedStageIds,
      unlocked: unlockedStageIds,
    },
  )
}

test('fresh saveからJavaScript Final Bossへ直URL侵入できない', async ({ page }) => {
  await seed(page, [])
  await page.goto('/javascript/battle/3?seed=fresh-boss-bypass')

  await expect(page).toHaveURL(/\/world#battle-locked$/)
  await expect(page.getByRole('status')).toContainText('Battle 22 / Battle 1 / Battle 2')
})

test('forged unlockedStageIdsがあってもBattle 1 clearだけではBattle 2へ進めない', async ({ page }) => {
  await seed(page, [1], [1, 2, 3, 7])
  await page.goto('/javascript/battle/2?seed=forged-battle-2')

  await expect(page).toHaveURL(/\/world#battle-locked$/)
  await expect(page.getByRole('status')).toContainText('Deep Forest')
})

test('Battle 1 / 2だけclearしてもBattle 3へ進めない', async ({ page }) => {
  await seed(page, [1, 2], [1, 2, 3, 7])
  await page.goto('/javascript/battle/3?seed=missing-battle-22')

  await expect(page).toHaveURL(/\/world#battle-locked$/)
  await expect(page.getByRole('status')).toContainText('Battle 22')
})

test('正規prerequisiteを満たしたJavaScript Final Bossは開始できる', async ({ page }) => {
  await seed(page, [22, 1, 2], [3])
  await page.goto('/javascript/battle/3?seed=canonical-boss&returnTo=%2Fworld')

  await expect(page).toHaveURL(/\/javascript\/battle\/3/)
  await expect(page.locator('.battle-console')).toBeVisible()
})

test('未解放JavaScript Battleの直URLをWorldへ戻しprogressを変更しない', async ({ page }) => {
  await seed(page, [])
  await page.goto('/javascript/battle/22?seed=locked-direct')

  await expect(page).toHaveURL(/\/world#battle-locked$/)
  await expect(page.getByRole('status')).toContainText('BATTLE LOCKED')
  await expect(page.getByRole('status')).toContainText('まだ解放されていない')
  const stored = await readStoredProgress(page)
  expect(stored.progress.exp).toBe(0)
  expect(stored.progress.gold).toBe(0)
  expect(stored.progress.clearedStageIds).toEqual([])
})

test('progressionで解放済みJavaScript Battleのdeep linkは開始できる', async ({ page }) => {
  await seed(page, [21], [22])
  await page.goto('/javascript/battle/22?seed=unlocked-direct&returnTo=%2Fworld')

  await expect(page).toHaveURL(/\/javascript\/battle\/22/)
  await expect(page.locator('.battle-console')).toBeVisible()
})

test('JavaScript未clearではTypeScript Battleへ直URL侵入できない', async ({ page }) => {
  await seed(page, [])
  await page.goto('/typescript/battle/4?seed=locked-ts')

  await expect(page).toHaveURL(/\/world#battle-locked$/)
  await expect(page.getByRole('status')).toContainText('Final Boss')
})

test('JavaScript Boss clear後はTypeScript Battle 4のdeep linkを許可する', async ({ page }) => {
  await seed(page, [3])
  await page.goto('/typescript/battle/4?seed=unlocked-ts&returnTo=%2Fworld')

  await expect(page).toHaveURL(/\/typescript\/battle\/4/)
  await expect(page.locator('.battle-console')).toBeVisible()
})
