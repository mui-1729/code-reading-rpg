import { readStoredProgress, readStoredRpg } from './storedGameState'
import { expect, test } from '@playwright/test'
import { selectPauseTab } from './pause-menu-helpers'

const AUDIO_KEY = 'code-reading-rpg:audio-settings'
const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function prepareWorld(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate((tutorialKey) => {
    localStorage.clear()
    localStorage.setItem(
      tutorialKey,
      JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
    )
  }, TUTORIAL_KEY)
  await page.goto('/world')
}

async function openPauseMenu(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  return page.getByRole('dialog', { name: 'メニュー' })
}

test('サウンド設定はメニューの設定だけにありreload後も保持される', async ({ page }) => {
  await prepareWorld(page)

  await expect(page.locator('.audio-settings-toggle')).toHaveCount(0)

  let dialog = await openPauseMenu(page)
  await selectPauseTab(dialog, '設定')
  const se = dialog.getByLabel('SE音量')
  const bgm = dialog.getByLabel('BGM音量')

  await se.fill('65')
  await bgm.fill('35')
  await dialog.getByRole('button', { name: 'サウンド ON' }).click()
  await expect(dialog.getByRole('button', { name: 'サウンド OFF' })).toBeVisible()

  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), AUDIO_KEY)
  expect(stored).toEqual({
    version: 1,
    settings: { muted: true, seVolume: 0.65, bgmVolume: 0.35 },
  })

  await page.reload()
  dialog = await openPauseMenu(page)
  await selectPauseTab(dialog, '設定')
  await expect(dialog.getByRole('button', { name: 'サウンド OFF' })).toBeVisible()
  await expect(dialog.getByLabel('SE音量')).toHaveValue('65')
  await expect(dialog.getByLabel('BGM音量')).toHaveValue('35')
})

test('進行リセットはEconomy/RPG stateを初期化しサウンド設定は保持する', async ({ page }) => {
  await prepareWorld(page)

  let dialog = await openPauseMenu(page)
  await selectPauseTab(dialog, '設定')
  await dialog.getByLabel('SE音量').fill('65')
  await dialog.getByLabel('BGM音量').fill('35')
  await dialog.getByRole('button', { name: 'サウンド ON' }).click()
  await page.keyboard.press('Escape')

  await page.evaluate(
    ({ progressKey, rpgKey }) => {
      localStorage.removeItem('code-reading-rpg:game-state')
      localStorage.removeItem('code-reading-rpg:game-state-backup')
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 120,
            gold: 77,
            inventory: { patchKit: 2 },
            clearedStageIds: [1, 2],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 4, 2, 3],
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label', 'viper', 'moon-edge'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 3,
          state: {
            equipment: {
              weapon: 'guard-edge',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat', 'guard-edge'],
            partyMemberIds: [],
            partyEquipment: {},
            worldPosition: { x: 21, y: 14 },
            stepsSinceEncounter: 6,
            encounterCount: 3,
            currentHp: 72,
            openedTreasureIds: [],
          },
        }),
      )
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY },
  )
  await page.reload()

  dialog = await openPauseMenu(page)
  await expect(dialog.getByText('77 G', { exact: true })).toBeVisible()
  await selectPauseTab(dialog, '設定')
  await dialog.getByRole('button', { name: '進行をリセット', exact: true }).click()
  await dialog.getByRole('button', { name: '本当に進行をリセットする', exact: true }).click()

  await expect.poll(async () => readStoredProgress(page)).toMatchObject({
    version: 4,
    progress: {
      exp: 0,
      gold: 0,
      inventory: { patchKit: 0 },
      clearedStageIds: [],
    },
  })
  await expect.poll(async () => readStoredRpg(page)).toMatchObject({
    version: 6,
    state: {
      equipment: {
        weapon: 'training-blade',
        armor: 'traveler-coat',
        accessory: null,
      },
      ownedEquipmentIds: ['training-blade', 'traveler-coat'],
      worldMapId: 'overworld',
      worldPosition: { x: 20, y: 14 },
      currentHp: 108,
    },
  })

  const audio = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), AUDIO_KEY)
  expect(audio).toEqual({
    version: 1,
    settings: { muted: true, seVolume: 0.65, bgmVolume: 0.35 },
  })
})

test('Codexは独立buttonを持たずメニューのコード図鑑から参照できる', async ({ page }) => {
  await prepareWorld(page)

  await expect(page.locator('.codex-toggle')).toHaveCount(0)

  const dialog = await openPauseMenu(page)
  await selectPauseTab(dialog, 'コード図鑑')
  const codex = dialog.getByLabel('Code Codex')

  await expect(codex.getByRole('tab', { name: 'JAVASCRIPT' })).toHaveAttribute('aria-selected', 'true')
  await expect(codex.getByText('CONCEPTS', { exact: false })).toBeVisible()

  await codex.getByRole('tab', { name: 'TYPESCRIPT' }).click()
  await expect(codex.getByRole('tab', { name: 'TYPESCRIPT' })).toHaveAttribute('aria-selected', 'true')
})
