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

test('Forest南側の野営地は通り抜けられず、共通アクションから0 Goldで部分回復できる', async ({ page }) => {
  await seedMap(page, 'js-forest', { x: 22, y: 33 }, [...JS_TRAINING_COMPLETE])

  const map = page.getByLabel('JavaScriptの森のマップ')
  const campObject = page.locator('[data-recovery-stop="forest-traveler-camp"]')
  await expect(campObject).toBeVisible()
  await expect(campObject).not.toHaveAttribute('role', 'button')

  const campVisual = await campObject.evaluate((element) => {
    const tent = getComputedStyle(element, '::before')
    const fire = getComputedStyle(element, '::after')
    return {
      tentContent: tent.content,
      tentWidth: Number.parseFloat(tent.width),
      fireContent: fire.content,
      fireWidth: Number.parseFloat(fire.width),
    }
  })
  expect(campVisual.tentContent).not.toBe('none')
  expect(campVisual.tentWidth).toBeGreaterThan(0)
  expect(campVisual.fireContent).not.toBe('none')
  expect(campVisual.fireWidth).toBeGreaterThan(0)

  const action = page.getByRole('button', { name: '野営地で休む' })
  await expect(action).toBeVisible()
  await expect(action).toBeEnabled()

  // The tent/fire occupies its tile. Walking north faces it but must not put the
  // player on top of the camp.
  await page.getByRole('button', { name: '上へ移動' }).click()
  await expect(map).toHaveAttribute('data-world-x', '22')
  await expect(map).toHaveAttribute('data-world-y', '33')
  await expect(action).toBeEnabled()

  await action.click()

  await expect(page.getByRole('status')).toContainText('野営地: HPを')
  const stored = await readStoredRpg(page)
  expect(stored.state.currentHp).toBeGreaterThan(20)
})

test('Deep Forestの湧き水も通り抜けず、共通アクションから利用できる', async ({ page }) => {
  await seedMap(page, 'js-deep-forest', { x: 16, y: 10 }, [...JS_SECOND_INCIDENT_PREREQS])

  const map = page.getByLabel('JavaScript深層の森のマップ')
  const action = page.getByRole('button', { name: '湧き水で休む' })
  await expect(action).toBeVisible()
  await expect(action).toBeEnabled()

  await page.getByRole('button', { name: '下へ移動' }).click()
  await expect(map).toHaveAttribute('data-world-x', '16')
  await expect(map).toHaveAttribute('data-world-y', '10')
  await expect(action).toBeEnabled()

  await action.click()

  await expect(page.getByRole('status')).toContainText('湧き水: HPを')
  const stored = await readStoredRpg(page)
  expect(stored.state.currentHp).toBeGreaterThan(20)
})
