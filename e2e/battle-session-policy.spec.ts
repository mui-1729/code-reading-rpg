import { expect, test, type Page } from '@playwright/test'
import { readStoredProgress, readStoredRpg } from './storedGameState'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'
const BATTLE_1_WIN_SEED = 'encounter%3Aoverworld%3A5%3A10%3A11'

async function seedBattleState(
  page: Page,
  options: {
    exp?: number
    gold?: number
    patchKit?: number
    currentHp?: number
    clearedStageIds?: number[]
  } = {},
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, exp, gold, patchKit, currentHp, clearedStageIds }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp,
            gold,
            inventory: { patchKit },
            clearedStageIds,
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 7],
            unlockedSkillIds: ['trace', 'pulse', 'nova'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 4,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: [],
            partyEquipment: {},
            worldMapId: 'overworld',
            worldPosition: { x: 10, y: 10 },
            stepsSinceEncounter: 4,
            encounterCount: 3,
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
      exp: options.exp ?? 0,
      gold: options.gold ?? 0,
      patchKit: options.patchKit ?? 0,
      currentHp: options.currentHp ?? 100,
      clearedStageIds: options.clearedStageIds ?? [],
    },
  )
}

async function dismissStory(page: Page) {
  const story = page.locator('.battle-story-window')
  await expect(story).toBeVisible()
  await story.getByRole('button', { name: 'SKIP' }).click()
  await expect(story).toBeHidden()
}

async function openBattleItem(page: Page) {
  const toggle = page.locator('.battle-item-toggle')
  await expect(toggle).toBeVisible()
  await toggle.click()
}

async function completeStory(page: Page) {
  const story = page.locator('.battle-story-window')
  await expect(story).toBeVisible()

  for (let index = 0; index < 10 && await story.isVisible(); index += 1) {
    await story.locator('.primary-button').click()
  }

  await expect(story).toBeHidden()
}

async function expectAnimatedResult(page: Page, text: string) {
  const sequence = page.locator('.result-sequence-panel')
  const result = sequence.locator('.result-sequence-event').getByText(text, { exact: true })
  await expect(sequence).toBeVisible()

  for (let index = 0; index < 8; index += 1) {
    if (await result.isVisible()) return

    const next = sequence.getByRole('button', { name: '次 →', exact: true })
    if (!(await next.isVisible())) break
    await next.click()
  }

  await expect(result).toBeVisible()
}

async function executeSkill(page: Page, name: string) {
  const card = page.getByRole('button', { name: new RegExp(`^${name}\\b`) })
  await expect(card).toBeEnabled()
  await card.click()
  await expect(card).toHaveClass(/selected/)
  await card.click()
}

test('reloadはBattle attemptをrollbackして開始HP / Itemへ戻す', async ({ page }) => {
  await seedBattleState(page, { patchKit: 1, currentHp: 40 })
  await page.goto('/javascript/battle/1?seed=session-reload&returnTo=%2Fworld')
  await dismissStory(page)

  await openBattleItem(page)
  await page.getByRole('button', { name: /PATCH KIT ×1/ }).click()
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')
  await expect(page.locator('.battle-item-toggle small')).toHaveText('PATCH KIT ×0')

  await page.reload()
  await dismissStory(page)
  await openBattleItem(page)

  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('40/108')
  await expect(page.getByRole('button', { name: /PATCH KIT ×1/ })).toBeEnabled()
  await expect.poll(async () => (await readStoredRpg(page))?.state.currentHp).toBe(40)
  await expect.poll(async () => (await readStoredProgress(page))?.progress.inventory.patchKit).toBe(1)
})

test('browser backはBattle attemptをABORTしWorld snapshotを変更しない', async ({ page }) => {
  await seedBattleState(page, { patchKit: 1, currentHp: 40 })
  await page.goto('/world')
  await expect(page.getByLabel('Open world map')).toHaveAttribute('data-world-x', '10')
  await page.goto('/javascript/battle/1?seed=session-back&returnTo=%2Fworld')
  await dismissStory(page)

  await openBattleItem(page)
  await page.getByRole('button', { name: /PATCH KIT ×1/ }).click()
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')
  await page.goBack()

  await expect(page).toHaveURL(/\/world$/)
  const map = page.getByLabel('Open world map')
  await expect(map).toHaveAttribute('data-world-x', '10')
  await expect(map).toHaveAttribute('data-world-y', '10')
  await expect.poll(async () => (await readStoredRpg(page))?.state.currentHp).toBe(40)
  await expect.poll(async () => (await readStoredProgress(page))?.progress.inventory.patchKit).toBe(1)
})

test('Victoryだけattempt-local HP / Itemとrewardをpersistent stateへcommitする', async ({ page }) => {
  await seedBattleState(page, { patchKit: 1, currentHp: 70 })
  await page.goto(`/javascript/battle/1?seed=${BATTLE_1_WIN_SEED}&returnTo=%2Fworld`)
  await dismissStory(page)

  await openBattleItem(page)
  await page.getByRole('button', { name: /PATCH KIT ×1/ }).click()
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('94/108')
  await executeSkill(page, 'TRACE')
  await executeSkill(page, 'PULSE')
  await executeSkill(page, 'TRACE')
  await expect(page.getByText('VICTORY', { exact: true })).toBeVisible()

  await expect.poll(async () => (await readStoredProgress(page))?.progress.inventory.patchKit).toBe(0)
  await expect.poll(async () => (await readStoredProgress(page))?.progress.exp).toBe(12)
  await expect.poll(async () => (await readStoredProgress(page))?.progress.gold).toBe(20)
  const storedHp = await expect.poll(async () => (await readStoredRpg(page))?.state.currentHp).toBeGreaterThan(0)
  void storedHp
})

test('Level Upは増加statを、ReplayはEXP 100% / Gold 50%をresultで明示する', async ({ page }) => {
  await seedBattleState(page, { exp: 35 })
  await page.goto(`/javascript/battle/1?seed=${BATTLE_1_WIN_SEED}&returnTo=%2Fworld`)
  await dismissStory(page)
  await executeSkill(page, 'TRACE')
  await executeSkill(page, 'PULSE')
  await executeSkill(page, 'TRACE')
  await expect(page.getByText('VICTORY', { exact: true })).toBeVisible()
  await completeStory(page)
  await expectAnimatedResult(page, 'レベルアップ！ · 最大HP +8 · 威力 +2%')

  await seedBattleState(page, { exp: 47, gold: 20, clearedStageIds: [1] })
  await page.goto(`/javascript/battle/1?seed=${BATTLE_1_WIN_SEED}&returnTo=%2Fworld`)
  await executeSkill(page, 'TRACE')
  await executeSkill(page, 'PULSE')
  await executeSkill(page, 'TRACE')
  await expect(page.getByText('VICTORY', { exact: true })).toBeVisible()
  await expectAnimatedResult(page, '再クリア · EXP 100% / GOLD 50%')
})
