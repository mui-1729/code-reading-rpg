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
  await expect(page.getByLabel('Open world map')).toBeVisible()
  await beforeEncounter?.()
  await page.getByRole('button', { name: 'Move down' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/1\?/)
  await expect.poll(() => readStoredGameState(page)).toMatchObject({
    version: 2,
    battleSession: { identity: { battleId: 1 }, rpg: { state: { currentHp: 40 } } },
  })
}

async function useKit(page: Page) {
  await page.locator('.patch-kit-action').click()
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')
  await expect(page.locator('.battle-item-row')).toHaveAttribute('data-item-state', 'already-used')
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
  await expect(page.locator('.turn-pill')).toHaveText('TURN 02')
  expect(await page.locator('.enemy-name-row span').allTextContents()).not.toEqual(startingEnemies)
  await expect.poll(async () => (await readStoredGameState(page)).rpg.state.currentHp).toBeLessThan(64)

  await page.reload()
  await expect(page.locator('.turn-pill')).toHaveText('TURN 01')
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
  await expect(page.getByLabel('Open world map')).toBeVisible()
})

test('RUN commits current HP and consumed kit without rewards and reload retains that result', async ({ page }) => {
  await enterEncounter(page)
  const initial = await readStoredGameState(page)
  await useKit(page)
  await page.getByRole('button', { name: 'RUN · ESCAPE' }).click()
  await expect(page).toHaveURL(/\/world$/)
  await expect.poll(() => readStoredGameState(page)).toMatchObject({
    battleSession: null,
    progress: { progress: { gold: 70, exp: 0, inventory: { patchKit: 1 }, clearedStageIds: initial.progress.progress.clearedStageIds } },
    rpg: { state: { currentHp: 64, worldPosition: initial.rpg.state.worldPosition } },
  })
  await page.reload()
  await expect(page.getByLabel('Open world map')).toBeVisible()
  await expect.poll(() => readStoredGameState(page)).toMatchObject({
    battleSession: null,
    progress: { progress: { inventory: { patchKit: 1 } } }, rpg: { state: { currentHp: 64 } },
  })
})

test('opening another Battle aborts the old snapshot rather than carrying its healing/consumption forward', async ({ page }) => {
  await enterEncounter(page)
  await useKit(page)
  await page.goto('/javascript/battle/8?seed=session-next-battle&returnTo=%2Fworld')
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('40/108')
  await expect(page.locator('.turn-pill')).toHaveText('TURN 01')
  await expect.poll(() => readStoredGameState(page)).toMatchObject({
    progress: { progress: { inventory: { patchKit: 2 } } },
    battleSession: { identity: { battleId: 8, seed: 'session-next-battle' }, rpg: { state: { currentHp: 40 } } },
  })
})

test('a second World tab never combines tentative battle healing with rolled-back kit inventory', async ({ page, context }) => {
  const second = await context.newPage()
  await enterEncounter(page, async () => {
    await second.goto('/world')
    await expect(second.getByLabel('Open world map')).toBeVisible()
  })
  await useKit(page)
  await second.getByRole('button', { name: 'Pause menuを開く' }).click()
  const menu = second.getByRole('dialog', { name: 'Pause menu' })
  await expect(menu.getByText('40 / 108', { exact: true })).toBeVisible()
  await menu.getByRole('button', { name: 'ITEMS', exact: true }).click()
  await expect(menu.locator('[data-item-id="patch-kit"]')).toHaveAttribute('data-item-count', '2')
  await second.keyboard.press('Escape')
  await second.getByRole('button', { name: 'Move right' }).click()
  await expect.poll(() => readStoredGameState(second)).toMatchObject({
    battleSession: null,
    progress: { progress: { inventory: { patchKit: 2 }, gold: 70 } },
    rpg: { state: { currentHp: 40, worldPosition: { x: 11, y: 11 } } },
  })
  await expect(page).toHaveURL(/\/world$/)
  await expect(page.getByLabel('Open world map')).toBeVisible()
})
