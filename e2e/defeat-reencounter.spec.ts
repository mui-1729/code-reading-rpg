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
  const fight = page.getByRole('button', { name: '戦う', exact: true })
  if ((await fight.getAttribute('aria-pressed')) !== 'true') await fight.click()
  const card = page.getByRole('button', { name: new RegExp(`^${name}\\b`) })
  await expect(card).toBeEnabled()
  await card.click()
  await expect(card).toHaveClass(/selected/)
  await card.click()
}

test('Random Encounter敗北後は安全なOverworld開始地点へ戻り、直後に再encounterしないsafe windowを得る', async ({ page }) => {
  await seedPostLessonEncounter(page)

  await page.getByRole('button', { name: '下へ移動' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/\d+\?/)
  await expect(page.locator('.battle-console')).toBeVisible()

  // Battle開始snapshotはencounterを発生させた移動後の座標 (10, 11) だが、
  // SAFE RETURNは同じ危険tileではなくOverworldの安全な開始地点へ退避する。
  await executeSkill(page, 'TRACE')
  await expect(page.getByText('敗北', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /チェックポイントへ戻る/ }).click()

  await expect(page).toHaveURL(/\/world$/)
  const viewport = page.getByLabel('ワールドマップ')
  await expect(viewport).toHaveAttribute('data-world-x', '20')
  await expect(viewport).toHaveAttribute('data-world-y', '14')

  // safe return resets the encounter counter, so one movement cannot
  // immediately throw the player back into another Random Encounter.
  await page.getByRole('button', { name: '下へ移動' }).click()
  await expect(page).toHaveURL(/\/world$/)
  await expect(page.locator('.battle-console')).toBeHidden()
})
