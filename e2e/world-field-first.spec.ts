import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorld(
  page: Page,
  mapId: 'overworld' | 'js-village' | 'js-forest' | 'js-deep-forest' | 'ts-frontier',
  position: { x: number; y: number },
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, mapId, position }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 1 },
            clearedStageIds: [1, 7, 8, 9],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 7],
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
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
            partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
            worldMapId: mapId,
            worldPosition: position,
            stepsSinceEncounter: 0,
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
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY, mapId, position },
  )
  await page.goto('/world')
}

async function expectFieldFirst(page: Page) {
  const viewport = page.locator('.world-viewport')
  const objective = page.locator('.world-next-objective')

  await expect(viewport).toBeVisible()
  await expect(page.locator('.world-header')).toBeHidden()
  await expect(objective).toBeVisible()

  const geometry = await page.evaluate(() => {
    const viewport = document.querySelector<HTMLElement>('.world-viewport')?.getBoundingClientRect()
    const objective = document.querySelector<HTMLElement>('.world-next-objective')?.getBoundingClientRect()
    return {
      viewportTop: viewport?.top ?? Number.POSITIVE_INFINITY,
      viewportBottom: viewport?.bottom ?? Number.POSITIVE_INFINITY,
      objectiveTop: objective?.top ?? Number.NEGATIVE_INFINITY,
    }
  })

  expect(geometry.viewportTop).toBeLessThan(geometry.objectiveTop)
  expect(geometry.viewportBottom).toBeLessThanOrEqual(geometry.objectiveTop + 1)
}

test('Overworld / local mapは常設headerよりfieldを先に見せる', async ({ page }) => {
  await seedWorld(page, 'overworld', { x: 20, y: 14 })
  await expectFieldFirst(page)
  await expect(page.getByLabel('ワールドマップ')).toBeVisible()

  await seedWorld(page, 'js-forest', { x: 28, y: 10 })
  await expectFieldFirst(page)
  await expect(page.getByLabel('JavaScriptの森のマップ')).toBeVisible()
})

test('TypeScript辺境も同じfield-first hierarchyを使う', async ({ page }) => {
  await seedWorld(page, 'ts-frontier', { x: 2, y: 10 })
  await expectFieldFirst(page)
  await expect(page.getByLabel('TypeScript辺境のマップ')).toBeVisible()
})

test('mobileではObjective詳細を畳みfield面積を優先する', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedWorld(page, 'js-village', { x: 10, y: 12 })

  await expectFieldFirst(page)
  await expect(page.locator('.world-next-objective > p')).toBeHidden()
  await expect(page.locator('.world-next-objective > strong')).toBeVisible()
})
