import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const initialSkills = ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label']

const createProgress = (overrides: Record<string, unknown> = {}) => ({
  version: 4,
  progress: {
    exp: 0,
    gold: 0,
    inventory: { patchKit: 0 },
    clearedStageIds: [],
    clearedAreaIds: [],
    completedSideQuestIds: [],
    unlockedStageIds: [1, 4],
    unlockedSkillIds: initialSkills,
    ...overrides,
  },
})

const createRpgState = (overrides: Record<string, unknown> = {}) => ({
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
    worldPosition: { x: 20, y: 14 },
    stepsSinceEncounter: 8,
    encounterCount: 0,
    currentHp: 108,
    openedTreasureIds: [],
    ...overrides,
  },
})

async function seedStorage(
  page: Page,
  options: {
    progress?: ReturnType<typeof createProgress>
    rpg?: ReturnType<typeof createRpgState>
  } = {},
) {
  await page.goto('/')
  await page.evaluate(
    ({ progress, rpg, progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify(progress))
      localStorage.setItem(rpgKey, JSON.stringify(rpg))
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    {
      progress: options.progress ?? createProgress(),
      rpg: options.rpg ?? createRpgState(),
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
    },
  )
  await page.reload()
}

async function executeSkill(page: Page, name: string) {
  const card = page.getByRole('button', { name: new RegExp(`^${name}\\b`) })
  await expect(card).toBeEnabled()
  await card.click()
  await expect(card).toHaveClass(/selected/)
  await card.click()
}

async function playerPosition(page: Page) {
  return page.locator('.world-player-sprite').evaluate((player) => {
    const tile = player.parentElement
    return {
      x: Number(tile?.dataset.worldX),
      y: Number(tile?.dataset.worldY),
    }
  })
}

async function storedRpgState(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), RPG_KEY)
}

async function storedProgress(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), PROGRESS_KEY)
}

