import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('Villageのhouseは複数tileで屋根・壁・扉を描き施設文字に依存しない', async ({ page }) => {
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

  // A whole building has one roof and one functional entrance, independently
  // of how many collision cells it occupies.
  const inn = village.locator('[data-world-building="greenfield-inn"]')
  const market = village.locator('[data-world-building="greenfield-market"]')
  for (const building of [inn, market]) {
    await expect(building).toHaveCount(1)
    await expect(building.locator('[data-building-roof]')).toHaveCount(1)
    await expect(building.locator('[data-building-entrance]')).toHaveCount(1)
  }
  expect(await inn.locator('[data-building-roof]').getAttribute('fill')).not.toBe(
    await market.locator('[data-building-roof]').getAttribute('fill'),
  )
  for (const [building, x] of [[inn, '5'], [market, '14']] as const) {
    const door = await building.locator('[data-building-entrance]').boundingBox()
    const tile = await village.locator(`.terrain-house[data-world-x="${x}"][data-world-y="11"]`).boundingBox()
    expect(door).not.toBeNull()
    expect(tile).not.toBeNull()
    expect(Math.abs(door!.x + door!.width / 2 - tile!.x - tile!.width / 2)).toBeLessThan(1)
    expect(door!.y).toBeGreaterThanOrEqual(tile!.y)
    expect(door!.y + door!.height).toBeLessThanOrEqual(tile!.y + tile!.height)
  }
  const facilityMarkers = village.locator('.facility-object[data-facility-icon]')
  await expect(facilityMarkers).toHaveCount(2)
  for (const kind of ['inn', 'item-shop']) {
    const marker = village.locator(`.facility-object[data-facility-icon="${kind}"]`)
    await expect(marker).toHaveText('')
    const visual = await marker.evaluate((element) => {
      const before = getComputedStyle(element, '::before')
      const after = getComputedStyle(element, '::after')
      return {
        width: Number.parseFloat(getComputedStyle(element).width),
        beforeContent: before.content,
        beforeWidth: Number.parseFloat(before.width),
        beforeHeight: Number.parseFloat(before.height),
        afterContent: after.content,
        afterWidth: Number.parseFloat(after.width),
        afterHeight: Number.parseFloat(after.height),
      }
    })
    expect(visual.width).toBeGreaterThanOrEqual(20)
    expect(visual.beforeContent).not.toBe('none')
    expect(visual.beforeWidth).toBeGreaterThan(2)
    expect(visual.beforeHeight).toBeGreaterThan(2)
    expect(visual.afterContent).not.toBe('none')
    expect(visual.afterWidth).toBeGreaterThan(2)
    expect(visual.afterHeight).toBeGreaterThan(2)
  }

  const fieldText = await village.textContent()
  expect(fieldText).not.toContain('道具屋')
  expect(fieldText).not.toContain('装備屋')
  expect(fieldText).not.toContain('宿')

  // The entrance drawn on the inn must also be the place where it can be used.
  for (let step = 0; step < 5; step += 1) {
    await page.getByRole('button', { name: '左へ移動', exact: true }).click()
  }
  await expect(village).toHaveAttribute('data-world-x', '5')
  await page.getByRole('button', { name: '上へ移動', exact: true }).click()
  await expect(village).toHaveAttribute('data-world-y', '12')
  await page.getByRole('button', { name: '宿で休む', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '宿', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')

  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})
