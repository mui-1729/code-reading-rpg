import { expect, test, type Page } from '@playwright/test'

const TUTORIAL_KEY = 'code-reading-rpg:tutorial'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const PROGRESS_KEY = 'code-reading-rpg:player-progress'

async function skipTutorial(page: Page) {
  await page.goto('/')
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
  }, TUTORIAL_KEY)
}

async function seedFirstIncidentClear(page: Page) {
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({
      version: 4,
      progress: {
        exp: 12,
        gold: 20,
        inventory: { patchKit: 0 },
        clearedStageIds: [1],
        clearedAreaIds: [],
        completedSideQuestIds: [],
        unlockedStageIds: [1, 7],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
      },
    }))
  }, PROGRESS_KEY)
}

async function seedTypeScriptAccess(page: Page) {
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({
      version: 4,
      progress: {
        exp: 0,
        gold: 0,
        inventory: { patchKit: 0 },
        clearedStageIds: [3],
        clearedAreaIds: ['javascript'],
        completedSideQuestIds: [],
        unlockedStageIds: [1, 4, 7],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
      },
    }))
  }, PROGRESS_KEY)
}

async function seedVillage(page: Page) {
  await skipTutorial(page)
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({
      version: 4,
      state: {
        equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
        ownedEquipmentIds: ['training-blade', 'traveler-coat'],
        partyMemberIds: ['byte'],
        partyEquipment: {},
        worldMapId: 'js-village',
        worldPosition: { x: 12, y: 8 },
        stepsSinceEncounter: 8,
        encounterCount: 0,
        currentHp: 108,
        openedTreasureIds: [],
      },
    }))
  }, RPG_KEY)
  await page.goto('/world')
}

test('Village Training StoryでTRAINER MIOのpixel portraitを表示する', async ({ page }) => {
  await skipTutorial(page)
  await seedFirstIncidentClear(page)
  await page.goto('/javascript/battle/7?seed=village-training%3A7&returnTo=%2Fworld')

  const portrait = page.getByAltText('TRAINER MIO portrait')
  await expect(portrait).toBeVisible()
  await expect(portrait).toHaveAttribute('src', '/pixel-art/characters/trainer-mio-portrait.svg')
})

test('VillageのTRAIN地点にTRAINER MIOのfield spriteを表示する', async ({ page }) => {
  await seedVillage(page)

  const mio = page.getByAltText('TRAINER MIO')
  await expect(mio).toBeVisible()
  await expect(mio).toHaveAttribute('src', '/pixel-art/characters/trainer-mio-field.svg')
})

test('TypeScript StoryでLEAD ADAとTYPE WARDENに固有portraitを表示する', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await skipTutorial(page)
  await seedTypeScriptAccess(page)
  await page.goto('/typescript/battle/4?seed=character-visual-mobile&returnTo=%2Fworld')

  const ada = page.getByAltText('LEAD ADA portrait')
  await expect(ada).toBeVisible()
  await expect(ada).toHaveAttribute('src', '/pixel-art/characters/lead-ada-portrait.svg')

  await page.getByRole('button', { name: '▶ NEXT' }).click()

  const warden = page.getByAltText('TYPE WARDEN portrait')
  await expect(warden).toBeVisible()
  await expect(warden).toHaveAttribute('src', '/pixel-art/characters/type-warden-portrait.svg')

  const box = await warden.boundingBox()
  expect(box).not.toBeNull()
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390)
})
