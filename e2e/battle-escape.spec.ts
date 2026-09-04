import { readStoredProgress, readStoredRpg } from './storedGameState'
import { expect, test, type Page } from '@playwright/test'
import {
  JS_BATTLE_1_PREREQS,
  JS_BOSS_PREREQS,
  JS_FIRST_INCIDENT,
} from './canonical-progress-fixtures'

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
          clearedAreaIds: cleared.includes(3) ? ['javascript'] : [],
          completedSideQuestIds: [],
          unlockedStageIds: [7],
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
  return readStoredProgress(page)
}

async function storedRpg(page: Page) {
  return readStoredRpg(page)
}

test('clear済みOverworld Random Encounterは確認後に逃走し同じWorld位置/HPへ戻りrewardを得ない', async ({ page }) => {
  const cleared = [...JS_FIRST_INCIDENT]
  await seed(page, cleared)
  await page.goto('/javascript/battle/1?seed=encounter%3A5%3A10%3A11&returnTo=%2Fworld')

  const commandBar = page.getByRole('group', { name: '戦闘コマンド' })
  const run = commandBar.getByRole('button', { name: '逃げる' })
  await expect(run).toBeVisible()
  await expect(run).toBeEnabled()
  const beforeHeight = await commandBar.evaluate((element) => element.getBoundingClientRect().height)

  await run.click()
  const confirm = page.getByRole('group', { name: '逃走確認' })
  await expect(confirm).toBeVisible()
  await expect(page).toHaveURL(/\/javascript\/battle\/1/)
  const confirmHeight = await confirm.evaluate((element) => element.getBoundingClientRect().height)
  expect(Math.abs(confirmHeight - beforeHeight)).toBeLessThanOrEqual(1)

  await confirm.getByRole('button', { name: 'やめる' }).click()
  await expect(page.getByRole('group', { name: '逃走確認' })).toHaveCount(0)
  await expect(page).toHaveURL(/\/javascript\/battle\/1/)

  await page.getByRole('group', { name: '戦闘コマンド' }).getByRole('button', { name: '逃げる' }).click()
  await page.getByRole('group', { name: '逃走確認' }).getByRole('button', { name: '逃げる' }).click()

  await expect(page).toHaveURL(/\/world$/)
  await expect(page.getByLabel('ワールドマップ')).toHaveAttribute('data-world-x', '10')
  await expect(page.getByLabel('ワールドマップ')).toHaveAttribute('data-world-y', '11')

  const progress = await storedProgress(page)
  expect(progress.progress.exp).toBe(0)
  expect(progress.progress.gold).toBe(0)
  expect(progress.progress.clearedStageIds).toEqual(cleared)
  expect((await storedRpg(page)).state.currentHp).toBe(73)
})

test('未clearのfirst incidentはRandom風seedでも逃げるを表示しない', async ({ page }) => {
  await seed(page, [...JS_BATTLE_1_PREREQS])
  await page.goto('/javascript/battle/1?seed=encounter%3Aoverworld%3A5%3A10%3A11&returnTo=%2Fworld')

  const story = page.locator('.battle-story-window')
  await expect(story).toBeVisible()
  await story.getByRole('button', { name: 'スキップ' }).click()

  await expect(page.getByRole('button', { name: '逃げる' })).toHaveCount(0)
  await expect(page.getByText('FIXED BATTLE', { exact: false })).toHaveCount(0)
})

test('fixed Lesson / Training / Boss / Mid-Bossでは逃走UIそのものを表示しない', async ({ page }) => {
  await seed(page, [...JS_BOSS_PREREQS])

  for (const url of [
    '/javascript/battle/7?seed=village-training%3A7&returnTo=%2Fworld',
    '/javascript/battle/13?seed=midboss%3Ajs-forest%3A1&returnTo=%2Fworld',
    '/javascript/battle/3?seed=boss%3Ajs%3A1&returnTo=%2Fworld',
  ]) {
    await page.goto(url)
    await expect(page.getByRole('button', { name: '逃げる' })).toHaveCount(0)
    await expect(page.getByText('FIXED BATTLE', { exact: false })).toHaveCount(0)
  }
})

test('clear済みlocal map Random復習Battleだけ逃げるを表示する', async ({ page }) => {
  await seed(page, [...JS_FIRST_INCIDENT, 10])
  await page.goto('/javascript/battle/10?seed=encounter%3Ajs-forest%3A7%3A20%3A9&returnTo=%2Fworld')

  await expect(page.getByRole('button', { name: '逃げる' })).toBeEnabled()
})
