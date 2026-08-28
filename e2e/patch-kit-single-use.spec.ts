import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedBattle(page: import('@playwright/test').Page) {
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
            inventory: { patchKit: 2 },
            clearedStageIds: [],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 4],
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 4,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: [],
            partyEquipment: {},
            worldMapId: 'overworld',
            worldPosition: { x: 20, y: 14 },
            stepsSinceEncounter: 8,
            encounterCount: 0,
            currentHp: 40,
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
}

async function storedProgress(page: import('@playwright/test').Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), PROGRESS_KEY)
}

test('PATCH KITは在庫2個でも同一Battleで見える操作1つ・使用1回に制限する', async ({ page }) => {
  await seedBattle(page)
  await page.goto('/javascript/battle/1?seed=patch-kit-single-use&returnTo=%2Fworld')

  const item = page.locator('.battle-item-row[data-item-id="patch-kit"]')
  const patchKit = item.locator('.patch-kit-action')
  await expect(item).toHaveAttribute('data-item-state', 'available')
  await expect(page.locator('.patch-kit-action:visible')).toHaveCount(1)
  await expect(patchKit).toBeEnabled()
  await expect(patchKit).toContainText('PATCH KIT ×2')
  await patchKit.click()

  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')
  await expect(item).toHaveAttribute('data-item-state', 'already-used')
  await expect(patchKit).toBeDisabled()
  await expect(patchKit).toContainText('PATCH KIT ×1')
  await expect.poll(async () => (await storedProgress(page)).progress.inventory.patchKit).toBe(1)

  // 同じBattleでは再消費できない。
  await patchKit.click({ force: true })
  await expect.poll(async () => (await storedProgress(page)).progress.inventory.patchKit).toBe(1)
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')

  // seedが変われば別Battle session。残り1個を再び使える。
  await page.goto('/javascript/battle/1?seed=patch-kit-next-battle&returnTo=%2Fworld')
  const nextItem = page.locator('.battle-item-row[data-item-id="patch-kit"]')
  const nextPatchKit = nextItem.locator('.patch-kit-action')
  await expect(nextItem).toHaveAttribute('data-item-state', 'available')
  await expect(page.locator('.patch-kit-action:visible')).toHaveCount(1)
  await expect(nextPatchKit).toBeEnabled()
  await expect(nextPatchKit).toContainText('PATCH KIT ×1')
})
