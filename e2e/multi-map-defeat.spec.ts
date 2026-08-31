import { readStoredGameState, readStoredRpg } from './storedGameState'
import { expect, test } from '@playwright/test'
import { JS_FIRST_INCIDENT } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const initialSkills = ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label']

test('Village保存状態からBattleで敗北するとOverworld Hubへ戻る', async ({ page }) => {
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
            worldMapId: 'js-village',
            worldPosition: { x: 10, y: 12 },
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

  await page.goto('/javascript/battle/7?seed=defeat-village-e2e&returnTo=%2Fworld')
  await expect.poll(() => readStoredGameState(page)).toMatchObject({
    version: 2,
    battleSession: {
      identity: { battleId: 7 },
      rpg: { state: { worldMapId: 'js-village', worldPosition: { x: 10, y: 12 } } },
    },
  })
  const story = page.locator('.battle-story-window')
  await expect(story).toBeVisible()
  await story.getByRole('button', { name: 'SKIP' }).click()
  await expect(story).toBeHidden()

  const trace = page.getByRole('button', { name: /^TRACE\b/ })
  await expect(trace).toBeEnabled()
  await trace.click()
  await expect(trace).toHaveClass(/selected/)
  await trace.click()
  await expect(page.getByText('DEFEAT', { exact: true })).toBeVisible()

  await expect.poll(async () =>
    readStoredRpg(page),
  ).toMatchObject({
    version: 5,
    state: {
      worldMapId: 'overworld',
      worldPosition: { x: 20, y: 14 },
      currentHp: 108,
      stepsSinceEncounter: 8,
    },
  })

  await page.getByRole('button', { name: /RETURN TO HUB/ }).click()
  await expect(page).toHaveURL(/\/world$/)
  await expect(page.getByLabel('Open world map')).toHaveAttribute('data-world-map', 'overworld')
  await expect(page.getByLabel('Open world map')).toHaveAttribute('data-world-x', '20')
  await expect(page.getByLabel('Open world map')).toHaveAttribute('data-world-y', '14')
})
