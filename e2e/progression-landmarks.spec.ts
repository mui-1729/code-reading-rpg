import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorld(
  page: Page,
  options: {
    mapId: 'js-forest' | 'js-deep-forest'
    position: { x: number; y: number }
    clearedStageIds: number[]
    unlockedStageIds: number[]
  },
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, options: seed }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 180,
            gold: 60,
            inventory: { patchKit: 1 },
            clearedStageIds: seed.clearedStageIds,
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: seed.unlockedStageIds,
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper', 'link', 'fork'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 4,
          state: {
            equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: ['byte'],
            partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
            worldMapId: seed.mapId,
            worldPosition: seed.position,
            stepsSinceEncounter: 0,
            encounterCount: 4,
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
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY, options },
  )
  await page.goto('/world')
}

test('@responsive Forestでは固定Battle 11の前に文字札ではなく川辺の足跡が見え、倒木の手前へ踏み込むとそのBattleが始まる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedWorld(page, {
    mapId: 'js-forest',
    position: { x: 35, y: 12 },
    clearedStageIds: [1, 7, 8, 9, 10],
    unlockedStageIds: [1, 7, 8, 9, 10, 11],
  })

  const landmark = page.locator('[data-progression-battle="11"]')
  await expect(landmark).toBeVisible()
  await expect(landmark).toHaveAttribute('aria-label', '川辺の泥に足跡が残っている')
  await expect(landmark).toHaveCSS('font-size', '0px')
  await expect(landmark).toHaveCSS('image-rendering', 'pixelated')
  const footprint = await landmark.evaluate(element => getComputedStyle(element).backgroundImage)
  expect(footprint).toContain('/pixel-art/world/clue-tracks.svg')
  const image = await page.request.get('/pixel-art/world/clue-tracks.svg')
  expect(image.ok()).toBe(true)
  expect(await image.text()).toContain('viewBox="0 0 16 16"')

  await page.getByRole('button', { name: '左へ移動' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/11/)
})

test('@responsive Deep Forestでも固定Battle 16は文字札ではなく割れた実のsceneryとして読める', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedWorld(page, {
    mapId: 'js-deep-forest',
    position: { x: 53, y: 17 },
    clearedStageIds: [1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15],
    unlockedStageIds: [1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15, 16],
  })

  const landmark = page.locator('[data-progression-battle="16"]')
  await expect(landmark).toBeVisible()
  await expect(landmark).toHaveAttribute(
    'aria-label',
    '割れた実と形の違う種子が一緒に散らばっている',
  )
  await expect(landmark).toHaveCSS('font-size', '0px')
  await expect(landmark).toHaveCSS('image-rendering', 'pixelated')
  const fruit = await landmark.evaluate(element => getComputedStyle(element).backgroundImage)
  expect(fruit).toContain('/pixel-art/world/clue-seeds.svg')
  const image = await page.request.get('/pixel-art/world/clue-seeds.svg')
  expect(image.ok()).toBe(true)
  expect(await image.text()).toContain('viewBox="0 0 16 16"')

  await page.getByRole('button', { name: '左へ移動' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/16/)
})


test('@responsive Root Guardian後は泉の北へ案内し、東の爪痕で次のtraceが始まる', async ({ page }) => {
  const clearedStageIds = [1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15, 16, 17, 18, 19]
  await seedWorld(page, {
    mapId: 'js-deep-forest', position: { x: 35, y: 35 },
    clearedStageIds, unlockedStageIds: [...clearedStageIds, 20],
  })
  await expect(page.getByLabel('次の目的')).toContainText('泉の北側の爪痕')
  await expect(page.locator('[data-progression-battle="20"]')).toBeVisible()
  await page.getByRole('button', { name: '右へ移動' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/20/)
})
