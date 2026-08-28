import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedEconomyLoop(page: Page) {
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
            gold: 50,
            inventory: { patchKit: 0 },
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
          version: 3,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: [],
            partyEquipment: {},
            worldPosition: { x: 21, y: 12 },
            stepsSinceEncounter: 8,
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
}

async function executeSkill(page: Page, name: string) {
  const card = page.getByRole('button', { name: new RegExp(`^${name}\\b`) })
  await expect(card).toBeEnabled()
  await card.click()
  await expect(card).toHaveClass(/selected/)
  await card.click()
}

async function storedState(page: Page) {
  return page.evaluate(
    ({ progressKey, rpgKey }) => ({
      progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
      rpg: JSON.parse(localStorage.getItem(rpgKey) ?? 'null'),
    }),
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY },
  )
}

test('Battle Gold → Shop purchase/equip → Inn → reload → next Battleを1本で維持する', async ({ page }) => {
  await seedEconomyLoop(page)

  await page.goto('/javascript/battle/1?seed=encounter%3A5%3A10%3A11&returnTo=%2Fworld')
  await expect(page.getByText('CHAPTER 01', { exact: false })).toBeVisible()

  await executeSkill(page, 'TRACE')
  await executeSkill(page, 'PULSE')
  await executeSkill(page, 'TRACE')
  await expect(page.getByText('VICTORY', { exact: true })).toBeVisible()

  await expect.poll(async () => (await storedState(page)).progress.progress.gold).toBe(70)
  const skip = page.getByRole('button', { name: 'SKIP' })
  if (await skip.isVisible()) await skip.click()
  await page.getByRole('button', { name: /RETURN TO WORLD/ }).click()
  await expect(page).toHaveURL(/\/world$/)

  let stored = await storedState(page)
  expect(stored.progress.progress.clearedStageIds).toContain(1)
  expect(stored.progress.progress.unlockedStageIds).toContain(2)
  expect(stored.rpg.state.currentHp).toBeGreaterThan(0)
  expect(stored.rpg.state.currentHp).toBeLessThan(116)

  await page.getByRole('button', { name: 'INTERACT' }).click()
  const shop = page.getByRole('dialog', { name: 'World shop' })
  const lifeCharm = shop.locator('[data-equipment-id="life-charm"]')
  const quote = lifeCharm.locator('.shop-cost-preview')
  await expect(quote.getByText('70 G', { exact: true })).toBeVisible()
  await expect(quote.getByText('50 G', { exact: true })).toBeVisible()
  await expect(quote.getByText('20 G', { exact: true })).toBeVisible()
  await lifeCharm.getByRole('button', { name: '▶ BUY' }).click()
  await expect(lifeCharm.getByRole('button', { name: '▶ EQUIP NOW' })).toBeEnabled()

  stored = await storedState(page)
  expect(stored.progress.progress.gold).toBe(20)
  expect(stored.rpg.state.ownedEquipmentIds).toContain('life-charm')
  expect(stored.rpg.state.equipment.accessory).toBeNull()

  await lifeCharm.getByRole('button', { name: '▶ EQUIP NOW' }).click()
  await expect(lifeCharm).toHaveAttribute('data-equipment-state', 'equipped')
  await shop.getByRole('button', { name: 'ショップを閉じる' }).click()

  await page.getByRole('button', { name: 'Move down' }).click()
  await page.getByRole('button', { name: 'Move down' }).click()
  await page.getByRole('button', { name: 'Move down' }).click()
  await page.getByRole('button', { name: 'INTERACT' }).click()

  const inn = page.getByRole('dialog', { name: 'Inn / Rest' })
  await expect(inn.getByText('20 G → 0 G', { exact: true })).toBeVisible()
  await inn.getByRole('button', { name: '▶ REST' }).click()
  await expect(page.getByText(/FULL RECOVERY/)).toBeVisible()

  stored = await storedState(page)
  expect(stored.progress.progress.gold).toBe(0)
  expect(stored.rpg.state.equipment.accessory).toBe('life-charm')
  expect(stored.rpg.state.currentHp).toBe(132)

  await page.reload()
  await page.getByRole('button', { name: 'Pause menuを開く' }).click()
  const pause = page.getByRole('dialog', { name: 'Pause menu' })
  await expect(pause.getByText('0 G', { exact: true })).toBeVisible()
  await expect(pause.getByText('132 / 132', { exact: true })).toBeVisible()
  await pause.getByRole('button', { name: 'EQUIPMENT' }).click()
  await expect(pause.locator('button[data-equipment-id="life-charm"]')).toHaveAttribute(
    'data-equipment-state',
    'equipped',
  )
  await page.keyboard.press('Escape')

  await page.goto('/javascript/battle/2?seed=economy-next&returnTo=%2Fworld')
  await expect(page.getByText('CHAPTER 02', { exact: false })).toBeVisible()
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('132/132')
})
