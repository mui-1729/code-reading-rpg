import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

type MidbossProgress = 'locked' | 'ready' | 'cleared'

async function seedMidboss(page: Page, state: MidbossProgress) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, midbossState }) => {
      localStorage.clear()
      const clearedStageIds =
        midbossState === 'locked'
          ? [7, 8, 9, 10, 11]
          : midbossState === 'ready'
            ? [7, 8, 9, 10, 11, 12]
            : [7, 8, 9, 10, 11, 12, 13]

      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 96,
            gold: 24,
            inventory: { patchKit: 0 },
            clearedStageIds,
            clearedAreaIds: [],
            completedSideQuestIds: [],
            // #205時点のsave相当。12 clear済みならrestoreで13 unlockを補完する。
            unlockedStageIds: [1, 4, 7, 8, 9, 10, 11, 12],
            unlockedSkillIds: [
              'trace',
              'pulse',
              'nova',
              'ts-scan',
              'ts-guard',
              'ts-label',
              'link',
              'fork',
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
            worldPosition: { x: 6, y: 10 },
            stepsSinceEncounter: 8,
            encounterCount: 4,
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
      midbossState: state,
    },
  )
  await page.goto('/world')
}

test('Battle 12未clearではForest MID BOSSを開始できない', async ({ page }) => {
  await seedMidboss(page, 'locked')

  await expect(page.getByLabel('Forest map')).toHaveAttribute('data-world-map', 'js-forest')
  await expect(page.getByLabel('JavaScript Forest Mid-Boss')).toBeVisible()
  await page.getByRole('button', { name: 'INTERACT' }).click()

  await expect(page).toHaveURL(/\/world$/)
  await expect(page.getByText(/Lesson 10〜12を終わらせよう/)).toBeVisible()
})

test('Battle 12 clear済みsaveはMID BOSS objectiveからBattle 13へ進める', async ({ page }) => {
  await seedMidboss(page, 'ready')

  await expect(page.getByText('FOREST MID-BOSS', { exact: true })).toBeVisible()
  await expect(page.getByText(/今までの読み方だけで守り人へ挑む/)).toBeVisible()
  await expect(page.getByLabel('JavaScript Forest Mid-Boss')).toBeVisible()

  await page.getByRole('button', { name: 'INTERACT' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/13\?/)
  const story = page.getByRole('dialog', { name: '今までの読み方だけで進む' })
  await expect(story).toBeVisible()
  await expect(story).toContainText('find()')
  await expect(story).toContainText('&&')
  await expect(story).toContainText('||')
  await expect(story).not.toContainText('filter()')
})

test('Battle 13 clear後は守り人がいたmain trailを西へ通過できる', async ({ page }) => {
  await seedMidboss(page, 'cleared')

  const forest = page.getByLabel('Forest map')
  await expect(forest).toHaveAttribute('data-world-x', '6')
  await expect(page.getByText('FOREST MID-BOSS CLEAR', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Move left' }).click()

  await expect(page).toHaveURL(/\/world$/)
  await expect(forest).toHaveAttribute('data-world-x', '5')
  await expect(forest).toHaveAttribute('data-world-y', '10')
})
