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
    rpgVersion?: 5 | 6
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
      rpgVersion,
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
          version: rpgVersion,
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
      worldPosition: options.worldPosition ?? { x: 61, y: 14 },
      rpgVersion: options.rpgVersion ?? 6,
    },
  )
  await page.goto('/world')
}

const overworld = (page: Page) => page.getByLabel('ワールドマップ')
const frontier = (page: Page) => page.getByLabel('TypeScript辺境のマップ')

async function waitForMapTransition(page: Page) {
  await expect(page.locator('.world-map-transition')).toHaveCount(0, { timeout: 1_000 })
}

test('JavaScript未clearではTypeScriptの門へ向くだけではログ不変で、Action時に理由を表示する', async ({ page }) => {
  await seedWorld(page, { worldPosition: { x: 61, y: 14 } })

  const log = page.locator('.world-message p')
  const before = await log.textContent()
  await expect(overworld(page)).toHaveAttribute('data-world-x', '61')
  await page.getByRole('button', { name: '右へ移動' }).click()

  await expect(overworld(page)).toHaveAttribute('data-world-x', '61')
  await expect(page.locator('.world-player-sprite')).toHaveAttribute('data-facing', 'right')
  await expect(log).toHaveText(before ?? '')

  const lockedGate = page.getByRole('button', { name: 'TypeScript辺境を調べる' })
  await expect(lockedGate).toBeEnabled()
  await lockedGate.click()
  await expect(page.locator('.world-message')).toContainText('TypeScript辺境は未開通')
  await expect(page.locator('.world-message')).toContainText('Final Boss')
})

test('canonical JavaScript route完了後はOverworldから専用TypeScript辺境mapへActionで遷移する', async ({ page }) => {
  await seedWorld(page, { clearedStageIds: JS_COMPLETE })

  await page.getByRole('button', { name: '右へ移動' }).click()
  await expect(overworld(page)).toHaveAttribute('data-world-map', 'overworld')
  await page.getByRole('button', { name: 'TypeScript辺境へ入る' }).click()

  await expect(frontier(page)).toHaveAttribute('data-world-map', 'ts-frontier')
  await expect(frontier(page)).toHaveAttribute('data-world-x', '2')
  await expect(frontier(page)).toHaveAttribute('data-world-y', '10')
  await waitForMapTransition(page)
  await expect(page.locator('.world-header')).toBeHidden()
  await expect(page.getByText('TypeScript辺境は未開通')).toHaveCount(0)
})

test('TypeScript辺境の西の門からCentral HubへActionで往復できる', async ({ page }) => {
  await seedWorld(page, {
    clearedStageIds: JS_COMPLETE,
    worldMapId: 'ts-frontier',
    worldPosition: { x: 2, y: 10 },
  })

  await page.getByRole('button', { name: '左へ移動' }).click()
  await expect(frontier(page)).toHaveAttribute('data-world-map', 'ts-frontier')
  await page.getByRole('button', { name: '中央Hubへ入る' }).click()

  await expect(overworld(page)).toHaveAttribute('data-world-map', 'overworld')
  await expect(overworld(page)).toHaveAttribute('data-world-x', '61')
  await expect(overworld(page)).toHaveAttribute('data-world-y', '14')
  await waitForMapTransition(page)
})

test('旧overworld TypeScript側saveは専用mapへmigrationしreload後も保持する', async ({ page }) => {
  await seedWorld(page, {
    clearedStageIds: JS_COMPLETE,
    worldMapId: 'overworld',
    worldPosition: { x: 30, y: 18 },
    rpgVersion: 5,
  })

  await expect(frontier(page)).toHaveAttribute('data-world-map', 'ts-frontier')
  await expect(frontier(page)).toHaveAttribute('data-world-x', '19')
  await expect(frontier(page)).toHaveAttribute('data-world-y', '15')

  await page.reload()
  await expect(frontier(page)).toHaveAttribute('data-world-map', 'ts-frontier')
  await expect(frontier(page)).toHaveAttribute('data-world-x', '19')
  await expect(frontier(page)).toHaveAttribute('data-world-y', '15')
})

test('未解放TypeScript側の旧座標saveはOverworld開始地点へnormalizeする', async ({ page }) => {
  await seedWorld(page, {
    worldMapId: 'overworld',
    worldPosition: { x: 30, y: 18 },
    rpgVersion: 5,
  })

  await expect(overworld(page)).toHaveAttribute('data-world-map', 'overworld')
  await expect(overworld(page)).toHaveAttribute('data-world-x', '20')
  await expect(overworld(page)).toHaveAttribute('data-world-y', '14')
})

test('TypeScript local encounterから逃走すると同じ辺境位置へ戻る', async ({ page }) => {
  await seedWorld(page, {
    clearedStageIds: [...JS_COMPLETE, 4],
    worldMapId: 'ts-frontier',
    worldPosition: { x: 10, y: 10 },
  })

  const before = await readStoredRpg(page)
  await page.goto('/typescript/battle/4?seed=encounter%3Ats-frontier%3A10%3A10%3A1&returnTo=%2Fworld')
  const story = page.locator('.battle-story-window')
  if (await story.isVisible()) await story.getByRole('button', { name: 'スキップ', exact: true }).click()
  await page.getByRole('button', { name: '逃げる', exact: true }).click()
  await page.getByRole('button', { name: '逃げる', exact: true }).click()

  await expect(page).toHaveURL(/\/world$/)
  const after = await readStoredRpg(page)
  expect(after.state.worldMapId).toBe('ts-frontier')
  expect(after.state.worldPosition).toEqual(before.state.worldPosition)
})
