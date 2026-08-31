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
            exp: 12,
            gold: 20,
            inventory: { patchKit: 0 },
            clearedStageIds: [1],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 7],
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
            partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
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

test('first incident後にVillageで必要な読み方をBattle 7→8→9で確認しForest traceへ接続する', async ({ page }) => {
  await seedVillageTraining(page)

  const viewport = page.getByLabel('Village map')
  const objective = page.getByLabel('Next objective')
  await expect(viewport).toHaveAttribute('data-world-map', 'js-village')
  await expect(objective).toContainText('INCIDENT PREP · 1 / 3')
  await expect(objective).toContainText('HP条件')
  await expect(page.getByText('TRAIN', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'INTERACT' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/7\?/)
  const comparisonStory = page.getByRole('dialog', { name: 'まず、ログの数字を一つ読む' })
  await expect(comparisonStory).toBeVisible()
  await expect(comparisonStory).toContainText('enemy.hp')
  await comparisonStory.getByRole('button', { name: 'SKIP' }).click()

  await finishBattle(page, ['TRACE', 'NOVA', 'TRACE'])
  await expect(objective).toContainText('INCIDENT PREP · 2 / 3')
  await expect(objective).toContainText('name条件')
  expect((await storedProgress(page)).progress.clearedStageIds).toEqual([1, 7])
  expect((await storedProgress(page)).progress.unlockedStageIds).toContain(8)

  await page.getByRole('button', { name: 'INTERACT' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/8\?/)
  const equalityStory = page.getByRole('dialog', { name: 'ログにある名前の条件も読む' })
  await expect(equalityStory).toBeVisible()
  await expect(equalityStory).toContainText('enemy.name')
  await equalityStory.getByRole('button', { name: 'SKIP' }).click()

  await finishBattle(page, ['PULSE', 'NOVA', 'TRACE'])
  await expect(objective).toContainText('INCIDENT PREP · 3 / 3')
  await expect(objective).toContainText('selector')
  expect((await storedProgress(page)).progress.clearedStageIds).toEqual([1, 7, 8])
  expect((await storedProgress(page)).progress.unlockedStageIds).toContain(9)

  await page.getByRole('button', { name: 'INTERACT' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/9\?/)
  const findStory = page.getByRole('dialog', { name: '実際のselectorがどこで止まるか追う' })
  await expect(findStory).toBeVisible()
  await expect(findStory).toContainText('enemies')
  await findStory.getByRole('button', { name: /NEXT/ }).click()
  await expect(findStory).toContainText('find()')
  await findStory.getByRole('button', { name: 'SKIP' }).click()

  await finishBattle(page, ['PULSE', 'TRACE', 'NOVA', 'TRACE'])
  await expect(objective).toContainText('TRACE READY')
  await expect(objective).toContainText('最初のincidentの続きをForestへ追う')
  await expect(objective).toContainText('同じBattleをやり直すのではなく')

  const progress = await storedProgress(page)
  expect(progress.progress.clearedStageIds).toEqual([1, 7, 8, 9])
  expect(progress.progress.unlockedStageIds).toContain(10)
  expect(progress.progress.unlockedStageIds).not.toContain(2)

  await page.reload()
  await expect(page.getByLabel('Village map')).toHaveAttribute('data-world-map', 'js-village')
  await expect(page.getByLabel('Next objective')).toContainText('TRACE READY')
  await expect(page.getByLabel('Next objective')).toContainText('FOREST')
})
