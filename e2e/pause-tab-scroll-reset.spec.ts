import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorld(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 100,
            gold: 100,
            inventory: { patchKit: 2 },
            clearedStageIds: [1, 7, 8, 9, 10, 11, 12, 13, 14],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15],
            unlockedSkillIds: ['trace', 'pulse', 'nova'],
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
            ownedEquipmentIds: ['training-blade', 'guard-edge', 'traveler-coat', 'debug-charm'],
            partyMemberIds: ['byte'],
            partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
            worldMapId: 'overworld',
            worldPosition: { x: 20, y: 14 },
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
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )
  await page.goto('/world')
}

test('@responsive long tabをscroll後にアイテムへ切り替えてもcontent先頭が見える', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedWorld(page)
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  await page.getByRole('button', { name: 'マップ', exact: true }).click()

  const mapContent = page.locator('.pause-content')
  await mapContent.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect.poll(() => mapContent.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)

  await page.getByRole('button', { name: 'アイテム', exact: true }).click()

  const itemContent = page.locator('.pause-content')
  await expect.poll(() => itemContent.evaluate((element) => element.scrollTop)).toBe(0)
  await expect(page.getByRole('region', { name: 'アイテム一覧' })).toBeVisible()
  await expect(page.locator('[data-item-id="patch-kit"]')).toBeVisible()
})
