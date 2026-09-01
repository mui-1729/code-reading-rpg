import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const JS_COMPLETE = [1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15, 16, 17, 18, 19, 20, 21, 22, 3]

async function seedPresentationState(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, clearedStageIds }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 900,
            gold: 200,
            inventory: { patchKit: 2 },
            clearedStageIds,
            clearedAreaIds: ['javascript'],
            completedSideQuestIds: [],
            unlockedStageIds: [],
            unlockedSkillIds: [],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 5,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: ['byte'],
            worldMapId: 'overworld',
            worldPosition: { x: 20, y: 14 },
            stepsSinceEncounter: 0,
            encounterCount: 0,
            currentHp: 132,
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
      clearedStageIds: [...JS_COMPLETE, 4, 5, 6],
    },
  )
}

async function battleBackground(page: Page) {
  return page.locator('.battle-stage').evaluate((element) => getComputedStyle(element).backgroundImage)
}

test('CODE WORLD探索はdark dashboardよりfieldを主役にする', async ({ page }) => {
  await seedPresentationState(page)
  await page.goto('/world')

  const panel = page.locator('.world-panel')
  const viewport = page.getByLabel('Open world map')
  const objective = page.getByLabel('Next objective')

  await expect(panel).toBeVisible()
  await expect(viewport).toBeVisible()
  await expect(objective).toBeVisible()

  const presentation = await panel.evaluate((element) => ({
    backgroundColor: getComputedStyle(element).backgroundColor,
    headingFont: getComputedStyle(element.querySelector('.world-header h1')!).fontFamily,
  }))
  expect(presentation.backgroundColor).not.toBe('rgb(8, 8, 18)')
  expect(presentation.headingFont.toLowerCase()).toContain('georgia')

  const viewportBox = await viewport.boundingBox()
  const objectiveBox = await objective.boundingBox()
  expect(viewportBox).not.toBeNull()
  expect(objectiveBox).not.toBeNull()
  expect(viewportBox!.height).toBeGreaterThan(objectiveBox!.height * 4)
})

test('ForestとTypeScriptはscene dataと背景visualが明確に異なる', async ({ page }) => {
  await seedPresentationState(page)

  await page.goto('/javascript/battle/10?seed=presentation-forest&returnTo=%2Fworld')
  const forest = page.locator('.battle-stage')
  await expect(forest).toHaveAttribute('data-battle-scene', 'javascript-forest')
  await expect(forest).toHaveAttribute('data-battle-arena', 'field')
  const forestBackground = await battleBackground(page)

  await page.goto('/typescript/battle/4?seed=presentation-typescript&returnTo=%2Fworld')
  const typescript = page.locator('.battle-stage')
  await expect(typescript).toHaveAttribute('data-battle-scene', 'typescript-frontier')
  await expect(typescript).toHaveAttribute('data-battle-arena', 'field')
  const typescriptBackground = await battleBackground(page)

  expect(typescriptBackground).not.toBe(forestBackground)
})

test('JS / TS Final Bossは名前・silhouette・sceneが別identityになる', async ({ page }) => {
  await seedPresentationState(page)

  await page.goto('/javascript/battle/3?seed=presentation-js-boss&returnTo=%2Fworld')
  const jsStage = page.locator('.battle-stage')
  await expect(jsStage).toHaveAttribute('data-battle-scene', 'javascript-core-boss')
  await expect(jsStage).toHaveAttribute('data-battle-arena', 'boss')
  const jsBoss = page.locator('[data-enemy-role="boss"]')
  await expect(jsBoss).toHaveAttribute('data-boss-display-name', 'CORE WYRM')
  await expect(jsBoss.locator('[data-enemy-visual-id]')).toHaveAttribute('data-enemy-visual-id', 'core-wyrm')
  await expect(jsBoss.getByText('CODE NAME · Boss', { exact: true })).toBeVisible()

  await page.goto('/typescript/battle/6?seed=presentation-ts-boss&returnTo=%2Fworld')
  const tsStage = page.locator('.battle-stage')
  await expect(tsStage).toHaveAttribute('data-battle-scene', 'typescript-core-boss')
  await expect(tsStage).toHaveAttribute('data-battle-arena', 'boss')
  const tsBoss = page.locator('[data-enemy-role="boss"]')
  await expect(tsBoss).toHaveAttribute('data-boss-display-name', 'CONTRACT TITAN')
  await expect(tsBoss.locator('[data-enemy-visual-id]')).toHaveAttribute('data-enemy-visual-id', 'contract-titan')
  await expect(tsBoss.getByText('CODE NAME · Boss', { exact: true })).toBeVisible()
})

test('mobileでもWorld/Boss sceneがpage全体を横overflowさせない', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedPresentationState(page)

  await page.goto('/world')
  await expect(page.getByLabel('Open world map')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)

  await page.goto('/typescript/battle/6?seed=presentation-mobile-boss&returnTo=%2Fworld')
  await expect(page.locator('.battle-stage')).toHaveAttribute('data-battle-scene', 'typescript-core-boss')
  await expect(page.getByText('CONTRACT TITAN', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
