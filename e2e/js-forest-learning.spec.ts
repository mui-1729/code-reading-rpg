import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const initialSkills = ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label']

async function seedForestGate(page: Page, clearedTraining: boolean) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, skills, cleared }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: cleared ? 24 : 16,
            gold: 0,
            inventory: { patchKit: 0 },
            clearedStageIds: cleared ? [7, 8, 9] : [7, 8],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            // #203時点のsave相当。Battle 10はまだ存在しないためrestoreで補完する。
            unlockedStageIds: [1, 4, 7, 8, 9],
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
            worldMapId: 'overworld',
            worldPosition: { x: 8, y: 14 },
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
      cleared: clearedTraining,
    },
  )
  await page.goto('/world')
}

test('Training 9未clearではForest入口が閉じている', async ({ page }) => {
  await seedForestGate(page, false)

  await expect(page.getByLabel('Open world map')).toHaveAttribute('data-world-map', 'overworld')
  await page.getByRole('button', { name: 'Move left' }).click()

  await expect(page.getByLabel('Open world map')).toHaveAttribute('data-world-map', 'overworld')
  await expect(page.getByText(/GREENFIELD VILLAGEのTRAINを3つ終わらせよう/)).toBeVisible()
})

test('Training完了後はForestへ入りreload後もlocal mapを保持する', async ({ page }) => {
  await seedForestGate(page, true)

  await page.getByRole('button', { name: 'Move left' }).click()
  const forest = page.getByLabel('Forest map')
  await expect(forest).toHaveAttribute('data-world-map', 'js-forest')
  await expect(page.getByRole('heading', { name: 'JAVASCRIPT FOREST' })).toBeVisible()
  await expect(page.getByText('FOREST · 1 / 4', { exact: true })).toBeVisible()
  await expect(page.getByText(/&& — 二つともtrueを読む/)).toBeVisible()

  await page.reload()
  await expect(page.getByLabel('Forest map')).toHaveAttribute('data-world-map', 'js-forest')
  await expect(page.getByRole('heading', { name: 'JAVASCRIPT FOREST' })).toBeVisible()
})

test('Forest最初のWoodsはRandom抽選ではなくBattle 10の固定Lessonになる', async ({ page }) => {
  await seedForestGate(page, true)

  await page.getByRole('button', { name: 'Move left' }).click()
  await expect(page.getByLabel('Forest map')).toHaveAttribute('data-world-map', 'js-forest')

  await page.getByRole('button', { name: 'Move left' }).click()
  await page.getByRole('button', { name: 'Move left' }).click()
  await page.getByRole('button', { name: 'Move left' }).click()
  await page.getByRole('button', { name: 'Move up' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/10\?/)
  await expect(page.getByRole('dialog', { name: '二つともtrueなら通る' })).toBeVisible()
})

test('Forest Battle 10 / 11は初心者Storyで&& / ||を順に説明しfilterを先取りしない', async ({ page }) => {
  await seedForestGate(page, true)

  await page.goto('/javascript/battle/10?seed=forest-e2e-and&returnTo=%2Fworld')
  const andStory = page.getByRole('dialog', { name: '二つともtrueなら通る' })
  await expect(andStory).toBeVisible()
  await expect(andStory).toContainText('&&')
  await expect(andStory).not.toContainText('filter()')
  await andStory.getByRole('button', { name: /NEXT/ }).click()
  await expect(andStory).toContainText('左もtrue、右もtrue')
  await expect(andStory).not.toContainText('filter()')

  await page.goto('/javascript/battle/11?seed=forest-e2e-or&returnTo=%2Fworld')
  const orStory = page.getByRole('dialog', { name: 'どちらかtrueなら通る' })
  await expect(orStory).toBeVisible()
  await expect(orStory).toContainText('||')
  await expect(orStory).not.toContainText('filter()')
  await orStory.getByRole('button', { name: /NEXT/ }).click()
  await expect(orStory).toContainText('どちらか一方でもtrue')
  await expect(orStory).not.toContainText('filter()')
})
