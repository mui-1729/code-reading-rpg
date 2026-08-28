import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedDeepForestGate(page: Page, clearedFilter14: boolean) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, cleared14 }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 160,
            gold: 54,
            inventory: { patchKit: 0 },
            clearedStageIds: cleared14
              ? [7, 8, 9, 10, 11, 12, 13, 14]
              : [7, 8, 9, 10, 11, 12, 13],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            // #209時点のsave相当。14 clear済みならrestoreで15を補完する。
            unlockedStageIds: [1, 4, 7, 8, 9, 10, 11, 12, 13, 14],
            unlockedSkillIds: [
              'trace',
              'pulse',
              'nova',
              'ts-scan',
              'ts-guard',
              'ts-label',
              'link',
              'fork',
              'gather',
            ],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 4,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: ['byte'],
            partyEquipment: {
              byte: { weapon: null, armor: null, accessory: null },
            },
            worldMapId: 'js-forest',
            worldPosition: { x: 2, y: 10 },
            stepsSinceEncounter: 0,
            encounterCount: 6,
            currentHp: 100,
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
      cleared14: clearedFilter14,
    },
  )
  await page.goto('/world')
}

test('Battle 14未clearではDeep Forest入口が閉じている', async ({ page }) => {
  await seedDeepForestGate(page, false)

  const forest = page.getByLabel('Forest map')
  await expect(forest).toHaveAttribute('data-world-map', 'js-forest')
  await page.getByRole('button', { name: 'Move left' }).click()

  await expect(page.getByLabel('Forest map')).toHaveAttribute('data-world-map', 'js-forest')
  await expect(page.getByLabel('Forest map')).toHaveAttribute('data-world-x', '2')
})

test('Battle 14 clear後はDeep Forestへ入りreload後もmapを保持する', async ({ page }) => {
  await seedDeepForestGate(page, true)

  await expect(page.getByText('DEEP FOREST OPEN', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Move left' }).click()

  const deepForest = page.getByLabel('Deep Forest map')
  await expect(deepForest).toHaveAttribute('data-world-map', 'js-deep-forest')
  await expect(page.getByRole('heading', { name: 'JAVASCRIPT DEEP FOREST' })).toBeVisible()
  await expect(page.getByText('DEEP FOREST · 1 / 1', { exact: true })).toBeVisible()

  await page.reload()
  await expect(page.getByLabel('Deep Forest map')).toHaveAttribute('data-world-map', 'js-deep-forest')
})

test('Deep Forest最初のWoodsでBattle 15を固定導入しfilter()の条件差を説明する', async ({ page }) => {
  await seedDeepForestGate(page, true)
  await page.getByRole('button', { name: 'Move left' }).click()
  await expect(page.getByLabel('Deep Forest map')).toHaveAttribute('data-world-map', 'js-deep-forest')

  await page.getByRole('button', { name: 'Move up' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/15\?/)
  const story = page.getByRole('dialog', { name: '条件の向きが変わっても、全部を見る' })
  await expect(story).toBeVisible()
  await expect(story).toContainText('filter()')
  await expect(story).not.toContainText('Slime')
  await expect(story).not.toContainText('Boar')
  await expect(story).not.toContainText('Guardian')

  await story.getByRole('button', { name: /NEXT/ }).click()
  await expect(story).toContainText('HPが45未満')
  await expect(story).toContainText('HPが65より大きい')
})
