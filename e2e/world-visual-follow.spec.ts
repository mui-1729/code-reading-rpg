import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const progress = {
  version: 4,
  progress: {
    exp: 0,
    gold: 0,
    inventory: { patchKit: 0 },
    clearedStageIds: [],
    clearedAreaIds: [],
    completedSideQuestIds: [],
    unlockedStageIds: [1, 4],
    unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
  },
}

const rpg = (position: { x: number; y: number }, withByte = false) => ({
  version: 3,
  state: {
    equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
    ownedEquipmentIds: ['training-blade', 'traveler-coat'],
    partyMemberIds: withByte ? ['byte'] : [],
    partyEquipment: withByte ? { byte: { weapon: null, armor: null, accessory: null } } : {},
    worldPosition: position,
    stepsSinceEncounter: 0,
    encounterCount: 0,
    currentHp: 108,
    openedTreasureIds: [],
  },
})

async function seed(page: Page, position: { x: number; y: number }, withByte = false) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, progressValue, rpgValue }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify(progressValue))
      localStorage.setItem(rpgKey, JSON.stringify(rpgValue))
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      progressValue: progress,
      rpgValue: rpg(position, withByte),
    },
  )
}

async function spritePosition(page: Page, selector: string) {
  return page.locator(selector).evaluate((sprite) => ({
    x: Number(sprite.parentElement?.dataset.worldX),
    y: Number(sprite.parentElement?.dataset.worldY),
  }))
}

test('BYTEは主人公と重ならず、移動前のマスを1歩遅れて追従する', async ({ page }) => {
  await seed(page, { x: 20, y: 14 }, true)
  await page.goto('/world')

  await expect(page.locator('.world-player-sprite')).toBeVisible()
  await expect(page.locator('.world-follower-sprite')).toBeVisible()
  expect(await spritePosition(page, '.world-follower-sprite')).not.toEqual(
    await spritePosition(page, '.world-player-sprite'),
  )

  await page.getByRole('button', { name: 'Move right' }).click()
  await expect.poll(() => spritePosition(page, '.world-player-sprite')).toEqual({ x: 21, y: 14 })
  await expect.poll(() => spritePosition(page, '.world-follower-sprite')).toEqual({ x: 20, y: 14 })
})

test('World tileは見た目上のgrid borderを持たない', async ({ page }) => {
  await seed(page, { x: 10, y: 10 })
  await page.goto('/world')

  const tile = page.locator('.world-tile').first()
  await expect(tile).toBeVisible()
  expect(await tile.evaluate((element) => getComputedStyle(element).borderTopWidth)).toBe('0px')
  expect(await page.locator('.world-viewport').evaluate((element) => getComputedStyle(element).gap)).toBe('0px')
})
