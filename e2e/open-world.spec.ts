import { readStoredProgress, readStoredRpg } from './storedGameState'
import { expect, test, type Page } from '@playwright/test'
import { JS_COMPLETE } from './canonical-progress-fixtures'

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
    unlockedStageIds: [1],
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

async function dismissStory(page: Page) {
  const story = page.locator('.battle-story-window')
  await expect(story).toBeVisible()
  await story.getByRole('button', { name: 'スキップ', exact: true }).click()
  await expect(story).toBeHidden()
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
  return readStoredRpg(page)
}

async function storedProgress(page: Page) {
  return readStoredProgress(page)
}

test.describe('Open World RPG loop', () => {
  test('Title → fixed first incident → Battle victory → World returnで位置と残HPを保持する', async ({ page }) => {
    await seedStorage(page, {
      progress: createProgress(),
      rpg: createRpgState({
        partyMemberIds: ['byte'],
        partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
        worldPosition: { x: 10, y: 10 },
        stepsSinceEncounter: 4,
        encounterCount: 4,
      }),
    })

    await page.getByRole('button', { name: '続きから' }).click()
    await expect(page).toHaveURL(/\/world$/)
    await expect.poll(() => playerPosition(page)).toEqual({ x: 10, y: 10 })

    // BYTE合流後は教材履修を要求せず、JavaScript側の次のmovementで最初のlive incidentを固定再現する。
    await page.getByRole('button', { name: '下へ移動' }).click()
    await expect(page).toHaveURL(/\/javascript\/battle\/1\?/)
    await expect(page.locator('.battle-console')).toBeVisible()
    await dismissStory(page)

    await executeSkill(page, 'TRACE')
    await expect(page.getByText('ターン 2')).toBeVisible()

    await executeSkill(page, 'PULSE')
    await expect(page.getByText('ターン 3')).toBeVisible()

    await executeSkill(page, 'TRACE')
    await expect(page.getByText('勝利', { exact: true })).toBeVisible()

    const skip = page.getByRole('button', { name: 'スキップ', exact: true })
    await expect(skip).toBeVisible()
    await skip.click()
    await page.getByRole('button', { name: /ワールドへ戻る/ }).click()

    await expect(page).toHaveURL(/\/world$/)
    await expect.poll(() => playerPosition(page)).toEqual({ x: 10, y: 11 })

    const stored = await storedRpgState(page)
    expect(stored.version).toBe(5)
    expect(stored.state.worldMapId).toBe('overworld')
    expect(stored.state.worldPosition).toEqual({ x: 10, y: 11 })
    expect(stored.state.encounterCount).toBe(5)
    expect(stored.state.stepsSinceEncounter).toBe(0)
    expect(stored.state.currentHp).toBeGreaterThan(0)
    expect(stored.state.currentHp).toBeLessThan(108)

    const progress = await storedProgress(page)
    expect(progress.progress.clearedStageIds).toContain(1)
    expect(progress.progress.unlockedStageIds).toContain(7)
    expect(progress.progress.unlockedStageIds).not.toContain(10)
    expect(progress.progress.unlockedStageIds).not.toContain(2)

    // JS-01だけではLV2へ上げず、最初の観察後もmax HPは108のまま残HPを引き継ぐ。
    await page.goto('/javascript/battle/1?seed=hp-carry-e2e&returnTo=%2Fworld')
    await expect(page.locator('.player-panel .status-label-row strong')).toHaveText(
      `${stored.state.currentHp}/108`,
    )
  })

  test('PATCH KIT回復後のcurrent HPをRpgStateへ保存する', async ({ page }) => {
    await seedStorage(page, {
      progress: createProgress({ inventory: { patchKit: 1 } }),
      rpg: createRpgState({ currentHp: 40 }),
    })

    await page.goto('/javascript/battle/1?seed=patch-hp-e2e&returnTo=%2Fworld')
    await dismissStory(page)
    await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('40/108')
    await page.locator('.battle-item-toggle').click()
    await page.getByRole('button', { name: /PATCH KIT ×1/ }).click()
    await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')

    await expect.poll(async () => (await storedRpgState(page)).state.currentHp).toBe(64)
    const progress = await storedProgress(page)
    expect(progress.progress.inventory.patchKit).toBe(0)
  })

  test('Hub INNで20Gを支払いfull recoveryしreload後もGold / HPを保持する', async ({ page }) => {
    await seedStorage(page, {
      progress: createProgress({ gold: 50 }),
      rpg: createRpgState({
        worldPosition: { x: 20, y: 16 },
        currentHp: 40,
      }),
    })

    await page.goto('/world')
    await expect(page.getByLabel('宿', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '宿で休む' }).click()

    const inn = page.getByRole('dialog', { name: '宿' })
    await expect(inn).toBeVisible()
    await expect(inn.getByText('40 / 108', { exact: true })).toBeVisible()
    await expect(inn.getByText('+68 HP', { exact: true })).toBeVisible()
    await expect(inn.getByText('20 G', { exact: true })).toBeVisible()
    await expect(inn.getByText('50 G → 30 G', { exact: true })).toBeVisible()

    expect((await storedRpgState(page)).state.currentHp).toBe(40)
    expect((await storedProgress(page)).progress.gold).toBe(50)

    await inn.getByRole('button', { name: '▶ 休む' }).click()
    await expect(page.locator('.world-message')).toContainText('全回復')
    await expect.poll(async () => (await storedRpgState(page)).state.currentHp).toBe(108)
    await expect.poll(async () => (await storedProgress(page)).progress.gold).toBe(30)

    await page.reload()
    await page.getByRole('button', { name: 'メニューを開く' }).click()
    const dialog = page.getByRole('dialog', { name: 'メニュー' })
    await expect(dialog.getByText('108 / 108', { exact: true })).toBeVisible()
    await expect(dialog.getByText('30 G', { exact: true })).toBeVisible()
  })

  test('JS TreasureはDebug CharmとGoldを一度だけ付与しreload後もOPENを維持する', async ({ page }) => {
    await seedStorage(page, {
      progress: createProgress({ gold: 5 }),
      rpg: createRpgState({ worldPosition: { x: 10, y: 18 } }),
    })

    await page.goto('/world')
    await expect(page.getByLabel('DEBUG CACHE 未開封')).toBeVisible()
    await page.getByRole('button', { name: '宝箱を開ける' }).click()
    await expect(page.getByText(/DEBUG CACHE 開封/)).toBeVisible()

    await expect.poll(async () => (await storedProgress(page)).progress.gold).toBe(25)
    await expect.poll(async () => (await storedRpgState(page)).state.openedTreasureIds).toEqual([
      'js-debug-cache',
    ])
    await expect.poll(async () => (await storedRpgState(page)).state.ownedEquipmentIds).toContain(
      'debug-charm',
    )

    await page.reload()
    await expect(page.getByLabel('DEBUG CACHE 開封済み')).toBeVisible()
    await page.getByRole('button', { name: '宝箱を調べる' }).click()
    await expect(page.getByText(/すでに空だ/)).toBeVisible()
    await expect.poll(async () => (await storedProgress(page)).progress.gold).toBe(25)

    await page.getByRole('button', { name: 'メニューを開く' }).click()
    const dialog = page.getByRole('dialog', { name: 'メニュー' })
    await dialog.getByRole('button', { name: '装備' }).click()
    await expect(dialog.getByText('Debug Charm', { exact: true }).first()).toBeVisible()
  })

  test('TS TreasureはPATCH KITとGoldを一度だけ付与しreload後もOPENを維持する', async ({ page }) => {
    await seedStorage(page, {
      progress: createProgress({
        gold: 10,
        inventory: { patchKit: 2 },
        clearedStageIds: JS_COMPLETE,
      }),
      rpg: createRpgState({ worldPosition: { x: 30, y: 18 } }),
    })

    await page.goto('/world')
    await expect(page.getByLabel('TYPE CACHE 未開封')).toBeVisible()
    await page.getByRole('button', { name: '宝箱を開ける' }).click()
    await expect(page.getByText(/TYPE CACHE 開封/)).toBeVisible()

    await expect.poll(async () => (await storedProgress(page)).progress.gold).toBe(45)
    await expect.poll(async () => (await storedProgress(page)).progress.inventory.patchKit).toBe(3)
    await expect.poll(async () => (await storedRpgState(page)).state.openedTreasureIds).toEqual([
      'ts-supply-cache',
    ])

    await page.reload()
    await expect(page.getByLabel('TYPE CACHE 開封済み')).toBeVisible()
    await page.getByRole('button', { name: '宝箱を調べる' }).click()
    await expect(page.getByText(/すでに空だ/)).toBeVisible()
    await expect.poll(async () => (await storedProgress(page)).progress.gold).toBe(45)
    await expect.poll(async () => (await storedProgress(page)).progress.inventory.patchKit).toBe(3)
  })

  test('DefeatするとBattle開始checkpointへ残HPのまま戻る', async ({ page }) => {
    await seedStorage(page, {
      rpg: createRpgState({
        worldPosition: { x: 10, y: 11 },
        currentHp: 1,
      }),
    })

    await page.goto('/javascript/battle/1?seed=defeat-hp-e2e&returnTo=%2Fworld')
    await dismissStory(page)
    await executeSkill(page, 'TRACE')
    await expect(page.getByText('敗北', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /チェックポイントへ戻る/ }).click()

    await expect(page).toHaveURL(/\/world$/)
    await expect.poll(() => playerPosition(page)).toEqual({ x: 10, y: 11 })
    await expect.poll(async () => (await storedRpgState(page)).state.currentHp).toBe(1)
    await expect.poll(async () => (await storedRpgState(page)).state.stepsSinceEncounter).toBe(0)
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

    await page.getByRole('button', { name: 'メニューを開く' }).click()
    const dialog = page.getByRole('dialog', { name: 'メニュー' })
    await expect(dialog.getByText('77 G', { exact: true })).toBeVisible()
    await expect(dialog.getByText('72 / 108', { exact: true })).toBeVisible()

    await dialog.getByRole('button', { name: '装備' }).click()
    await expect(dialog.getByText('Branch Saber', { exact: true }).first()).toBeVisible()

    await dialog.getByRole('button', { name: '仲間' }).click()
    await expect(dialog.getByText(/BYTE · 斥候/)).toBeVisible()
  })

  test('BYTE加入がメニューの仲間とBattle follow-upへ反映される', async ({ page }) => {
    await seedStorage(page, {
      rpg: createRpgState({ worldPosition: { x: 20, y: 13 } }),
    })

    await page.goto('/world')
    await page.getByRole('button', { name: 'BYTEと話す' }).click()
    await expect(page.locator('.world-message')).toContainText('BYTEが仲間になった！')

    await page.getByRole('button', { name: 'メニューを開く' }).click()
    const dialog = page.getByRole('dialog', { name: 'メニュー' })
    await dialog.getByRole('button', { name: '仲間' }).click()
    await expect(dialog.getByText(/BYTE · 斥候/)).toBeVisible()
    await page.keyboard.press('Escape')

    await page.goto('/javascript/battle/1?seed=party-e2e&returnTo=%2Fworld')
    await dismissStory(page)
    await expect(page.getByText(/仲間 BYTE · 追撃/)).toBeVisible()
  })

  test('JS Boss clear rewardのBranch Saberを装備するとBattle POWERへ反映される', async ({ page }) => {
    await seedStorage(page, {
      progress: createProgress({
        clearedStageIds: JS_COMPLETE,
        clearedAreaIds: ['javascript'],
        unlockedStageIds: [7],
      }),
    })

    await page.goto('/world')
    await page.getByRole('button', { name: 'メニューを開く' }).click()
    const dialog = page.getByRole('dialog', { name: 'メニュー' })
    await dialog.getByRole('button', { name: '装備' }).click()

    const branchSaber = dialog.getByRole('button', { name: /Branch Saber/ })
    await expect(branchSaber).toBeVisible()
    await branchSaber.click()
    await page.keyboard.press('Escape')

    await page.goto('/javascript/battle/1?seed=equipment-e2e&returnTo=%2Fworld')
    const trace = page.getByRole('button', { name: /^TRACE\b/ })
    await expect(trace).toContainText('威力 40')
  })
})