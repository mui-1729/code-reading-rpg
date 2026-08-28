import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const initialSkills = ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label']

async function seedVillageTraining(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, skills }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 0 },
            clearedStageIds: [],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            // #203以前の現行save相当。restore時にTraining 7がbaselineとして補われる。
            unlockedStageIds: [1, 4],
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
            partyMemberIds: [],
            partyEquipment: {},
            worldMapId: 'js-village',
            worldPosition: { x: 11, y: 7 },
            stepsSinceEncounter: 8,
            encounterCount: 0,
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

async function finishBattle(page: Page, skills: string[]) {
  for (const skill of skills) {
    if (await page.getByText('VICTORY', { exact: true }).isVisible()) break
    await executeSkill(page, skill)
  }
  await expect(page.getByText('VICTORY', { exact: true })).toBeVisible()

  const skip = page.getByRole('button', { name: 'SKIP' }).last()
  if (await skip.isVisible()) await skip.click()
  await page.getByRole('button', { name: /RETURN TO WORLD/ }).click()
  await expect(page).toHaveURL(/\/world$/)
}

async function storedProgress(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), PROGRESS_KEY)
}

test('Village TRAINで初心者Storyを読みながらBattle 7→8→9を順にclearする', async ({ page }) => {
  await seedVillageTraining(page)

  const viewport = page.getByLabel('Village map')
  await expect(viewport).toHaveAttribute('data-world-map', 'js-village')
  await expect(page.getByText('TRAINING · 1 / 3', { exact: true })).toBeVisible()
  await expect(page.getByText('TRAIN', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'INTERACT' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/7\?/)
  const comparisonStory = page.getByRole('dialog', { name: 'まず、数字を一つ読む' })
  await expect(comparisonStory).toBeVisible()
  await expect(comparisonStory).toContainText('enemy.hp')
  await comparisonStory.getByRole('button', { name: 'SKIP' }).click()

  // NOVAで高HP敵を削ると60未満になり、次はTRACEの条件へ入る。
  await finishBattle(page, ['TRACE', 'NOVA', 'TRACE'])
  await expect(page.getByText('TRAINING · 2 / 3', { exact: true })).toBeVisible()
  expect((await storedProgress(page)).progress.clearedStageIds).toEqual([7])
  expect((await storedProgress(page)).progress.unlockedStageIds).toEqual([1, 4, 7, 8])

  await page.getByRole('button', { name: 'INTERACT' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/8\?/)
  const equalityStory = page.getByRole('dialog', { name: '文字も値として読む' })
  await expect(equalityStory).toBeVisible()
  await expect(equalityStory).toContainText('enemy.name')
  await equalityStory.getByRole('button', { name: 'SKIP' }).click()

  await finishBattle(page, ['PULSE', 'NOVA', 'TRACE'])
  await expect(page.getByText('TRAINING · 3 / 3', { exact: true })).toBeVisible()
  expect((await storedProgress(page)).progress.clearedStageIds).toEqual([7, 8])
  expect((await storedProgress(page)).progress.unlockedStageIds).toEqual([1, 4, 7, 8, 9])

  await page.getByRole('button', { name: 'INTERACT' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/9\?/)
  const findStory = page.getByRole('dialog', { name: '前から探して、最初で止まる' })
  await expect(findStory).toBeVisible()
  await expect(findStory).toContainText('enemies')
  await expect(findStory).toContainText('find()')
  await findStory.getByRole('button', { name: 'SKIP' }).click()

  await finishBattle(page, ['PULSE', 'TRACE', 'NOVA', 'TRACE'])
  await expect(page.getByText('TRAINING COMPLETE', { exact: true })).toBeVisible()

  const progress = await storedProgress(page)
  expect(progress.progress.exp).toBe(24)
  expect(progress.progress.gold).toBe(0)
  expect(progress.progress.clearedStageIds).toEqual([7, 8, 9])
  expect(progress.progress.unlockedStageIds).toEqual([1, 4, 7, 8, 9])
})
