import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const initialSkills = [
  'trace',
  'pulse',
  'nova',
  'ts-scan',
  'ts-guard',
  'ts-label',
  'link',
  'fork',
]

async function seedFilterLesson(page: Page, clearedMidboss: boolean) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, skills, cleared13 }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 132,
            gold: 42,
            inventory: { patchKit: 0 },
            clearedStageIds: cleared13
              ? [7, 8, 9, 10, 11, 12, 13]
              : [7, 8, 9, 10, 11, 12],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            // #207時点のsave相当。Battle 14はrestore時にderived unlockする。
            unlockedStageIds: [1, 4, 7, 8, 9, 10, 11, 12, 13],
            unlockedSkillIds: skills,
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
            worldPosition: { x: 4, y: 10 },
            stepsSinceEncounter: 0,
            encounterCount: 5,
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
      skills: initialSkills,
      cleared13: clearedMidboss,
    },
  )
  await page.goto('/world')
}

test('Battle 13未clearでは西側Woodsへ入ってもfilter lessonを先取りしない', async ({ page }) => {
  await seedFilterLesson(page, false)

  await expect(page.getByLabel('Forest map')).toHaveAttribute('data-world-map', 'js-forest')
  await page.getByRole('button', { name: 'Move up' }).click()

  await expect(page).toHaveURL(/\/world$/)
  await expect(page.getByLabel('Forest map')).toHaveAttribute('data-world-x', '4')
  await expect(page.getByLabel('Forest map')).toHaveAttribute('data-world-y', '9')
})

test('Battle 13 clear済みsaveは西側WoodsでBattle 14を固定導入する', async ({ page }) => {
  await seedFilterLesson(page, true)

  await expect(page.getByText('FOREST · 4 / 4', { exact: true })).toBeVisible()
  await expect(page.getByText(/find\(\)とfilter\(\)の違いを読む/)).toBeVisible()

  await page.getByRole('button', { name: 'Move up' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/14\?/)
  const story = page.getByRole('dialog', { name: '最初の一体ではなく、全部を見る' })
  await expect(story).toBeVisible()
  await expect(story).toContainText('find()')
  await expect(story).not.toContainText('正解')

  await story.getByRole('button', { name: /NEXT/ }).click()
  await expect(story).toContainText('filter()')
  await expect(story).toContainText('全部集める')
})
