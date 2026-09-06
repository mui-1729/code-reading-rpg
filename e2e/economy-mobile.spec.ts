import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedMobileState(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 200,
            inventory: { patchKit: 1 },
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
            currentHp: 40,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )
  await page.goto('/world')
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1)
}

test('390px幅でShop / Inn / メニューが横overflowせずEscapeで閉じられる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedMobileState(page)

  await page.getByRole('button', { name: '左へ移動' }).click()
  await page.getByRole('button', { name: 'ショップを見る' }).click()
  const shop = page.getByRole('dialog', { name: 'ショップ' })
  await expect(shop).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await page.keyboard.press('Escape')
  await expect(shop).toBeHidden()

  await page.evaluate(() => {
    const key = 'code-reading-rpg:game-state'
    const stored = JSON.parse(localStorage.getItem(key) ?? 'null')
    stored.rpg.state.worldPosition = { x: 20, y: 16 }
    stored.rpg.state.currentHp = 40
    stored.revision += 1
    localStorage.setItem(key, JSON.stringify(stored))
  })
  await page.reload()

  await page.getByRole('button', { name: '右へ移動' }).click()
  await page.getByRole('button', { name: '宿で休む' }).click()
  const inn = page.getByRole('dialog', { name: '宿' })
  await expect(inn).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await page.keyboard.press('Escape')
  await expect(inn).toBeHidden()

  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const pause = page.getByRole('dialog', { name: 'メニュー' })
  await expect(pause).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await page.keyboard.press('Escape')
  await expect(pause).toBeHidden()
})
