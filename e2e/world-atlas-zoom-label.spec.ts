import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('World Atlasは実際のzoom stateを画面上の倍率表示へ反映する', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 0 },
            clearedStageIds: [],
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
            worldMapId: 'overworld',
            worldPosition: { x: 20, y: 14 },
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
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )
  await page.goto('/world')
  await page.getByRole('button', { name: 'Pause menuを開く' }).click()
  await page.getByRole('button', { name: 'MAP', exact: true }).click()

  const atlas = page.getByRole('region', { name: 'World Atlas' })
  const zoomControls = atlas.locator('.atlas-zoom')
  const visibleZoom = () =>
    zoomControls.evaluate((element) => getComputedStyle(element, '::after').content.replaceAll('"', ''))

  await expect(atlas).toHaveAttribute('data-atlas-zoom', 'fit')
  await expect.poll(visibleZoom).toBe('FIT')

  await atlas.getByRole('button', { name: 'Zoom in world atlas' }).click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '125')
  await expect.poll(visibleZoom).toBe('125%')

  await atlas.getByRole('button', { name: 'Zoom in world atlas' }).click()
  await expect.poll(visibleZoom).toBe('150%')

  await atlas.getByRole('button', { name: '100%', exact: true }).click()
  await expect.poll(visibleZoom).toBe('100%')

  await atlas.getByRole('button', { name: 'Zoom out world atlas' }).click()
  await expect.poll(visibleZoom).toBe('75%')
})
