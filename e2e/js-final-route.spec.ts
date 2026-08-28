import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const baseCleared = [7, 8, 9, 10, 11, 12, 13, 14, 15]

async function seedWorld(
  page: Page,
  options: {
    clearedStageIds: number[]
    mapId: 'js-deep-forest' | 'overworld'
    position: { x: number; y: number }
  },
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, clearedStageIds, mapId, position }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 480,
            gold: 160,
            inventory: { patchKit: 2 },
            clearedStageIds,
            clearedAreaIds: [],
            completedSideQuestIds: [],
            // 古いv4 saveでもrestore時にclear済みstageから後続unlockを補完する。
            unlockedStageIds: [1, 4, 7, 8, 9, 10, 11, 12, 13, 14, 15],
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
              'echo',
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
            worldMapId: mapId,
            worldPosition: position,
            stepsSinceEncounter: 8,
            encounterCount: 12,
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
      clearedStageIds: options.clearedStageIds,
      mapId: options.mapId,
      position: options.position,
    },
  )
  await page.goto('/world')
}

test('Battle 15後のDeep ForestでBattle 16 map()を固定導入する', async ({ page }) => {
  await seedWorld(page, {
    clearedStageIds: baseCleared,
    mapId: 'js-deep-forest',
    position: { x: 24, y: 8 },
  })

  await page.getByRole('button', { name: 'Move left' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/16\?/)
  const story = page.getByRole('dialog', { name: '一つずつ、別の形へ変える' })
  await expect(story).toBeVisible()
  await expect(story).toContainText('map()')
  await expect(story).not.toContainText('Slime')
  await expect(story).not.toContainText('Goblin')
})

test('Battle 18後のDeep Forestで第二MID BOSS Battle 19を固定する', async ({ page }) => {
  await seedWorld(page, {
    clearedStageIds: [...baseCleared, 16, 17, 18],
    mapId: 'js-deep-forest',
    position: { x: 11, y: 9 },
  })

  await page.getByRole('button', { name: 'Move left' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/19\?/)
  const story = page.getByRole('dialog', { name: '新しい記号なしで読み切る' })
  await expect(story).toBeVisible()
  await expect(story).toContainText('新しいsyntaxはない')
  await expect(story).toContainText('some()')
  await expect(story).toContainText('every()')
})

test('最深部ではBattle 22 reduce()を固定導入する', async ({ page }) => {
  await seedWorld(page, {
    clearedStageIds: [...baseCleared, 16, 17, 18, 19, 20, 21],
    mapId: 'js-deep-forest',
    position: { x: 6, y: 9 },
  })

  await page.getByRole('button', { name: 'Move left' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/22\?/)
  const story = page.getByRole('dialog', { name: '途中結果を一つへまとめる' })
  await expect(story).toBeVisible()
  await expect(story).toContainText('reduce()')
  await expect(story).toContainText('best')
  await expect(story).not.toContainText('Guardian')
})

test('Battle 22前はJavaScript Final Boss 3へ挑戦できない', async ({ page }) => {
  await seedWorld(page, {
    clearedStageIds: [...baseCleared, 16, 17, 18, 19, 20, 21, 1, 2],
    mapId: 'overworld',
    position: { x: 8, y: 4 },
  })

  await page.getByRole('button', { name: 'Interact' }).click()

  await expect(page).toHaveURL(/\/world$/)
  await expect(page.getByText('Code Coreへ挑む前に、Deep ForestのLesson 15〜22を最後まで読み切ろう。')).toBeVisible()
})

test('Battle 22と既存Battle 1 / 2完了後だけFinal Boss 3を開始できる', async ({ page }) => {
  await seedWorld(page, {
    clearedStageIds: [...baseCleared, 16, 17, 18, 19, 20, 21, 22, 1, 2],
    mapId: 'overworld',
    position: { x: 8, y: 4 },
  })

  await page.getByRole('button', { name: 'Interact' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/3\?/)
  const story = page.getByRole('dialog', { name: 'Code Coreへ' })
  await expect(story).toBeVisible()
  await expect(story).toContainText('root cause')
})
