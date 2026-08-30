import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const initialSkills = ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label']

type ForestGateState = 'training-incomplete' | 'incident-pending' | 'incident-cleared'

async function seedForestGate(page: Page, state: ForestGateState) {
  const clearedStageIds =
    state === 'training-incomplete' ? [7, 8] : state === 'incident-pending' ? [7, 8, 9] : [7, 8, 9, 1]

  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, skills, cleared }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: cleared.includes(1) ? 64 : cleared.length * 8,
            gold: cleared.includes(1) ? 20 : 0,
            inventory: { patchKit: 0 },
            clearedStageIds: cleared,
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [7],
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
      cleared: clearedStageIds,
    },
  )
  await page.goto('/world')
}

test('Training 9未clearではForest入口が閉じている', async ({ page }) => {
  await seedForestGate(page, 'training-incomplete')

  await expect(page.getByLabel('Open world map')).toHaveAttribute('data-world-map', 'overworld')
  await page.getByRole('button', { name: 'Move left' }).click()

  await expect(page.getByLabel('Open world map')).toHaveAttribute('data-world-map', 'overworld')
  await expect(page.getByText(/Villageでincident codeに必要な3つの読み方/)).toBeVisible()
})

test('Training完了だけではForestへ入れずfirst incidentの再現を要求する', async ({ page }) => {
  await seedForestGate(page, 'incident-pending')

  await page.getByRole('button', { name: 'Move left' }).click()

  await expect(page.getByLabel('Open world map')).toHaveAttribute('data-world-map', 'overworld')
  await expect(page.getByText(/草原で最初のtarget異常を実際に再現/)).toBeVisible()
})

test('first incident完了後はForestへ入りreload後もlocal mapを保持する', async ({ page }) => {
  await seedForestGate(page, 'incident-cleared')

  await page.getByRole('button', { name: 'Move left' }).click()
  const forest = page.getByLabel('Forest map')
  await expect(forest).toHaveAttribute('data-world-map', 'js-forest')
  await expect(page.getByRole('heading', { name: 'JAVASCRIPT FOREST' })).toBeVisible()
  await expect(page.getByLabel('Next objective')).toContainText('FOLLOW TRACE · 1')
  await expect(page.getByLabel('Next objective')).toContainText('二つの条件を両方通る枝')

  await page.reload()
  await expect(page.getByLabel('Forest map')).toHaveAttribute('data-world-map', 'js-forest')
  await expect(page.getByRole('heading', { name: 'JAVASCRIPT FOREST' })).toBeVisible()
})

test('Forest最初のWoodsはRandom抽選ではなくBattle 10の固定traceになる', async ({ page }) => {
  await seedForestGate(page, 'incident-cleared')

  await page.getByRole('button', { name: 'Move left' }).click()
  await expect(page.getByLabel('Forest map')).toHaveAttribute('data-world-map', 'js-forest')

  await page.getByRole('button', { name: 'Move left' }).click()
  await page.getByRole('button', { name: 'Move left' }).click()
  await page.getByRole('button', { name: 'Move left' }).click()
  await page.getByRole('button', { name: 'Move up' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/10\?/)
  await expect(page.getByRole('dialog', { name: '二つの条件を通る経路を追う' })).toBeVisible()
})

test('Forest Battle 10 / 11はincident traceとして&& / ||を順に説明しfilterを先取りしない', async ({ page }) => {
  await seedForestGate(page, 'incident-cleared')

  await page.goto('/javascript/battle/10?seed=forest-e2e-and&returnTo=%2Fworld')
  const andStory = page.getByRole('dialog', { name: '二つの条件を通る経路を追う' })
  await expect(andStory).toBeVisible()
  await expect(andStory).toContainText('&&')
  await expect(andStory).toContainText('trace')
  await expect(andStory).not.toContainText('filter()')
  await andStory.getByRole('button', { name: /NEXT/ }).click()
  await expect(andStory).toContainText('左もtrue、右もtrue')
  await expect(andStory).not.toContainText('filter()')

  await page.evaluate((progressKey) => {
    const stored = JSON.parse(localStorage.getItem(progressKey) ?? 'null')
    stored.progress.clearedStageIds = [...new Set([...stored.progress.clearedStageIds, 10])]
    localStorage.setItem(progressKey, JSON.stringify(stored))
  }, PROGRESS_KEY)

  await page.goto('/javascript/battle/11?seed=forest-e2e-or&returnTo=%2Fworld')
  const orStory = page.getByRole('dialog', { name: '別の入口からも同じ異常へ入る' })
  await expect(orStory).toBeVisible()
  await expect(orStory).toContainText('||')
  await expect(orStory).not.toContainText('filter()')
  await orStory.getByRole('button', { name: /NEXT/ }).click()
  await expect(orStory).toContainText('どちらか一つでもtrue')
  await expect(orStory).not.toContainText('filter()')
})
