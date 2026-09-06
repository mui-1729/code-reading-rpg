import { expect, test, type Page } from '@playwright/test'
import { JS_COMPLETE } from './canonical-progress-fixtures'
import { readStoredRpg } from './storedGameState'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const initialSkills = ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label']

async function seedFrontier(
  page: Page,
  options: {
    worldPosition?: { x: number; y: number }
    currentHp?: number
    gold?: number
    safeCheckpoint?: {
      id: 'central-hub' | 'typescript-frontier-outpost'
      mapId: 'overworld' | 'ts-frontier'
      position: { x: number; y: number }
    }
  } = {},
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, skills, worldPosition, currentHp, gold, safeCheckpoint }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold,
            inventory: { patchKit: 0 },
            clearedStageIds: [...JS_COMPLETE],
            clearedAreaIds: ['javascript'],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 4, 7],
            unlockedSkillIds: skills,
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 7,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: ['byte'],
            partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
            worldMapId: 'ts-frontier',
            worldPosition,
            safeCheckpoint,
            stepsSinceEncounter: 8,
            encounterCount: 0,
            currentHp,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      skills: initialSkills,
      worldPosition: options.worldPosition ?? { x: 5, y: 10 },
      currentHp: options.currentHp ?? 40,
      gold: options.gold ?? 50,
      safeCheckpoint: options.safeCheckpoint ?? {
        id: 'central-hub',
        mapId: 'overworld',
        position: { x: 20, y: 14 },
      },
    },
  )
  await page.goto('/world')
}

const frontier = (page: Page) => page.getByLabel('TypeScript辺境のマップ')

test('境界監視所へ到達するとsafe hubが更新され、補給・宿・住民会話を使える', async ({ page }) => {
  await seedFrontier(page)

  await expect(frontier(page)).toHaveAttribute('data-world-x', '5')
  await expect(frontier(page)).toHaveAttribute('data-world-y', '10')

  await page.getByRole('button', { name: '右へ移動' }).click()
  await expect(frontier(page)).toHaveAttribute('data-world-x', '6')
  await expect(page.getByLabel('境界監視所')).toBeVisible()
  await expect.poll(async () => (await readStoredRpg(page)).state.safeCheckpoint).toEqual({
    id: 'typescript-frontier-outpost',
    mapId: 'ts-frontier',
    position: { x: 8, y: 10 },
  })

  await page.getByRole('button', { name: '右へ移動' }).click()
  await expect(frontier(page)).toHaveAttribute('data-world-x', '7')

  // 補給所の住民がcounter tileを塞ぎ、向いた先だけをActionする。
  await page.getByRole('button', { name: '上へ移動' }).click()
  await expect(frontier(page)).toHaveAttribute('data-world-y', '10')
  await page.getByRole('button', { name: 'ショップを見る' }).click()
  const shop = page.getByRole('dialog', { name: 'ショップ' })
  await expect(shop).toBeVisible()
  await expect(shop).toContainText('境界監視所 // ショップ')
  await expect(shop).not.toContainText('CENTRAL HUB // ショップ')
  await shop.getByRole('button', { name: 'ショップを閉じる' }).click()

  // 宿も同じ拠点のサービスとして利用でき、既存checkpointを維持する。
  await page.getByRole('button', { name: '下へ移動' }).click()
  await expect(frontier(page)).toHaveAttribute('data-world-y', '10')
  await page.getByRole('button', { name: '宿で休む' }).click()
  const inn = page.getByRole('dialog', { name: '宿' })
  await expect(inn).toBeVisible()
  await expect(inn).toContainText('境界監視所 // 休息所')
  await expect(inn.getByText('40 / 108', { exact: true })).toBeVisible()
  await inn.getByRole('button', { name: '▶ 休む' }).click()

  await expect.poll(async () => (await readStoredRpg(page)).state).toMatchObject({
    currentHp: 108,
    safeCheckpoint: {
      id: 'typescript-frontier-outpost',
      mapId: 'ts-frontier',
      position: { x: 8, y: 10 },
    },
  })

  await page.getByRole('button', { name: '右へ移動' }).click()
  await page.getByRole('button', { name: '右へ移動' }).click()
  await expect(frontier(page)).toHaveAttribute('data-world-x', '9')
  await page.getByRole('button', { name: '上へ移動' }).click()
  await expect(frontier(page)).toHaveAttribute('data-world-y', '10')
  await page.getByRole('button', { name: 'TYPE WARDENと話す' }).click()
  await expect(page.getByRole('dialog', { name: 'TYPE WARDENとの会話' })).toBeVisible()
})

test('東側で敗北するとBattle開始tileではなく直近の境界監視所へ開始HPのまま戻る', async ({ page }) => {
  await seedFrontier(page, {
    worldPosition: { x: 20, y: 10 },
    currentHp: 1,
    safeCheckpoint: {
      id: 'typescript-frontier-outpost',
      mapId: 'ts-frontier',
      position: { x: 8, y: 10 },
    },
  })

  await page.goto('/typescript/battle/4?seed=defeat-ts-outpost-e2e&returnTo=%2Fworld')
  const story = page.locator('.battle-story-window')
  if (await story.isVisible()) {
    await story.getByRole('button', { name: 'スキップ', exact: true }).click()
  }

  await page.getByRole('button', { name: '戦う', exact: true }).click()
  const typeScan = page.getByRole('button', { name: /^TYPE SCAN\b/ })
  await expect(typeScan).toBeEnabled()
  await typeScan.click()
  await expect(typeScan).toHaveClass(/selected/)
  await typeScan.click()
  await expect(page.getByText('敗北', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: /チェックポイントへ戻る/ }).click()
  await expect(page).toHaveURL(/\/world$/)
  await expect(frontier(page)).toHaveAttribute('data-world-map', 'ts-frontier')
  await expect(frontier(page)).toHaveAttribute('data-world-x', '8')
  await expect(frontier(page)).toHaveAttribute('data-world-y', '10')
  await expect.poll(async () => readStoredRpg(page)).toMatchObject({
    version: 7,
    state: {
      worldMapId: 'ts-frontier',
      worldPosition: { x: 8, y: 10 },
      safeCheckpoint: {
        id: 'typescript-frontier-outpost',
        mapId: 'ts-frontier',
        position: { x: 8, y: 10 },
      },
      currentHp: 1,
      stepsSinceEncounter: 0,
    },
  })
})
