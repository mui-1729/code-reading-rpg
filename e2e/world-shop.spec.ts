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
  test('Hub SHOPでEquipmentを購入しPauseで装備、reload後も装備状態を維持する', async ({ page }) => {
    await seedShopState(page)

    await page.getByRole('button', { name: 'INTERACT' }).click()
    const shop = page.getByRole('dialog', { name: 'World shop' })
    await expect(shop).toBeVisible()
    await expect(shop.getByText('200 G', { exact: true })).toBeVisible()

    const guardEdge = shop.locator('[data-equipment-id="guard-edge"]')
    await expect(guardEdge).toHaveAttribute('data-equipment-state', 'available')
    await expect(guardEdge.getByText('ATK +4 · DEF +2', { exact: true })).toBeVisible()
    await expect(guardEdge.getByText('CURRENT · Training Blade', { exact: true })).toBeVisible()
    await expect(guardEdge.getByText('ATK +1 · DEF +2', { exact: true })).toBeVisible()
    await expect(guardEdge.locator('img')).toHaveAttribute(
      'src',
      '/pixel-art/equipment/weapons/guard-edge.svg',
    )

    await guardEdge.getByRole('button', { name: '▶ BUY' }).click()
    await expect(guardEdge).toHaveAttribute('data-equipment-state', 'owned')
    await expect(guardEdge.getByRole('button', { name: 'OWNED' })).toBeDisabled()
    await expect(shop.getByText('145 G', { exact: true })).toBeVisible()

    let stored = await storedState(page)
    expect(stored.progress.progress.gold).toBe(145)
    expect(stored.rpg.state.ownedEquipmentIds).toContain('guard-edge')
    expect(stored.rpg.state.equipment.weapon).toBe('training-blade')

    await shop.getByRole('button', { name: 'ショップを閉じる' }).click()
    await page.getByRole('button', { name: 'Pause menuを開く' }).click()
    let pause = page.getByRole('dialog', { name: 'Pause menu' })
    await pause.getByRole('button', { name: 'EQUIPMENT' }).click()

    const guardEdgeOption = pause.locator('button[data-equipment-id="guard-edge"]')
    await expect(guardEdgeOption).toHaveAttribute('data-equipment-state', 'owned')
    await expect(guardEdgeOption.getByText('VS Training Blade · ATK +1 · DEF +2', { exact: true })).toBeVisible()
    await expect(guardEdgeOption.locator('img')).toHaveAttribute(
      'src',
      '/pixel-art/equipment/weapons/guard-edge.svg',
    )
    await guardEdgeOption.click()
    await expect(guardEdgeOption).toHaveAttribute('data-equipment-state', 'equipped')
    await expect(guardEdgeOption.getByText('CURRENT LOADOUT', { exact: true })).toBeVisible()

    stored = await storedState(page)
    expect(stored.rpg.state.equipment.weapon).toBe('guard-edge')
    await page.keyboard.press('Escape')

    await page.reload()
    await page.getByRole('button', { name: 'Pause menuを開く' }).click()
    pause = page.getByRole('dialog', { name: 'Pause menu' })
    await pause.getByRole('button', { name: 'EQUIPMENT' }).click()
    const reloadedGuardEdge = pause.locator('button[data-equipment-id="guard-edge"]')
    await expect(reloadedGuardEdge).toHaveAttribute('data-equipment-state', 'equipped')
    stored = await storedState(page)
    expect(stored.rpg.state.ownedEquipmentIds.filter((id: string) => id === 'guard-edge')).toHaveLength(1)
    expect(stored.rpg.state.equipment.weapon).toBe('guard-edge')
  })

  test('Gold不足のEquipmentはvisualと比較を見せたまま購入できない', async ({ page }) => {
    await seedShopState(page, 10)

    await page.getByRole('button', { name: 'INTERACT' }).click()
    const shop = page.getByRole('dialog', { name: 'World shop' })
    const vitalCoat = shop.locator('[data-equipment-id="vital-coat"]')
    await expect(vitalCoat).toHaveAttribute('data-equipment-state', 'unavailable')
    await expect(vitalCoat.getByText('CURRENT · Traveler Coat', { exact: true })).toBeVisible()
    await expect(vitalCoat.getByText('DEF -2 · HP +14', { exact: true })).toBeVisible()
    await expect(vitalCoat.locator('img')).toHaveAttribute(
      'src',
      '/pixel-art/equipment/armor/vital-coat.svg',
    )
    await expect(vitalCoat.getByRole('button', { name: 'GOLD SHORTAGE' })).toBeDisabled()

    const stored = await storedState(page)
    expect(stored.progress.progress.gold).toBe(10)
    expect(stored.rpg.state.ownedEquipmentIds).not.toContain('vital-coat')
  })
})
