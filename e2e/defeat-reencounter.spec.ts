import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const clearedJavaScriptRoute = [
  1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15, 16, 17, 18, 19, 20, 21, 22, 3,
]

async function seedPostLessonEncounter(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, clearedRoute }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 0 },
            clearedStageIds: clearedRoute,
            clearedAreaIds: ['javascript'],
            completedSideQuestIds: [],
            unlockedStageIds: [7],
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
      clearedRoute: clearedJavaScriptRoute,
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

test('Random Encounter敗北後は開始地点へ戻り、直後に再encounterしないsafe windowを得る', async ({ page }) => {
  await seedPostLessonEncounter(page)

  await page.getByRole('button', { name: 'Move down' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/\d+\?/)
  await expect(page.locator('.battle-console')).toBeVisible()

  // Battle開始snapshotはencounterを発生させた移動後の座標 (10, 11)。
  await executeSkill(page, 'TRACE')
  await expect(page.getByText('DEFEAT', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /RETURN TO CHECKPOINT/ }).click()

  await expect(page).toHaveURL(/\/world$/)
  const viewport = page.getByLabel('Open world map')
  await expect(viewport).toHaveAttribute('data-world-x', '10')
  await expect(viewport).toHaveAttribute('data-world-y', '11')

  // checkpoint return resets the encounter counter, so one movement cannot
  // immediately throw the player back into another Random Encounter.
  await page.getByRole('button', { name: 'Move down' }).click()
  await expect(page).toHaveURL(/\/world$/)
  await expect(page.locator('.battle-console')).toBeHidden()
})
