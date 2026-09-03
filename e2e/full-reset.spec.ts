import { readStoredProgress, readStoredRpg } from './storedGameState'
import { expect, test } from '@playwright/test'

const AUDIO_KEY = 'code-reading-rpg:audio-settings'
const OPENING_KEY = 'code-read-rpg:javascript-opening:v1'
const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedPlayedRun(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(
    ({ audioKey, openingKey, progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(
        audioKey,
        JSON.stringify({
          version: 1,
          settings: { muted: true, seVolume: 0.65, bgmVolume: 0.35 },
        }),
      )
      localStorage.setItem(openingKey, 'seen')
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
            unlockedSkillIds: [
              'trace',
              'pulse',
              'nova',
              'ts-scan',
              'ts-guard',
              'ts-label',
              'viper',
              'moon-edge',
            ],
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
            partyMemberIds: ['byte'],
            partyEquipment: {
              byte: { weapon: null, armor: null, accessory: null },
            },
            worldPosition: { x: 21, y: 14 },
            stepsSinceEncounter: 6,
            encounterCount: 3,
            currentHp: 72,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'completed', phase: 'battle' }),
      )
    },
    {
      audioKey: AUDIO_KEY,
      openingKey: OPENING_KEY,
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
    },
  )
  await page.goto('/world')
}

test('進行リセットはOpeningを含め最初からに戻しSoundだけ保持する', async ({ page }) => {
  await seedPlayedRun(page)

  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const dialog = page.getByRole('dialog', { name: 'メニュー' })
  await dialog.getByRole('button', { name: '設定' }).click()
  await dialog.getByRole('button', { name: '進行をリセット', exact: true }).click()
  await dialog.getByRole('button', { name: '本当に進行をリセットする', exact: true }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: 'はじめる' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'オープニングを見る' })).toHaveCount(0)

  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), OPENING_KEY)).toBeNull()

  await expect.poll(async () =>
    readStoredProgress(page),
  ).toMatchObject({
    version: 4,
    progress: {
      exp: 0,
      gold: 0,
      inventory: { patchKit: 0 },
      clearedStageIds: [],
    },
  })

  await expect.poll(async () =>
    readStoredRpg(page),
  ).toMatchObject({
    version: 5,
    state: {
      equipment: {
        weapon: 'training-blade',
        armor: 'traveler-coat',
        accessory: null,
      },
      ownedEquipmentIds: ['training-blade', 'traveler-coat'],
      partyMemberIds: [],
      worldMapId: 'overworld',
      worldPosition: { x: 20, y: 14 },
      currentHp: 108,
    },
  })

  await expect.poll(async () =>
    page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), TUTORIAL_KEY),
  ).toEqual({ version: 1, status: 'active', phase: 'field-move' })

  const audio = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? 'null'),
    AUDIO_KEY,
  )
  expect(audio).toEqual({
    version: 1,
    settings: { muted: true, seVolume: 0.65, bgmVolume: 0.35 },
  })

  await page.getByRole('button', { name: 'はじめる' }).click()
  await expect(page.getByLabel('JavaScript オープニングストーリー')).toBeVisible()
  await expect(page.locator('.opening-layer-badge')).toHaveText('REAL WORLD')
  await expect(page.locator('.opening-kicker')).toHaveText('DEVELOPMENT ROOM')
})
