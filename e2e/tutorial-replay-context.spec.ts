import { readStoredGameState, readStoredRpg } from './storedGameState'
import { expect, test, type Page } from '@playwright/test'
import { JS_FIRST_INCIDENT, JS_SECOND_INCIDENT_PREREQS } from './canonical-progress-fixtures'
import { selectPauseTab } from './pause-menu-helpers'

const TUTORIAL_KEY = 'code-reading-rpg:tutorial'
const RPG_KEY = 'code-reading-rpg:rpg-state'

async function seedReplayState(
  page: Page,
  worldMapId: 'overworld' | 'js-deep-forest',
  worldPosition: { x: number; y: number },
  patchKit = 0,
  clearedStageIds: readonly number[] = worldMapId === 'js-deep-forest'
    ? JS_SECOND_INCIDENT_PREREQS
    : [],
) {
  await page.goto('/')
  await page.evaluate(
    ({ tutorialKey, rpgKey, mapId, position, patchKit, clearedStageIds }) => {
      localStorage.clear()
      localStorage.setItem('code-reading-rpg:player-progress', JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 0,
          inventory: { patchKit },
          clearedStageIds,
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [7],
          unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'completed', phase: 'battle' }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 4,
        state: {
          equipment: { weapon: 'guard-edge', armor: 'vital-coat', accessory: 'debug-charm' },
          ownedEquipmentIds: ['training-blade', 'guard-edge', 'traveler-coat', 'vital-coat', 'debug-charm'],
          partyMemberIds: ['byte'],
          partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
          worldMapId: mapId,
          worldPosition: position,
          stepsSinceEncounter: 9,
          encounterCount: 12,
          currentHp: 73,
          openedTreasureIds: ['js-debug-cache'],
        },
      }))
    },
    {
      tutorialKey: TUTORIAL_KEY,
      rpgKey: RPG_KEY,
      mapId: worldMapId,
      position: worldPosition,
      patchKit,
      clearedStageIds,
    },
  )
}

async function replayTutorial(page: Page) {
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const menu = page.getByRole('dialog', { name: 'メニュー' })
  await selectPauseTab(menu, '設定')
  await menu.getByRole('button', { name: 'チュートリアルをやり直す' }).click()
}

async function storedRpg(page: Page) {
  return readStoredRpg(page)
}

test('Battle中のTutorial replayはWorld開始地点へ戻り移動から始める', async ({ page }) => {
  await seedReplayState(page, 'overworld', { x: 8, y: 8 })
  await page.goto('/javascript/battle/1?seed=replay-from-battle&returnTo=%2Fworld')

  const story = page.locator('.battle-story-overlay')
  if (await story.isVisible()) {
    await story.getByRole('button', { name: 'スキップ', exact: true }).click()
  }
  await replayTutorial(page)

  await expect(page).toHaveURL(/\/world$/)
  await expect(page.locator('.tutorial-prompt-field')).toContainText('移動')
  const map = page.getByLabel('ワールドマップ')
  await expect(map).toHaveAttribute('data-world-map', 'overworld')
  await expect(map).toHaveAttribute('data-world-x', '20')
  await expect(map).toHaveAttribute('data-world-y', '14')

  const stored = await storedRpg(page)
  expect(stored.state.partyMemberIds).toEqual(['byte'])
  expect(stored.state.equipment).toEqual({ weapon: 'guard-edge', armor: 'vital-coat', accessory: 'debug-charm' })
  expect(stored.state.currentHp).toBe(73)
  expect(stored.state.encounterCount).toBe(12)
  expect(stored.state.openedTreasureIds).toEqual(['js-debug-cache'])
  expect((await readStoredGameState(page)).battleSession).toBeNull()
})

test('PATCH KIT使用後のTutorial replayはBattle全体をrollbackしてからWorld開始地点へ移動する', async ({ page }) => {
  await seedReplayState(page, 'overworld', { x: 8, y: 8 }, 2, JS_FIRST_INCIDENT)
  await page.goto('/javascript/battle/7?seed=replay-after-kit&returnTo=%2Fworld')
  const story = page.locator('.battle-story-overlay')
  if (await story.isVisible()) await story.getByRole('button', { name: 'スキップ', exact: true }).click()
  await page.getByRole('group', { name: '戦闘コマンド' }).getByRole('button', { name: 'アイテム', exact: true }).click()
  const itemMenu = page.getByRole('group', { name: 'アイテム選択' })
  await itemMenu.locator('.battle-item-browser-row[data-item-id="patch-kit"]').click()
  await itemMenu.getByRole('button', { name: /PATCH KIT ×2を使う/ }).click()
  await expect.poll(() => readStoredGameState(page)).toMatchObject({
    progress: { progress: { inventory: { patchKit: 1 } } },
    rpg: { state: { currentHp: 97 } },
  })
  await replayTutorial(page)
  await expect(page).toHaveURL(/\/world$/)
  await expect(page.locator('.tutorial-prompt-field')).toContainText('移動')
  await expect(page.getByLabel('ワールドマップ')).toHaveAttribute('data-world-x', '20')
  await expect(page.getByLabel('ワールドマップ')).toHaveAttribute('data-world-y', '14')
  await expect.poll(() => readStoredGameState(page)).toMatchObject({
    battleSession: null,
    progress: { progress: { inventory: { patchKit: 2 }, gold: 0 } },
    rpg: { state: {
      currentHp: 73, worldMapId: 'overworld', worldPosition: { x: 20, y: 14 },
      stepsSinceEncounter: 0, encounterCount: 12, partyMemberIds: ['byte'],
    } },
  })
  await page.reload()
  await expect(page.locator('.tutorial-prompt-field')).toContainText('移動')
  await expect.poll(() => readStoredGameState(page)).toMatchObject({
    battleSession: null,
    progress: { progress: { inventory: { patchKit: 2 } } },
    rpg: { state: { currentHp: 73, worldPosition: { x: 20, y: 14 } } },
  })
})

test('Deep ForestからREPLAYしても同じWorld開始地点へ戻す', async ({ page }) => {
  await seedReplayState(page, 'js-deep-forest', { x: 5, y: 10 })
  await page.goto('/world')
  await expect(page.getByLabel('JavaScript深層の森のマップ')).toBeVisible()

  await replayTutorial(page)

  const map = page.getByLabel('ワールドマップ')
  await expect(map).toHaveAttribute('data-world-map', 'overworld')
  await expect(map).toHaveAttribute('data-world-x', '20')
  await expect(map).toHaveAttribute('data-world-y', '14')
  await expect(page.locator('.tutorial-prompt-field')).toContainText('移動')
  const stored = await storedRpg(page)
  expect(stored.state.partyMemberIds).toEqual(['byte'])
  expect(stored.state.currentHp).toBe(73)
})

test('通常の初回direct Battle entryはBattle phaseへfallbackする', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((key) => {
    localStorage.clear()
    localStorage.setItem(key, JSON.stringify({ version: 1, status: 'active', phase: 'field-move' }))
  }, TUTORIAL_KEY)
  await page.goto('/javascript/battle/1?seed=direct-first-time')

  await expect(page).toHaveURL(/\/javascript\/battle\/1/)
  await expect.poll(async () =>
    page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.phase, TUTORIAL_KEY),
  ).toBe('battle')
})