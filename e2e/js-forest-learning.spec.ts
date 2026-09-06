import { expect, test, type Page } from '@playwright/test'
import { readStoredGameState } from './storedGameState'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const initialSkills = ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label']

type ForestGateState = 'training-incomplete' | 'incident-only' | 'training-complete'

async function seedForestGate(page: Page, state: ForestGateState) {
  const clearedStageIds =
    state === 'training-incomplete'
      ? [1, 7, 8]
      : state === 'incident-only'
        ? [1]
        : [1, 7, 8, 9]

  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, skills, cleared }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 12 + Math.max(0, cleared.length - 1) * 8,
            gold: 20,
            inventory: { patchKit: 0 },
            clearedStageIds: cleared,
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 7],
            unlockedSkillIds: skills,
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
            partyEquipment: {
              byte: { weapon: null, armor: null, accessory: null },
            },
            worldMapId: 'overworld',
            worldPosition: { x: 34, y: 33 },
            stepsSinceEncounter: 8,
            encounterCount: 0,
            currentHp: 100,
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
      skills: initialSkills,
      cleared: clearedStageIds,
    },
  )
  await page.goto('/world')
}

test('Training 9未clearではForest入口が閉じている', async ({ page }) => {
  await seedForestGate(page, 'training-incomplete')

  await expect(page.getByLabel('ワールドマップ')).toHaveAttribute('data-world-map', 'overworld')
  await page.getByRole('button', { name: '下へ移動' }).click()

  await expect(page.getByLabel('ワールドマップ')).toHaveAttribute('data-world-map', 'overworld')
  await expect(page.getByLabel('次の目的')).toContainText('調査準備')
})

test('JS-01 clearだけではForestへ入れずVillage trainingを要求する', async ({ page }) => {
  await seedForestGate(page, 'incident-only')

  await page.getByRole('button', { name: '下へ移動' }).click()

  await expect(page.getByLabel('ワールドマップ')).toHaveAttribute('data-world-map', 'overworld')
  await expect(page.getByLabel('次の目的')).toContainText('調査準備')
})

test('Village training完了後はForestへ入りreload後もlocal mapを保持する', async ({ page }) => {
  await seedForestGate(page, 'training-complete')

  await page.getByRole('button', { name: '下へ移動' }).click()
  await page.getByRole('button', { name: 'JavaScriptの森へ入る' }).click()
  const forest = page.getByLabel('JavaScriptの森のマップ')
  await expect(forest).toHaveAttribute('data-world-map', 'js-forest')
  await expect(page.locator('.world-header')).toBeHidden()
  await expect(page.getByLabel('次の目的')).toContainText('経路を追う · 1')
  await expect(page.getByLabel('次の目的')).toContainText('二つの条件を両方通る枝')

  await page.reload()
  await expect(page.getByLabel('JavaScriptの森のマップ')).toHaveAttribute('data-world-map', 'js-forest')
  await expect(page.locator('.world-header')).toBeHidden()
})

test('Forest最初のWoodsはRandom抽選ではなくBattle 10の固定traceになる', async ({ page }) => {
  await seedForestGate(page, 'training-complete')

  await page.getByRole('button', { name: '下へ移動' }).click()
  await page.getByRole('button', { name: 'JavaScriptの森へ入る' }).click()
  await expect(page.getByLabel('JavaScriptの森のマップ')).toHaveAttribute('data-world-map', 'js-forest')

  await page.getByRole('button', { name: '左へ移動' }).click()
  await page.getByRole('button', { name: '左へ移動' }).click()
  await page.getByRole('button', { name: '左へ移動' }).click()
  await page.getByRole('button', { name: '上へ移動' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/10\?/)
  await expect(page.getByRole('dialog', { name: 'Forestで自分の読み順を決める' })).toBeVisible()
})

test('Forest Battle 10はBYTEが読む順を委ね、Battle 11は次のtraceだけを説明する', async ({ page }) => {
  await seedForestGate(page, 'training-complete')

  await page.goto('/javascript/battle/10?seed=forest-e2e-and&returnTo=%2Fworld')
  const andStory = page.getByRole('dialog', { name: 'Forestで自分の読み順を決める' })
  await expect(andStory).toBeVisible()
  await expect(andStory).toContainText('trace')
  await expect(andStory).toContainText('二つの条件')
  await expect(andStory).not.toContainText('filter()')
  await andStory.getByRole('button', { name: /次へ/ }).click()
  await expect(andStory).toContainText('先に言わない')
  await expect(andStory).toContainText('君が決めた順')
  await expect(andStory).not.toContainText('filter()')

  // End the unfinished attempt before installing the next Story's clear fixture.
  // Otherwise reload correctly rolls the synthetic clear back with that attempt.
  await page.goto('/world')
  await expect.poll(async () => (await readStoredGameState(page)).battleSession).toBeNull()
  await page.evaluate(() => {
    const key = 'code-reading-rpg:game-state'
    const stored = JSON.parse(localStorage.getItem(key) ?? 'null')
    stored.progress.progress.clearedStageIds = [...new Set([...stored.progress.progress.clearedStageIds, 10])]
    stored.revision += 1
    localStorage.setItem(key, JSON.stringify(stored))
  })

  await page.goto('/javascript/battle/11?seed=forest-e2e-or&returnTo=%2Fworld')
  const orStory = page.getByRole('dialog', { name: '別の入口からも同じ異常へ入る' })
  await expect(orStory).toBeVisible()
  await expect(orStory).toContainText('||')
  await expect(orStory).not.toContainText('filter()')
  await orStory.getByRole('button', { name: /次へ/ }).click()
  await expect(orStory).toContainText('どちらか一方でもtrue')
  await expect(orStory).not.toContainText('filter()')
})
