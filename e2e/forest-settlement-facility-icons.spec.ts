import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('森番の集落でも宿と補給所を文字ではなくpixel iconで識別できる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 160,
          gold: 54,
          inventory: { patchKit: 0 },
          clearedStageIds: [1, 7, 8, 9, 10, 11, 12, 13, 14],
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 7],
          unlockedSkillIds: ['trace', 'pulse', 'nova', 'link', 'fork', 'gather'],
        },
      }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 7,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: ['byte'],
          partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
          worldMapId: 'js-forest-settlement',
          worldPosition: { x: 11, y: 12 },
          safeCheckpoint: {
            id: 'forest-settlement',
            mapId: 'js-forest-settlement',
            position: { x: 11, y: 11 },
          },
          stepsSinceEncounter: 0,
          encounterCount: 0,
          currentHp: 100,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )

  await page.goto('/world')
  const settlement = page.locator('.world-viewport[data-world-map="js-forest-settlement"]')
  await expect(settlement).toBeVisible()

  const markers = settlement.locator('.facility-object[data-facility-icon]')
  await expect(markers).toHaveCount(2)

  for (const kind of ['inn', 'item-shop']) {
    const marker = settlement.locator(`.facility-object[data-facility-icon="${kind}"]`)
    await expect(marker).toHaveText('')
    const visual = await marker.evaluate((element) => {
      const style = getComputedStyle(element)
      const before = getComputedStyle(element, '::before')
      const after = getComputedStyle(element, '::after')
      return {
        width: Number.parseFloat(style.width),
        beforeWidth: Number.parseFloat(before.width),
        beforeHeight: Number.parseFloat(before.height),
        afterWidth: Number.parseFloat(after.width),
        afterHeight: Number.parseFloat(after.height),
      }
    })
    expect(visual.width).toBeGreaterThanOrEqual(20)
    expect(visual.beforeWidth).toBeGreaterThan(2)
    expect(visual.beforeHeight).toBeGreaterThan(2)
    expect(visual.afterWidth).toBeGreaterThan(2)
    expect(visual.afterHeight).toBeGreaterThan(2)
  }

  const fieldText = await settlement.textContent()
  expect(fieldText).not.toContain('宿')
  expect(fieldText).not.toContain('道具屋')
  expect(fieldText).not.toContain('補給所')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})
