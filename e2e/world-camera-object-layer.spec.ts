import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorld(
  page: Page,
  options: {
    mapId: string
    position: { x: number; y: number }
    clearedStageIds?: number[]
  },
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, mapId, position, clearedStageIds }) => {
      localStorage.clear()
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
            equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: [],
            partyEquipment: {},
            worldMapId: mapId,
            worldPosition: position,
            stepsSinceEncounter: 0,
            encounterCount: 0,
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
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      mapId: options.mapId,
      position: options.position,
      clearedStageIds: options.clearedStageIds ?? [],
    },
  )
}

test('camera pan中も固定objectはterrain snapshotより前面に残る', async ({ page }) => {
  await seedWorld(page, { mapId: 'overworld', position: { x: 20, y: 14 } })
  await page.goto('/world')

  const shop = page.locator('[data-world-x="20"][data-world-y="12"] .world-object').first()
  await expect(shop).toBeVisible()

  await page.getByRole('button', { name: '右へ移動' }).click()
  const snapshot = page.locator('.world-camera-snapshot')
  await expect(snapshot).toBeVisible()

  const layers = await page.evaluate(() => {
    const snapshotElement = document.querySelector<HTMLElement>('.world-camera-snapshot')
    const objectElement = document.querySelector<HTMLElement>('.world-object')
    if (!snapshotElement || !objectElement) return null
    return {
      snapshot: Number(getComputedStyle(snapshotElement).zIndex),
      object: Number(getComputedStyle(objectElement).zIndex),
    }
  })

  expect(layers).not.toBeNull()
  expect(layers?.snapshot).toBeLessThan(layers?.object ?? 0)
  await expect(shop).toBeVisible()
})

test('camera pan中も固定NPCと対応tileの相対位置が変わらない', async ({ page }) => {
  await seedWorld(page, {
    mapId: 'js-village',
    position: { x: 10, y: 7 },
    clearedStageIds: [1],
  })
  await page.goto('/world')

  const mio = page.locator('[data-world-npc="trainer-mio"]')
  const trainingTile = page.locator(
    '[data-world-map="js-village"][data-world-x="12"][data-world-y="7"].world-tile',
  )
  await expect(mio).toBeVisible()
  await expect(trainingTile).toBeVisible()

  const getRelativeOffset = async () =>
    page.evaluate(() => {
      const npc = document.querySelector<HTMLElement>('[data-world-npc="trainer-mio"]')
      const tile = document.querySelector<HTMLElement>(
        '[data-world-map="js-village"][data-world-x="12"][data-world-y="7"].world-tile',
      )
      if (!npc || !tile) return null
      const npcRect = npc.getBoundingClientRect()
      const tileRect = tile.getBoundingClientRect()
      return {
        x: npcRect.left + npcRect.width / 2 - (tileRect.left + tileRect.width / 2),
        y: npcRect.top + npcRect.height / 2 - (tileRect.top + tileRect.height / 2),
      }
    })

  const before = await getRelativeOffset()
  expect(before).not.toBeNull()

  await page.getByRole('button', { name: '左へ移動' }).click()
  const snapshot = page.locator('.world-camera-snapshot')
  await expect(snapshot).toBeVisible()
  await page.waitForTimeout(40)

  const during = await getRelativeOffset()
  expect(during).not.toBeNull()
  expect(Math.abs((during?.x ?? 0) - (before?.x ?? 0))).toBeLessThan(1.5)
  expect(Math.abs((during?.y ?? 0) - (before?.y ?? 0))).toBeLessThan(1.5)

  await expect(snapshot).toBeHidden()
  const after = await getRelativeOffset()
  expect(after).not.toBeNull()
  expect(Math.abs((after?.x ?? 0) - (before?.x ?? 0))).toBeLessThan(1.5)
  expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThan(1.5)
})
