import { expect, test, type Page } from '@playwright/test'
import { JS_COMPLETE } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorld(
  page: Page,
  options: {
    position?: { x: number; y: number }
    partyMemberIds?: string[]
    clearedStageIds?: readonly number[]
  } = {},
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, position, partyMemberIds, clearedStageIds }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 900,
            gold: 100,
            inventory: { patchKit: 1 },
            clearedStageIds,
            clearedAreaIds: clearedStageIds.includes(3) ? ['javascript'] : [],
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
            partyMemberIds,
            partyEquipment: {},
            worldMapId: 'overworld',
            worldPosition: position,
            stepsSinceEncounter: 0,
            encounterCount: 0,
            currentHp: 108,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      position: options.position ?? { x: 20, y: 14 },
      partyMemberIds: options.partyMemberIds ?? ['byte'],
      clearedStageIds: options.clearedStageIds ?? JS_COMPLETE,
    },
  )
  await page.goto('/world')
}

async function playerPosition(page: Page) {
  return page.locator('.world-player-sprite').evaluate((player) => ({
    x: Number((player as HTMLElement).dataset.worldX),
    y: Number((player as HTMLElement).dataset.worldY),
  }))
}

test('World常設objectiveは一行に絞りdetailはmapを隠さない', async ({ page }) => {
  await seedWorld(page)
  const objective = page.getByLabel('次の目的')
  await expect(objective).toBeVisible()
  await expect(objective.locator('strong')).toBeVisible()
  await expect(objective.locator('p')).toHaveCount(0)
})

test('アクションは対象がない時disabledで近くの対象を具体名で示す', async ({ page }) => {
  await seedWorld(page, { position: { x: 20, y: 14 }, partyMemberIds: ['byte'] })
  await expect(page.getByRole('button', { name: 'アクション', exact: true })).toBeDisabled()

  await seedWorld(page, { position: { x: 20, y: 13 }, partyMemberIds: [] })
  const byteInteract = page.getByRole('button', { name: 'BYTEと話す', exact: true })
  await expect(byteInteract).toBeEnabled()
  await expect(byteInteract).toHaveText('BYTEと話す')
})

test('通常歩行のterrain echoは冒険ログを占有せずaria-liveもしない', async ({ page }) => {
  await seedWorld(page)
  const log = page.locator('.world-message')
  await expect(log).toHaveAttribute('data-log-priority', 'event')
  await expect(log).toHaveAttribute('aria-live', 'polite')

  await page.getByRole('button', { name: '下へ移動' }).click()
  await expect(log).toHaveAttribute('data-log-priority', 'ambient')
  await expect(log).toHaveAttribute('aria-live', 'off')
  await expect(log).toBeHidden()
})

test('D-Pad hold repeatで1 tapずつ連打せず複数tile移動できる', async ({ page }) => {
  await seedWorld(page, { position: { x: 20, y: 14 } })
  const start = await playerPosition(page)
  const down = page.getByRole('button', { name: '下へ移動' })

  await down.dispatchEvent('pointerdown', {
    button: 0,
    buttons: 1,
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
  })
  await page.waitForTimeout(560)
  await down.dispatchEvent('pointerup', {
    button: 0,
    buttons: 0,
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
  })

  const end = await playerPosition(page)
  expect(Math.abs(end.x - start.x) + Math.abs(end.y - start.y)).toBeGreaterThanOrEqual(2)
})

test('mobile D-Pad / アクションは44px以上のtouch targetを維持する', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedWorld(page)

  const sizes = await page.locator('.world-dpad button, .world-interact').evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }),
  )
  for (const size of sizes) {
    expect(size.width).toBeGreaterThanOrEqual(44)
    expect(size.height).toBeGreaterThanOrEqual(44)
  }
})

test('mobile landscapeでもmap・D-Pad・context interactionが同じviewportで操作できる', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await seedWorld(page, { position: { x: 20, y: 13 }, partyMemberIds: [] })

  await expect(page.getByLabel('Open world map')).toBeVisible()
  await expect(page.getByRole('button', { name: '左へ移動' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'BYTEと話す', exact: true })).toBeVisible()

  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  ).toBe(false)
})