test.describe('Open World RPG loop', () => {
  test('Title → deterministic Encounter → Battle victory → World returnで位置と残HPを保持する', async ({ page }) => {
    await seedStorage(page, {
      rpg: createRpgState({
        worldPosition: { x: 10, y: 10 },
        stepsSinceEncounter: 4,
        encounterCount: 4,
      }),
    })

    await page.getByRole('button', { name: /START RUN/ }).click()
    await expect(page).toHaveURL(/\/world$/)
    await expect.poll(() => playerPosition(page)).toEqual({ x: 10, y: 10 })

    // count=4, next=(10,11), steps=5 はseeded rollがTall Grassの18%を下回る。
    await page.getByRole('button', { name: 'Move down' }).click()
    await expect(page).toHaveURL(/\/javascript\/battle\/1\?/)
    await expect(page.getByText('BATTLE 01', { exact: false })).toBeVisible()

    await executeSkill(page, 'TRACE')
    await expect(page.getByText('TURN 02')).toBeVisible()

    await executeSkill(page, 'PULSE')
    await expect(page.getByText('TURN 03')).toBeVisible()

    await executeSkill(page, 'TRACE')
    await expect(page.getByText('VICTORY', { exact: true })).toBeVisible()

    const skip = page.getByRole('button', { name: 'SKIP' })
    await expect(skip).toBeVisible()
    await skip.click()
    await page.getByRole('button', { name: /RETURN TO WORLD/ }).click()

    await expect(page).toHaveURL(/\/world$/)
    await expect.poll(() => playerPosition(page)).toEqual({ x: 10, y: 11 })

    const stored = await storedRpgState(page)
    expect(stored.version).toBe(3)
    expect(stored.state.worldPosition).toEqual({ x: 10, y: 11 })
    expect(stored.state.encounterCount).toBe(5)
    expect(stored.state.stepsSinceEncounter).toBe(0)
    expect(stored.state.currentHp).toBeGreaterThan(0)
    expect(stored.state.currentHp).toBeLessThan(108)

    // Battle 1 clearでLV2になりmax HPは108→116へ増えるが、残HPは自動回復しない。
    await page.goto('/javascript/battle/1?seed=hp-carry-e2e&returnTo=%2Fworld')
    await expect(page.locator('.player-panel .status-label-row strong')).toHaveText(
      `${stored.state.currentHp}/116`,
    )
  })

  test('PATCH KIT回復後のcurrent HPをRpgStateへ保存する', async ({ page }) => {
    await seedStorage(page, {
      progress: createProgress({ inventory: { patchKit: 1 } }),
      rpg: createRpgState({ currentHp: 40 }),
    })

    await page.goto('/javascript/battle/1?seed=patch-hp-e2e&returnTo=%2Fworld')
    await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('40/108')
    await page.getByRole('button', { name: /PATCH KIT ×1/ }).click()
    await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')

    await expect.poll(async () => (await storedRpgState(page)).state.currentHp).toBe(64)
    const progress = await storedProgress(page)
    expect(progress.progress.inventory.patchKit).toBe(0)
  })

  test('Hub RESTでfull recoveryしreload後もHPを保持する', async ({ page }) => {
    await seedStorage(page, {
      rpg: createRpgState({
        worldPosition: { x: 20, y: 16 },
        currentHp: 40,
      }),
    })

    await page.goto('/world')
    await page.getByRole('button', { name: 'Pause menuを開く' }).click()
    const dialog = page.getByRole('dialog', { name: 'Pause menu' })
    await expect(dialog.getByText('40 / 108', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: 'INTERACT' }).click()
    await expect(page.getByText(/FULL RECOVERY/)).toBeVisible()
    await expect.poll(async () => (await storedRpgState(page)).state.currentHp).toBe(108)

    await page.reload()
    await page.getByRole('button', { name: 'Pause menuを開く' }).click()
    await expect(page.getByRole('dialog', { name: 'Pause menu' }).getByText('108 / 108', { exact: true })).toBeVisible()
  })

  test('JS TreasureはDebug CharmとGoldを一度だけ付与しreload後もOPENを維持する', async ({ page }) => {
    await seedStorage(page, {
      progress: createProgress({ gold: 5 }),
      rpg: createRpgState({ worldPosition: { x: 10, y: 18 } }),
    })

    await page.goto('/world')
    await expect(page.getByLabel('js-debug-cache treasure closed')).toBeVisible()
    await page.getByRole('button', { name: 'INTERACT' }).click()
    await expect(page.getByText(/DEBUG CACHE OPEN/)).toBeVisible()

    await expect.poll(async () => (await storedProgress(page)).progress.gold).toBe(25)
    await expect.poll(async () => (await storedRpgState(page)).state.openedTreasureIds).toEqual([
      'js-debug-cache',
    ])
    await expect.poll(async () => (await storedRpgState(page)).state.ownedEquipmentIds).toContain(
      'debug-charm',
    )

    await page.reload()
    await expect(page.getByLabel('js-debug-cache treasure opened')).toBeVisible()
    await page.getByRole('button', { name: 'INTERACT' }).click()
    await expect(page.getByText(/すでに空だ/)).toBeVisible()
    await expect.poll(async () => (await storedProgress(page)).progress.gold).toBe(25)

    await page.getByRole('button', { name: 'Pause menuを開く' }).click()
    const dialog = page.getByRole('dialog', { name: 'Pause menu' })
    await dialog.getByRole('button', { name: 'EQUIPMENT' }).click()
    await expect(dialog.getByText('Debug Charm', { exact: true }).first()).toBeVisible()
  })

  test('TS TreasureはPATCH KITとGoldを一度だけ付与しreload後もOPENを維持する', async ({ page }) => {
    await seedStorage(page, {
      progress: createProgress({ gold: 10, inventory: { patchKit: 2 } }),
      rpg: createRpgState({ worldPosition: { x: 30, y: 18 } }),
    })

    await page.goto('/world')
    await expect(page.getByLabel('ts-supply-cache treasure closed')).toBeVisible()
    await page.getByRole('button', { name: 'INTERACT' }).click()
    await expect(page.getByText(/TYPE CACHE OPEN/)).toBeVisible()

    await expect.poll(async () => (await storedProgress(page)).progress.gold).toBe(45)
    await expect.poll(async () => (await storedProgress(page)).progress.inventory.patchKit).toBe(3)
    await expect.poll(async () => (await storedRpgState(page)).state.openedTreasureIds).toEqual([
      'ts-supply-cache',
    ])

    await page.reload()
    await expect(page.getByLabel('ts-supply-cache treasure opened')).toBeVisible()
    await page.getByRole('button', { name: 'INTERACT' }).click()
    await expect(page.getByText(/すでに空だ/)).toBeVisible()
    await expect.poll(async () => (await storedProgress(page)).progress.gold).toBe(45)
    await expect.poll(async () => (await storedProgress(page)).progress.inventory.patchKit).toBe(3)
  })

  test('DefeatするとHubへ戻りfull HPで復帰する', async ({ page }) => {
    await seedStorage(page, {
      rpg: createRpgState({
        worldPosition: { x: 10, y: 11 },
        currentHp: 1,
      }),
    })

    await page.goto('/javascript/battle/1?seed=defeat-hp-e2e&returnTo=%2Fworld')
    await executeSkill(page, 'TRACE')
    await expect(page.getByText('DEFEAT', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /RETURN TO HUB/ }).click()

    await expect(page).toHaveURL(/\/world$/)
    await expect.poll(() => playerPosition(page)).toEqual({ x: 20, y: 14 })
    await expect.poll(async () => (await storedRpgState(page)).state.currentHp).toBe(108)
  })

  test('World / Gold / Equipment / Party stateはreload後も保持される', async ({ page }) => {
    await seedStorage(page, {
      progress: createProgress({ gold: 77, inventory: { patchKit: 2 } }),
      rpg: createRpgState({
        equipment: {
          weapon: 'branch-saber',
          armor: 'traveler-coat',
          accessory: 'debug-charm',
        },
        ownedEquipmentIds: [
          'training-blade',
          'traveler-coat',
          'debug-charm',
          'branch-saber',
        ],
        partyMemberIds: ['byte'],
        partyEquipment: {
          byte: { weapon: null, armor: null, accessory: null },
        },
        worldPosition: { x: 21, y: 14 },
        stepsSinceEncounter: 6,
        encounterCount: 9,
        currentHp: 72,
        openedTreasureIds: ['js-debug-cache'],
      }),
    })

    await page.goto('/world')
    await expect.poll(() => playerPosition(page)).toEqual({ x: 21, y: 14 })
    await page.reload()
    await expect.poll(() => playerPosition(page)).toEqual({ x: 21, y: 14 })

    await page.getByRole('button', { name: 'Pause menuを開く' }).click()
    const dialog = page.getByRole('dialog', { name: 'Pause menu' })
    await expect(dialog.getByText('77 G', { exact: true })).toBeVisible()
    await expect(dialog.getByText('72 / 108', { exact: true })).toBeVisible()

    await dialog.getByRole('button', { name: 'EQUIPMENT' }).click()
    await expect(dialog.getByText('Branch Saber', { exact: true }).first()).toBeVisible()

    await dialog.getByRole('button', { name: 'PARTY' }).click()
    await expect(dialog.getByText(/BYTE · SCOUT/)).toBeVisible()
  })

  test('BYTE加入がPause PARTYとBattle follow-upへ反映される', async ({ page }) => {
    await seedStorage(page, {
      rpg: createRpgState({ worldPosition: { x: 20, y: 13 } }),
    })

    await page.goto('/world')
    await page.getByRole('button', { name: 'INTERACT' }).click()
    await expect(page.getByText(/BYTE joined the party!/)).toBeVisible()

    await page.getByRole('button', { name: 'Pause menuを開く' }).click()
    const dialog = page.getByRole('dialog', { name: 'Pause menu' })
    await dialog.getByRole('button', { name: 'PARTY' }).click()
    await expect(dialog.getByText(/BYTE · SCOUT/)).toBeVisible()
    await page.keyboard.press('Escape')

    await page.goto('/javascript/battle/1?seed=party-e2e&returnTo=%2Fworld')
    await expect(page.getByText(/ALLY BYTE · FOLLOW-UP/)).toBeVisible()
  })

  test('JS Boss clear rewardのBranch Saberを装備するとBattle POWERへ反映される', async ({ page }) => {
    await seedStorage(page, {
      progress: createProgress({
        clearedStageIds: [1, 2, 3],
        clearedAreaIds: ['javascript'],
        unlockedStageIds: [1, 4, 2, 3],
      }),
    })

    await page.goto('/world')
    await page.getByRole('button', { name: 'Pause menuを開く' }).click()
    const dialog = page.getByRole('dialog', { name: 'Pause menu' })
    await dialog.getByRole('button', { name: 'EQUIPMENT' }).click()

    const branchSaber = dialog.getByRole('button', { name: /Branch Saber/ })
    await expect(branchSaber).toBeVisible()
    await branchSaber.click()
    await page.keyboard.press('Escape')

    await page.goto('/javascript/battle/1?seed=equipment-e2e&returnTo=%2Fworld')
    const trace = page.getByRole('button', { name: /^TRACE\b/ })
    await expect(trace).toContainText('POWER 40')
  })
})
