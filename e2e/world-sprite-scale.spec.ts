import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('Player spriteは4方向で同じ表示サイズを維持する', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 900,
            gold: 200,
            inventory: { patchKit: 2 },
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
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: ['byte'],
            partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
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
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )

  await page.goto('/world')

  const measurements = await page.locator('.world-player-sprite').evaluate((player) => {
    const image = player.querySelector<HTMLElement>('.world-player-pixel')
    if (!image) return null

    return ['down', 'up', 'left', 'right'].map((facing) => {
      player.setAttribute('data-facing', facing)
      const box = image.getBoundingClientRect()
      const style = getComputedStyle(image)
      return {
        facing,
        width: box.width,
        height: box.height,
        transform: style.transform,
        scale: style.scale,
      }
    })
  })

  expect(measurements).not.toBeNull()
  if (!measurements) return

  const base = measurements[0]
  for (const measurement of measurements) {
    expect(Math.abs(measurement.width - base.width)).toBeLessThan(1)
    expect(Math.abs(measurement.height - base.height)).toBeLessThan(1)
    expect(measurement.transform).toBe(base.transform)
  }
  expect(measurements.find(({ facing }) => facing === 'left')?.scale).toContain('-1')
  expect(measurements.find(({ facing }) => facing === 'right')?.scale).not.toContain('-1')
})
