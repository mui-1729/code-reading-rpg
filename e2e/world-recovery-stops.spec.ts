import { expect, test, type Page } from '@playwright/test'
import { JS_SECOND_INCIDENT_PREREQS, JS_TRAINING_COMPLETE } from './canonical-progress-fixtures'
import { readStoredRpg } from './storedGameState'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedMap(
  page: Page,
  mapId: 'js-forest' | 'js-deep-forest',
  position: { x: number; y: number },
  clearedStageIds: readonly number[],
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, mapId, position, clearedStageIds }) => {
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
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: clearedStageIds,
            unlockedSkillIds: ['trace', 'pulse', 'nova'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 5,
          state: {
            equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: ['byte'],
            partyEquipment: {},
            worldMapId: mapId,
            worldPosition: position,
            stepsSinceEncounter: 0,
            encounterCount: 0,
            currentHp: 20,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY, mapId, position, clearedStageIds },
  )
  await page.goto('/world')
}

async function expectFacedRecoveryAction(
  page: Page,
  stopId: string,
  actionLabel: string,
  startPosition: { x: number; y: number },
) {
  const viewport = page.locator('.world-viewport')
  const player = page.locator('.world-player-sprite')
  const log = page.locator('.world-message p')
  const scenery = page.locator(`[data-recovery-stop="${stopId}"]`)

  await expect(scenery).toBeVisible()
  await expect(scenery).toHaveJSProperty('tagName', 'SPAN')
  await expect(page.locator(`button[data-recovery-stop="${stopId}"]`)).toHaveCount(0)

  const before = await log.textContent()
  await page.getByRole('button', { name: '上へ移動' }).click()

  await expect(viewport).toHaveAttribute('data-world-x', String(startPosition.x))
  await expect(viewport).toHaveAttribute('data-world-y', String(startPosition.y))
  await expect(player).toHaveAttribute('data-facing', 'up')
  await expect(log).toHaveText(before ?? '')

  const action = page.getByRole('button', { name: actionLabel })
  await expect(action).toBeVisible()
  await expect(action).toBeEnabled()
  await action.click()
}

test('Forest中盤の野営地はsceneryへ向いて共通Actionから0 Goldで部分回復できる', async ({ page }) => {
  const start = { x: 20, y: 12 }
  await seedMap(page, 'js-forest', start, [...JS_TRAINING_COMPLETE])

  await expectFacedRecoveryAction(page, 'forest-traveler-camp', '野営地で休む', start)

  await expect(page.locator('.world-message')).toContainText('野営地: HPを')
  const stored = await readStoredRpg(page)
  expect(stored.state.currentHp).toBeGreaterThan(20)
})

test('Deep Forestの湧き水も文字buttonではなくsceneryへ向いてActionする', async ({ page }) => {
  const start = { x: 16, y: 12 }
  await seedMap(page, 'js-deep-forest', start, [...JS_SECOND_INCIDENT_PREREQS])

  await expectFacedRecoveryAction(page, 'deep-forest-spring', '湧き水で休む', start)

  await expect(page.locator('.world-message')).toContainText('湧き水: HPを')
  const stored = await readStoredRpg(page)
  expect(stored.state.currentHp).toBeGreaterThan(20)
})
