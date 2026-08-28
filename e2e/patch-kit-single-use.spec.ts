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

test('PATCH KITは在庫2個でも同一Battleで1回だけ使用できる', async ({ page }) => {
  await seedBattle(page)
  await page.goto('/javascript/battle/1?seed=patch-kit-single-use&returnTo=%2Fworld')

  const actions = page.locator('.patch-kit-action')
  await expect(actions).toHaveCount(1)

  const patchKit = actions.first()
  await expect(patchKit).toBeEnabled()
  await patchKit.click()

  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')
  await expect(patchKit).toBeDisabled()
  await expect(page.getByText('USED THIS BATTLE', { exact: true })).toBeVisible()
  await expect.poll(async () => (await storedProgress(page)).progress.inventory.patchKit).toBe(1)

  // 同じBattleでは2回目を消費できない。
  await patchKit.click({ force: true })
  await expect.poll(async () => (await storedProgress(page)).progress.inventory.patchKit).toBe(1)
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')

  // seedが変われば別Battle session。残り1個を再び使える。
  await page.goto('/javascript/battle/1?seed=patch-kit-next-battle&returnTo=%2Fworld')
  const nextBattlePatchKit = page.locator('.patch-kit-action')
  await expect(nextBattlePatchKit).toHaveCount(1)
  await expect(nextBattlePatchKit).toBeEnabled()
  await expect(nextBattlePatchKit).toContainText('PATCH KIT ×1')
})
