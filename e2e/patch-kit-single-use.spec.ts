import { readStoredProgress } from './storedGameState'
import { expect, test, type Page } from '@playwright/test'
import { JS_BATTLE_1_PREREQS } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedBattle(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, clearedStageIds }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 2 },
            clearedStageIds,
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [7],
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
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      clearedStageIds: [...JS_BATTLE_1_PREREQS],
    },
  )
}

async function storedProgress(page: Page) {
  return readStoredProgress(page)
}

async function dismissStory(page: Page) {
  const story = page.locator('.battle-story-window')
  await expect(story).toBeVisible()
  await story.getByRole('button', { name: 'スキップ', exact: true }).click()
  await expect(story).toBeHidden()
}

async function openItems(page: Page) {
  await page.getByRole('button', { name: 'アイテム', exact: true }).click()
  await expect(page.getByLabel('戦闘アイテム一覧')).toBeVisible()
}

async function openPatchKit(page: Page) {
  await openItems(page)
  const row = page.locator('.battle-item-browser-row[data-item-id="patch-kit"]')
  await row.click()
  const detail = page.locator('.battle-item-detail[data-item-id="patch-kit"]')
  await expect(detail).toBeVisible()
  return detail
}

test('PATCH KITはItem browserから開き、在庫2個でも同一Battleで使用1回に制限する', async ({ page }) => {
  await seedBattle(page)
  await page.goto('/javascript/battle/1?seed=patch-kit-single-use&returnTo=%2Fworld')
  await dismissStory(page)

  await openItems(page)
  let row = page.locator('.battle-item-browser-row[data-item-id="patch-kit"]')
  await expect(row).toContainText('PATCH KIT ×2')
  await expect(row.locator('[data-item-availability="available"]')).toContainText('使用可能')

  await row.click()
  let detail = page.locator('.battle-item-detail[data-item-id="patch-kit"]')
  const patchKit = detail.locator('.patch-kit-action')
  await expect(patchKit).toBeEnabled()
  await expect(patchKit).toHaveAttribute('aria-label', /PATCH KIT ×2/)
  await patchKit.click()

  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')
  await expect.poll(async () => (await storedProgress(page)).progress.inventory.patchKit).toBe(1)

  // 使用後はtop-level commandへ戻る。再度Itemを開くと使用済み理由を確認できる。
  detail = await openPatchKit(page)
  const usedPatchKit = detail.locator('.patch-kit-action')
  await expect(detail).toContainText('この戦闘では使用済み')
  await expect(usedPatchKit).toBeDisabled()
  await expect(usedPatchKit).toHaveAttribute('aria-label', /PATCH KIT ×1/)
  await usedPatchKit.click({ force: true })
  await expect.poll(async () => (await storedProgress(page)).progress.inventory.patchKit).toBe(1)
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')

  await page.goto('/javascript/battle/1?seed=patch-kit-next-battle&returnTo=%2Fworld')
  await dismissStory(page)
  await openItems(page)
  row = page.locator('.battle-item-browser-row[data-item-id="patch-kit"]')
  await expect(row).toContainText('PATCH KIT ×2')
  await expect(row.locator('[data-item-availability="available"]')).toContainText('使用可能')
  await row.click()
  detail = page.locator('.battle-item-detail[data-item-id="patch-kit"]')
  await expect(detail.locator('.patch-kit-action')).toBeEnabled()
  // Leaving an unfinished attempt rolls back both healing and its item cost.
  await expect(detail.locator('.patch-kit-action')).toHaveAttribute('aria-label', /PATCH KIT ×2/)
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('40/108')
  await expect.poll(async () => (await storedProgress(page)).progress.inventory.patchKit).toBe(2)
})
