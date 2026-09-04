import { expect, test, type Page } from '@playwright/test'
import { readStoredRpg } from './storedGameState'
import { JS_COMPLETE } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorld(
  page: Page,
  options: {
    clearedStageIds?: readonly number[]
    unlockedStageIds?: number[]
    worldMapId?: 'overworld' | 'ts-frontier'
    worldPosition?: { x: number; y: number }
  } = {},
) {
  await page.goto('/')
  await page.evaluate(
    ({
      progressKey,
      rpgKey,
      tutorialKey,
      clearedStageIds,
      unlockedStageIds,
      worldMapId,
      worldPosition,
    }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 0 },
            clearedStageIds,
            clearedAreaIds: clearedStageIds.includes(3) ? ['javascript'] : [],
            completedSideQuestIds: [],
            unlockedStageIds,
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
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
            partyMemberIds: ['byte'],
            partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
            worldMapId,
            worldPosition,
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
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      clearedStageIds: options.clearedStageIds ?? [],
      unlockedStageIds: options.unlockedStageIds ?? [7],
      worldMapId: options.worldMapId ?? 'overworld',
      worldPosition: options.worldPosition ?? { x: 22, y: 14 },
    },
  )
  await page.goto('/world')
}

const overworld = (page: Page) => page.getByLabel('ワールドマップ')
const frontier = (page: Page) => page.getByLabel('TypeScript辺境のマップ')

async function waitForMapTransition(page: Page) {
  await expect(page.locator('.world-map-transition')).toHaveCount(0, { timeout: 1_000 })
}

test('JavaScript未clearではTypeScriptの門へ進めず理由を表示する', async ({ page }) => {
  await seedWorld(page)

  await page.getByRole('button', { name: '右へ移動' }).click()

  await expect(overworld(page)).toHaveAttribute('data-world-x', '22')
  await expect(page.getByRole('status')).toContainText('TypeScript辺境は未開通')
  await expect(page.getByRole('status')).toContainText('Final Boss')
})

test('canonical JavaScript route完了後はOverworldから専用TypeScript辺境mapへ遷移する', async ({ page }) => {
  await seedWorld(page, { clearedStageIds: JS_COMPLETE })

  await page.getByRole('button', { name: '右へ移動' }).click()

  await expect(frontier(page)).toHaveAttribute('data-world-map', 'ts-frontier')
  await expect(frontier(page)).toHaveAttribute('data-world-x', '2')
  await expect(frontier(page)).toHaveAttribute('data-world-y', '10')
  await expect(page.locator('.world-header')).toBeHidden()
  await expect(page.getByText('TypeScript辺境は未開通')).toHaveCount(0)
})

test('TypeScript辺境の西の門からCentral Hubへ往復できる', async ({ page }) => {
  await seedWorld(page, {
    clearedStageIds: JS_COMPLETE,
    worldMapId: 'ts-frontier',
    worldPosition: { x: 2, y: 10 },
  })

  await page.getByRole('button', { name: '左へ移動' }).click()

  await expect(overworld(page)).toHaveAttribute('data-world-map', 'overworld')
  await expect(overworld(page)).toHaveAttribute('data-world-x', '22')
  await expect(overworld(page)).toHaveAttribute('data-world-y', '14')
  await waitForMapTransition(page)

  await page.getByRole('button', { name: '右へ移動' }).click()
  await expect(frontier(page)).toHaveAttribute('data-world-map', 'ts-frontier')
})

test('旧overworld TypeScript側saveは専用mapへmigrationしreload後も保持する', async ({ page }) => {
  await seedWorld(page, {
    clearedStageIds: JS_COMPLETE,
    worldMapId: 'overworld',
    worldPosition: { x: 30, y: 14 },
  })

  await expect(frontier(page)).toHaveAttribute('data-world-map', 'ts-frontier')
  await expect(frontier(page)).toHaveAttribute('data-world-x', '9')
  await expect(frontier(page)).toHaveAttribute('data-world-y', '14')

  await page.reload()
  await expect(frontier(page)).toHaveAttribute('data-world-x', '9')
  await expect(frontier(page)).toHaveAttribute('data-world-y', '14')
})

test('未解放TypeScript側の旧座標saveはOverworld開始地点へnormalizeする', async ({ page }) => {
  await seedWorld(page, {
    worldMapId: 'overworld',
    worldPosition: { x: 30, y: 14 },
  })

  await expect(overworld(page)).toHaveAttribute('data-world-map', 'overworld')
  await expect(overworld(page)).toHaveAttribute('data-world-x', '20')
  await expect(overworld(page)).toHaveAttribute('data-world-y', '14')
  await expect.poll(async () => (await readStoredRpg(page)).state.worldMapId).toBe('overworld')
  await expect.poll(async () => (await readStoredRpg(page)).state.worldPosition).toEqual({
    x: 20,
    y: 14,
  })
})

test('TypeScript local encounterから逃走すると同じ辺境位置へ戻る', async ({ page }) => {
  await seedWorld(page, {
    clearedStageIds: [...JS_COMPLETE, 4],
    unlockedStageIds: [7, 4, 5],
    worldMapId: 'ts-frontier',
    worldPosition: { x: 5, y: 10 },
  })

  await page.goto('/typescript/battle/4?seed=encounter:ts-frontier:1:5:10&returnTo=%2Fworld')
  const run = page.getByRole('group', { name: '戦闘コマンド' }).getByRole('button', { name: '逃げる' })
  await expect(run).toBeEnabled()
  await run.click()
  await page.getByRole('group', { name: '逃走確認' }).getByRole('button', { name: '逃げる' }).click()

  await expect(page).toHaveURL(/\/world$/)
  await expect(frontier(page)).toHaveAttribute('data-world-x', '5')
  await expect(frontier(page)).toHaveAttribute('data-world-y', '10')
})
