import { expect, test } from '@playwright/test'

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
  await page.getByRole('button', { name: 'Pause menuを開く' }).click()
  return page.getByRole('dialog', { name: 'Pause menu' })
}

test('Sound設定はPause SYSTEMだけにありreload後も保持される', async ({ page }) => {
  await prepareWorld(page)

  await expect(page.locator('.audio-settings-toggle')).toHaveCount(0)

  let dialog = await openPauseMenu(page)
  await dialog.getByRole('button', { name: 'SYSTEM' }).click()
  const se = dialog.getByLabel('Sound effect volume')
  const bgm = dialog.getByLabel('Background music volume')

  await se.fill('65')
  await bgm.fill('35')
  await dialog.getByRole('button', { name: 'SOUND ON' }).click()
  await expect(dialog.getByRole('button', { name: 'SOUND OFF' })).toBeVisible()

  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), AUDIO_KEY)
  expect(stored).toEqual({
    version: 1,
    settings: { muted: true, seVolume: 0.65, bgmVolume: 0.35 },
  })

  await page.reload()
  dialog = await openPauseMenu(page)
  await dialog.getByRole('button', { name: 'SYSTEM' }).click()
  await expect(dialog.getByRole('button', { name: 'SOUND OFF' })).toBeVisible()
  await expect(dialog.getByLabel('Sound effect volume')).toHaveValue('65')
  await expect(dialog.getByLabel('Background music volume')).toHaveValue('35')
})

test('RESET PROGRESSはEconomy/RPG stateを初期化しSound設定は保持する', async ({ page }) => {
  await prepareWorld(page)

  let dialog = await openPauseMenu(page)
  await dialog.getByRole('button', { name: 'SYSTEM' }).click()
  await dialog.getByLabel('Sound effect volume').fill('65')
  await dialog.getByLabel('Background music volume').fill('35')
  await dialog.getByRole('button', { name: 'SOUND ON' }).click()
  await page.keyboard.press('Escape')

  await page.evaluate(
    ({ progressKey, rpgKey }) => {
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
  await dialog.getByRole('button', { name: 'SYSTEM' }).click()
  await dialog.getByRole('button', { name: 'RESET PROGRESS' }).click()
  await dialog.getByRole('button', { name: 'CONFIRM RESET PROGRESS' }).click()

  await expect.poll(async () => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), PROGRESS_KEY)).toMatchObject({
    version: 4,
    progress: {
      exp: 0,
      gold: 0,
      inventory: { patchKit: 0 },
      clearedStageIds: [],
    },
  })
  await expect.poll(async () => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), RPG_KEY)).toMatchObject({
    version: 3,
    state: {
      equipment: {
        weapon: 'training-blade',
        armor: 'traveler-coat',
        accessory: null,
      },
      ownedEquipmentIds: ['training-blade', 'traveler-coat'],
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

test('Codexは独立buttonを持たずPause CODEXから参照できる', async ({ page }) => {
  await prepareWorld(page)

  await expect(page.locator('.codex-toggle')).toHaveCount(0)

  const dialog = await openPauseMenu(page)
  await dialog.getByRole('button', { name: 'CODEX' }).click()
  const codex = dialog.getByLabel('Code Codex')

  await expect(codex.getByRole('tab', { name: 'JAVASCRIPT' })).toHaveAttribute('aria-selected', 'true')
  await expect(codex.getByText('CONCEPTS', { exact: false })).toBeVisible()

  await codex.getByRole('tab', { name: 'TYPESCRIPT' }).click()
  await expect(codex.getByRole('tab', { name: 'TYPESCRIPT' })).toHaveAttribute('aria-selected', 'true')
})
