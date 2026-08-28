import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const clearedJavaScriptLessons = [
  7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
]

async function seedPostLessonEncounter(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, clearedLessons }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 0 },
            clearedStageIds: clearedLessons,
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 2, 4, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
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
            partyMemberIds: [],
            partyEquipment: {},
            worldMapId: 'overworld',
            worldPosition: { x: 10, y: 10 },
            stepsSinceEncounter: 4,
            encounterCount: 4,
            currentHp: 1,
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
      clearedLessons: clearedJavaScriptLessons,
    },
  )
  await page.goto('/world')
}

async function executeSkill(page: Page, name: string) {
  const card = page.getByRole('button', { name: new RegExp(`^${name}\\b`) })
  await expect(card).toBeEnabled()
  await card.click()
  await expect(card).toHaveClass(/selected/)
  await card.click()
}

test('Random Encounterで敗北後、Hub復帰して再びRandom Encounterできる', async ({ page }) => {
  await seedPostLessonEncounter(page)

  // count=4, next=(10,11), steps=5 は既存のdeterministic encounter fixture。
  await page.getByRole('button', { name: 'Move down' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/1\?/)

  // HP=1なので最初のenemy turnで敗北する。
  await executeSkill(page, 'TRACE')
  await expect(page.getByText('DEFEAT', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /RETURN TO HUB/ }).click()

  await expect(page).toHaveURL(/\/world$/)
  const viewport = page.getByLabel('Open world map')
  await expect(viewport).toHaveAttribute('data-world-x', '20')
  await expect(viewport).toHaveAttribute('data-world-y', '14')

  // defeat後はcount=5 / steps=8。Hubから西へ抜けてTall Grass (17,11) へ入ると
  // deterministic rollが18%未満になり、再びBattle 1が発生する。
  await page.getByRole('button', { name: 'Move left' }).click()
  await page.getByRole('button', { name: 'Move left' }).click()
  await page.getByRole('button', { name: 'Move left' }).click()
  await page.getByRole('button', { name: 'Move up' }).click()
  await page.getByRole('button', { name: 'Move up' }).click()
  await page.getByRole('button', { name: 'Move up' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/1\?/)
  await expect(page.getByText('CHAPTER 01', { exact: false })).toBeVisible()
})
