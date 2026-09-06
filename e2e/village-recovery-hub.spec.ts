import { expect, test, type Page } from '@playwright/test'
import { readStoredGameState } from './storedGameState'

const GAME_STATE_KEY = 'code-reading-rpg:game-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedVillage(page: Page, position: { x: number; y: number }, currentHp = 52) {
  await page.goto('/')
  await page.evaluate(
    ({ gameStateKey, tutorialKey, position, currentHp }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(
        gameStateKey,
        JSON.stringify({
          version: 2,
          revision: 1,
          progress: {
            version: 4,
            progress: {
              exp: 0,
              gold: 200,
              inventory: { patchKit: 0 },
              clearedStageIds: [1],
              clearedAreaIds: [],
              completedSideQuestIds: [],
              unlockedStageIds: [1, 7],
              unlockedSkillIds: ['trace', 'pulse', 'nova'],
            },
          },
          rpg: {
            version: 7,
            state: {
              equipment: {
                weapon: 'training-blade',
                armor: 'traveler-coat',
                accessory: null,
              },
              ownedEquipmentIds: ['training-blade', 'traveler-coat'],
              partyMemberIds: ['byte'],
              worldMapId: 'js-village',
              worldPosition: position,
              safeCheckpoint: {
                id: 'central-hub',
                mapId: 'overworld',
                position: { x: 20, y: 14 },
              },
              stepsSinceEncounter: 0,
              encounterCount: 0,
              currentHp,
              openedTreasureIds: [],
            },
          },
          battleSession: null,
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    { gameStateKey: GAME_STATE_KEY, tutorialKey: TUTORIAL_KEY, position, currentHp },
  )
  await page.goto('/world')
}

async function faceUpWithoutChangingLog(page: Page) {
  const log = page.locator('.world-message p')
  const before = await log.textContent()
  await page.getByRole('button', { name: '上へ移動' }).click()
  await expect(page.locator('.world-player-sprite')).toHaveAttribute('data-facing', 'up')
  await expect(log).toHaveText(before ?? '')
}

test('Villageの宿は向いてActionした時だけ開きGoldを払いHPを回復しsafe hubを更新できる', async ({ page }) => {
  await seedVillage(page, { x: 5, y: 12 })

  await expect(page.getByRole('button', { name: '宿で休む' })).toHaveCount(0)
  await faceUpWithoutChangingLog(page)

  const innButton = page.getByRole('button', { name: '宿で休む' })
  await expect(innButton).toBeVisible()
  await expect(innButton).toBeEnabled()
  await innButton.click()

  const inn = page.getByRole('dialog', { name: '宿' })
  await expect(inn).toContainText('グリーンフィールド村 // 休息所')
  await inn.getByRole('button', { name: '▶ 休む' }).click()

  const stored = await readStoredGameState(page)
  expect(stored.rpg.state.currentHp).toBeGreaterThan(52)
  expect(stored.progress.progress.gold).toBeLessThan(200)
  expect(stored.rpg.state.safeCheckpoint).toEqual({
    id: 'greenfield-village',
    mapId: 'js-village',
    position: { x: 10, y: 12 },
  })
})

test('Villageの道具屋は向いてActionすると消耗品だけを扱う', async ({ page }) => {
  await seedVillage(page, { x: 14, y: 12 }, 100)
  await faceUpWithoutChangingLog(page)

  await page.getByRole('button', { name: '道具屋を見る' }).click()
  const shop = page.getByRole('dialog', { name: '道具屋' })
  await expect(shop).toBeVisible()
  await expect(shop.getByText('PATCH KIT', { exact: true })).toBeVisible()
  await expect(shop.locator('[data-equipment-id]')).toHaveCount(0)
})

test('Villageの装備屋は向いてActionすると装備だけを扱い既存purchase domainを使える', async ({ page }) => {
  await seedVillage(page, { x: 15, y: 12 }, 100)
  await faceUpWithoutChangingLog(page)

  await page.getByRole('button', { name: '装備屋を見る' }).click()
  const shop = page.getByRole('dialog', { name: '装備屋' })
  await expect(shop).toBeVisible()
  await expect(shop.locator('[data-equipment-id="guard-edge"]')).toBeVisible()
  await expect(shop.locator('[data-item-id]')).toHaveCount(0)

  await shop.locator('[data-equipment-id="guard-edge"]').getByRole('button', { name: '▶ 購入' }).click()
  const stored = await readStoredGameState(page)
  expect(stored.rpg.state.ownedEquipmentIds).toContain('guard-edge')
  expect(stored.progress.progress.gold).toBeLessThan(200)
})
