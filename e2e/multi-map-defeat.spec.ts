import { readStoredGameState, readStoredRpg } from './storedGameState'
import { expect, test } from '@playwright/test'
import { JS_FIRST_INCIDENT } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const initialSkills = ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label']

test('GREENFIELD宿へ立ち寄った後の敗北は保存checkpointへ開始HPのまま戻る', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, skills, clearedStageIds }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 0 },
            clearedStageIds,
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [7],
            unlockedSkillIds: skills,
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 6,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: [],
            worldMapId: 'js-village',
            worldPosition: { x: 5, y: 12 },
            stepsSinceEncounter: 8,
            encounterCount: 0,
            currentHp: 1,
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
      clearedStageIds: [...JS_FIRST_INCIDENT],
    },
  )

  await page.goto('/world')
  await page.getByRole('button', { name: '宿で休む' }).click()
  const inn = page.getByRole('dialog', { name: '宿' })
  await expect(inn).toBeVisible()
  await expect.poll(async () => readStoredRpg(page)).toMatchObject({
    version: 7,
    state: {
      worldCheckpoint: {
        id: 'greenfield-village',
        mapId: 'js-village',
        position: { x: 10, y: 12 },
      },
    },
  })
  await inn.getByRole('button', { name: '宿を閉じる' }).click()

  await page.goto('/javascript/battle/7?seed=defeat-village-e2e&returnTo=%2Fworld')
  await expect.poll(() => readStoredGameState(page)).toMatchObject({
    version: 2,
    battleSession: {
      identity: { battleId: 7 },
      rpg: {
        state: {
          currentHp: 1,
          worldMapId: 'js-village',
          worldCheckpoint: { id: 'greenfield-village' },
        },
      },
    },
  })

  const story = page.locator('.battle-story-window')
  await expect(story).toBeVisible()
  await story.getByRole('button', { name: 'スキップ', exact: true }).click()
  await expect(story).toBeHidden()

  const trace = page.getByRole('button', { name: /^TRACE\b/ })
  await expect(trace).toBeEnabled()
  await trace.click()
  await expect(trace).toHaveClass(/selected/)
  await trace.click()
  await expect(page.getByText('敗北', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: /チェックポイントへ戻る/ }).click()
  await expect(page).toHaveURL(/\/world$/)
  const village = page.getByLabel('グリーンフィールド村のマップ')
  await expect(village).toHaveAttribute('data-world-map', 'js-village')
  await expect(village).toHaveAttribute('data-world-x', '10')
  await expect(village).toHaveAttribute('data-world-y', '12')
  await expect.poll(async () => readStoredRpg(page)).toMatchObject({
    version: 7,
    state: {
      worldMapId: 'js-village',
      worldPosition: { x: 10, y: 12 },
      worldCheckpoint: { id: 'greenfield-village' },
      currentHp: 1,
      stepsSinceEncounter: 4,
    },
  })
})
