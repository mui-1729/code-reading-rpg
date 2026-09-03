import { expect, test, type Page } from '@playwright/test'
import { readStoredGameState } from './storedGameState'

async function enterEncounter(page: Page, beforeEncounter?: () => Promise<void>) {
  await page.goto('/')
  await page.evaluate((clearedStageIds) => {
    localStorage.clear()
    localStorage.setItem('code-reading-rpg:player-progress', JSON.stringify({
      version: 4,
      progress: {
        exp: 0, gold: 70, inventory: { patchKit: 2 }, clearedStageIds, clearedAreaIds: [],
        completedSideQuestIds: [], unlockedStageIds: [7], unlockedSkillIds: ['trace', 'pulse', 'nova'],
      },
    }))
    localStorage.setItem('code-reading-rpg:rpg-state', JSON.stringify({
      version: 5,
      state: {
        equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
        ownedEquipmentIds: ['training-blade', 'traveler-coat'], partyMemberIds: [],
        worldMapId: 'overworld', worldPosition: { x: 10, y: 10 },
        stepsSinceEncounter: 4, encounterCount: 12, currentHp: 40, openedTreasureIds: [],
      },
    }))
    localStorage.setItem('code-reading-rpg:tutorial', JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
  // Overworld replay encounters require both incident clear bits. The complete
  // route bit enables post-arc Overworld replay, while Battle 7 authorizes the
  // later canonical Battle 8 route switch.
  }, [1, 2, 3, 7])
  await page.goto('/world')
  await expect(page.getByLabel('ワールドマップ')).toBeVisible()
  await beforeEncounter?.()
  await page.getByRole('button', { name: '下へ移動' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/1\?/)
  await expect.poll(() => readStoredGameState(page)).toMatchObject({
    version: 2,
    battleSession: { identity: { battleId: 1 }, rpg: { state: { currentHp: 40 } } },
  })
}

async function useKit(page: Page) {
  const item = page.locator('.battle-item-row')
  await item.locator('.battle-item-toggle').click()
  await item.locator('.patch-kit-action').click()
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')
  await expect(item).toHaveAttribute('data-item-state', 'already-used')
  await expect.poll(() => readStoredGameState(page)).toMatchObject({
    progress: { progress: { inventory: { patchKit: 1 } } },
    rpg: { state: { currentHp: 64 } },
  })
}

test('reload resets the whole attempt, including enemies/turn/kit allowance, without accumulating healing', async ({ page }) => {
  await enterEncounter(page)
  const startingEnemies = await page.locator('.enemy-name-row span').allTextContents()
  const initial = await readStoredGameState(page)
  await useKit(page)
  const trace = page.locator('[data-skill-id="trace"]')
  await trace.click()
  await trace.click()
  await expect(page.locator('.turn-pill')).toHaveText('ターン 2')
  expect(await page.locator('.enemy-name-row span').allTextContents()).not.toEqual(startingEnemies)
  await expect.poll(async () => (await readStoredGameState(page)).rpg.state.currentHp).toBeLessThan(64)

  await page.reload()
  await expect(page.locator('.turn-pill')).toHaveText('ターン 1')
  await expect(page.locator('.enemy-name-row span')).toHaveText(startingEnemies)
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('40/108')
  await expect(page.locator('.battle-item-row')).toHaveAttribute('data-item-state', 'available')
  await expect.poll(() => readStoredGameState(page)).toMatchObject({ progress: initial.progress, rpg: initial.rpg })
  await useKit(page)
  await page.reload()
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('40/108')
  await expect.poll(() => readStoredGameState(page)).toMatchObject({ progress: initial.progress, rpg: initial.rpg })
})

test('SPA browser back aborts the attempt and no pending attack timer can mutate World afterward', async ({ page }) => {
  await enterEncounter(page)
  const initial = await readStoredGameState(page)
  await useKit(page)
  await page.evaluate(() => { document.documentElement.dataset.sessionDocument = 'same-document' })
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'))
  const trace = page.locator('[data-skill-id="trace"]')
  await trace.dispatchEvent('click')
  await expect(trace).toHaveClass(/selected/)
  await trace.dispatchEvent('click')
  await expect(page.locator('body')).toHaveAttribute('data-battle-resolving', 'true')
  await page.goBack()
  await expect(page).toHaveURL(/\/world$/)
  await expect(page.locator('html')).toHaveAttribute('data-session-document', 'same-document')
  await expect.poll(() => readStoredGameState(page)).toMatchObject({
    progress: initial.progress, rpg: initial.rpg, battleSession: null,
  })
  const committed = await readStoredGameState(page)
  await page.clock.runFor(10_000)
  expect(await readStoredGameState(page)).toEqual(committed)
  await expect(page.getByLabel('ワールドマップ')).toBeVisible()
})

test('逃走はtentative HP / kit changesを破棄しrewardなしで開始snapshotへ戻す', async ({ page }) => {
  await enterEncounter(page)
  const initial = await readStoredGameState(page)
  await useKit(page)
  await page.getByRole('button', { name: '逃げる' }).click()
  await expect(page).toHaveURL(/\/world$/)
  await expect.poll(() => readStoredGameState(page)).toMatchObject({
    battleSession: null,
    progress: initial.progress,
    rpg: initial.rpg,
  })
  await page.reload()
  await expect(page.getByLabel('ワールドマップ')).toBeVisible()
  await expect.poll(() => readStoredGameState(page)).toMatchObject({
    battleSession: null,
    progress: initial.progress,
    rpg: initial.rpg,
  })
})

test('opening another Battle aborts the old snapshot rather than carrying its healing/consumption forward', async ({ page }) => {
  await enterEncounter(page)
  await useKit(page)
  await page.goto('/javascript/battle/8?seed=session-next-battle&returnTo=%2Fworld')
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('40/108')
  await expect(page.locator('.turn-pill')).toHaveText('ターン 1')
  await expect.poll(() => readStoredGameState(page)).toMatchObject({
    progress: { progress: { inventory: { patchKit: 2 } } },
    battleSession: { identity: { battleId: 8, seed: 'session-next-battle' }, rpg: { state: { currentHp: 40 } } },
  })
})

test('a second World tab never combines tentative battle healing with rolled-back kit inventory', async ({ page, context }) => {
  const second = await context.newPage()
  await enterEncounter(page, async () => {
    await second.goto('/world')
    await expect(second.getByLabel('ワールドマップ')).toBeVisible()
  })
  await useKit(page)
  await second.getByRole('button', { name: 'メニューを開く' }).click()
  const menu = second.getByRole('dialog', { name: 'メニュー' })
  await expect(menu.getByText('40 / 108', { exact: true })).toBeVisible()
  await menu.getByRole('button', { name: 'アイテム', exact: true }).click()
  await expect(menu.locator('[data-item-id="patch-kit"]')).toHaveAttribute('data-item-count', '2')
  await second.keyboard.press('Escape')
  await second.getByRole('button', { name: '右へ移動' }).click()
  await expect.poll(() => readStoredGameState(second)).toMatchObject({
    battleSession: null,
    progress: { progress: { inventory: { patchKit: 2 }, gold: 70 } },
    rpg: { state: { currentHp: 40, worldPosition: { x: 11, y: 11 } } },
  })
  await expect(page).toHaveURL(/\/world$/)
  await expect(page.getByLabel('ワールドマップ')).toBeVisible()
})
