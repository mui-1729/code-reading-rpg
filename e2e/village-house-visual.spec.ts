import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('Villageのhouseは複数tileで屋根・壁・扉を描き入口文字に依存しない', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 12,
          gold: 20,
          inventory: { patchKit: 0 },
          clearedStageIds: [1],
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 7],
          unlockedSkillIds: ['trace', 'pulse', 'nova'],
        },
      }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 5,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: [],
          partyEquipment: {},
          worldMapId: 'js-village',
          worldPosition: { x: 10, y: 12 },
          stepsSinceEncounter: 0,
          encounterCount: 0,
          currentHp: 108,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )

  await page.goto('/world')
  const village = page.locator('.world-viewport[data-world-map="js-village"]')
  await expect(village).toBeVisible()

  const westRoof = village.locator('[data-world-x="5"][data-world-y="9"].terrain-house')
  const eastRoof = village.locator('[data-world-x="15"][data-world-y="9"].terrain-house')
  const westDoor = village.locator('[data-world-x="5"][data-world-y="11"].terrain-house')
  const eastDoor = village.locator('[data-world-x="15"][data-world-y="11"].terrain-house')
  await expect(westRoof).toBeVisible()
  await expect(eastRoof).toBeVisible()
  await expect(westDoor).toBeVisible()
  await expect(eastDoor).toBeVisible()

  const palettes = await Promise.all([
    westRoof.evaluate((element) => getComputedStyle(element).getPropertyValue('--house-roof').trim()),
    eastRoof.evaluate((element) => getComputedStyle(element).getPropertyValue('--house-roof').trim()),
  ])
  expect(palettes[0]).not.toBe(palettes[1])

  for (const door of [westDoor, eastDoor]) {
    const visual = await door.evaluate((element) => {
      const style = getComputedStyle(element, '::after')
      return {
        content: style.content,
        width: Number.parseFloat(style.width),
        height: Number.parseFloat(style.height),
        backgroundImage: style.backgroundImage,
      }
    })
    expect(visual.content).not.toContain('入口')
    expect(visual.width).toBeGreaterThan(8)
    expect(visual.height).toBeGreaterThan(12)
    expect(visual.backgroundImage).toContain('radial-gradient')
  }

  const slopedRoof = await village
    .locator('[data-world-x="14"][data-world-y="9"].terrain-house')
    .evaluate((element) => getComputedStyle(element, '::before').clipPath)
  expect(slopedRoof).not.toBe('none')

  const lane = village.locator('[data-world-x="7"][data-world-y="12"]')
  await expect(lane).toBeVisible()
  expect(await lane.evaluate((element) => getComputedStyle(element).backgroundImage)).not.toBe('none')

  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})
