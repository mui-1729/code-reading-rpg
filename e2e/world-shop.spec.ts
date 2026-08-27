import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedShopState(page: Page, gold = 200) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, initialGold }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: initialGold,
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
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY, initialGold: gold },
  )
  await page.goto('/world')
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

test.describe('World Shop', () => {
  test('Hub SHOPでEquipmentを選択購入しreload後も所有を維持する', async ({ page }) => {
    await seedShopState(page)

    await page.getByRole('button', { name: 'INTERACT' }).click()
    const shop = page.getByRole('dialog', { name: 'World shop' })
    await expect(shop).toBeVisible()
    await expect(shop.getByText('200 G', { exact: true })).toBeVisible()

    const guardEdge = shop.getByText('Guard Edge', { exact: true }).locator('..').locator('..')
    await expect(guardEdge.getByText(/ATK \+4 · DEF \+2/)).toBeVisible()
    await guardEdge.getByRole('button', { name: '▶ BUY' }).click()
    await expect(guardEdge.getByRole('button', { name: 'OWNED' })).toBeDisabled()
    await expect(shop.getByText('145 G', { exact: true })).toBeVisible()

    let stored = await storedState(page)
    expect(stored.progress.progress.gold).toBe(145)
    expect(stored.rpg.state.ownedEquipmentIds).toContain('guard-edge')

    await shop.getByRole('button', { name: 'ショップを閉じる' }).click()
    await page.getByRole('button', { name: 'Pause menuを開く' }).click()
    let pause = page.getByRole('dialog', { name: 'Pause menu' })
    await pause.getByRole('button', { name: 'EQUIPMENT' }).click()
    await expect(pause.getByText('Guard Edge', { exact: true })).toBeVisible()
    await expect(pause.getByText(/Defenseも補う安定型/)).toBeVisible()
    await page.keyboard.press('Escape')

    await page.reload()
    await page.getByRole('button', { name: 'Pause menuを開く' }).click()
    pause = page.getByRole('dialog', { name: 'Pause menu' })
    await pause.getByRole('button', { name: 'EQUIPMENT' }).click()
    await expect(pause.getByText('Guard Edge', { exact: true })).toBeVisible()
    stored = await storedState(page)
    expect(stored.rpg.state.ownedEquipmentIds.filter((id: string) => id === 'guard-edge')).toHaveLength(1)
  })

  test('Gold不足のEquipmentは購入できない', async ({ page }) => {
    await seedShopState(page, 10)

    await page.getByRole('button', { name: 'INTERACT' }).click()
    const shop = page.getByRole('dialog', { name: 'World shop' })
    const vitalCoat = shop.getByText('Vital Coat', { exact: true }).locator('..').locator('..')
    await expect(vitalCoat.getByRole('button', { name: 'GOLD SHORTAGE' })).toBeDisabled()

    const stored = await storedState(page)
    expect(stored.progress.progress.gold).toBe(10)
    expect(stored.rpg.state.ownedEquipmentIds).not.toContain('vital-coat')
  })
})
