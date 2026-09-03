import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedMap(
  page: Page,
  mapId: 'overworld' | 'js-village' | 'js-forest' | 'js-deep-forest' | 'ts-frontier',
  position: { x: number; y: number },
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, mapId, position }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 50,
            inventory: { patchKit: 1 },
            clearedStageIds: [1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 7],
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
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
            partyMemberIds: ['byte'],
            partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
            worldMapId: mapId,
            worldPosition: position,
            stepsSinceEncounter: 0,
            encounterCount: 0,
            currentHp: 108,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY, mapId, position },
  )
  await page.goto('/world')
  await expect(page.locator('.world-controls')).toBeVisible()
}

async function expectNoTrailingBlank(page: Page) {
  const metrics = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>('.world-shell')
    const controls = document.querySelector<HTMLElement>('.world-controls')
    if (!shell || !controls) throw new Error('World layout not found')

    const controlsBottom = controls.getBoundingClientRect().bottom + window.scrollY
    return {
      scrollHeight: document.documentElement.scrollHeight,
      controlsBottom,
      trailingSpace: document.documentElement.scrollHeight - controlsBottom,
      paddingBottom: Number.parseFloat(getComputedStyle(shell).paddingBottom),
    }
  })

  expect(metrics.paddingBottom).toBeLessThanOrEqual(16)
  expect(metrics.trailingSpace).toBeLessThan(64)
}

test('World各mapの末尾に旧90px spacerを残さない', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })

  const maps = [
    ['overworld', { x: 20, y: 14 }],
    ['js-village', { x: 10, y: 12 }],
    ['js-forest', { x: 28, y: 10 }],
    ['js-deep-forest', { x: 28, y: 10 }],
    ['ts-frontier', { x: 2, y: 10 }],
  ] as const

  for (const [mapId, position] of maps) {
    await seedMap(page, mapId, position)
    await expectNoTrailingBlank(page)
  }
})

test('low landscapeでも必要なcontent scrollは維持しつつ末尾だけ詰める', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await seedMap(page, 'js-forest', { x: 28, y: 10 })

  await expectNoTrailingBlank(page)
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  expect(scrollHeight).toBeGreaterThan(390)

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect(page.locator('.world-controls')).toBeVisible()
})
