import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('GREENFIELD VILLAGE入口からTRAIN・住人・宿・店・出口が同じ導線として読める', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
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
  await expect(village.locator('[data-world-x="12"][data-world-y="7"].terrain-training')).toBeVisible()
  await expect(village.locator('[data-world-x="10"][data-world-y="8"]')).toBeVisible()
  await expect(village.locator('[data-world-x="10"][data-world-y="14"].terrain-exit')).toBeVisible()

  for (const npcId of ['trainer-mio', 'village-child', 'forest-traveler', 'misfire-adventurer']) {
    await expect(village.locator(`[data-world-npc="${npcId}"]`)).toBeVisible()
  }

  for (const npcId of ['village-child', 'forest-traveler', 'misfire-adventurer']) {
    await expect(village.locator(`[data-world-npc="${npcId}"] .world-resident-marker`)).toHaveCSS('font-size', '0px')
  }

  const facilities = [
    { kind: 'inn', x: '5', y: '11' },
    { kind: 'item-shop', x: '14', y: '11' },
    { kind: 'equipment-shop', x: '15', y: '11' },
  ] as const
  for (const facility of facilities) {
    const tile = village.locator(
      `.terrain-house[data-world-x="${facility.x}"][data-world-y="${facility.y}"]`,
    )
    const sign = tile.locator(`[data-village-facility="${facility.kind}"]`)
    await expect(tile).toBeVisible()
    await expect(sign).toBeVisible()
  }

  const entryGeometry = await village.evaluate((viewport) => {
    const bounds = viewport.getBoundingClientRect()
    const facilitySigns = Array.from(viewport.querySelectorAll<HTMLElement>('[data-village-facility]'))
    return {
      allFacilitiesInsideViewport: facilitySigns.every((sign) => {
        const rect = sign.getBoundingClientRect()
        return rect.left >= bounds.left && rect.right <= bounds.right && rect.top >= bounds.top && rect.bottom <= bounds.bottom
      }),
      visibleFacilities: facilitySigns.length,
    }
  })
  expect(entryGeometry.visibleFacilities).toBe(3)
  expect(entryGeometry.allFacilitiesInsideViewport).toBe(true)

  const leftRoof = village.locator('.terrain-house[data-world-x="5"][data-world-y="9"]')
  const rightRoof = village.locator('.terrain-house[data-world-x="14"][data-world-y="9"]')
  const [leftRoofShape, rightRoofShape] = await Promise.all([
    leftRoof.evaluate((element) => getComputedStyle(element, '::before').clipPath),
    rightRoof.evaluate((element) => getComputedStyle(element, '::before').clipPath),
  ])
  expect(leftRoofShape).not.toBe('none')
  expect(rightRoofShape).not.toBe('none')

  const entryPurpose = await village.locator('.world-entry-transition').evaluate((element) =>
    getComputedStyle(element, '::after').content,
  )
  expect(entryPurpose).toContain('安全な中継地点')
})
