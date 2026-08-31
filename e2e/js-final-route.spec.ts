import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const throughDeepFilter = [7, 8, 9, 1, 10, 11, 12, 13, 14, 2, 15]
const throughBattle21 = [...throughDeepFilter, 16, 17, 18, 19, 20, 21]
const throughDeepForest = [...throughBattle21, 22]

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
            unlockedStageIds: [7],
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

test('Battle 15後のDeep ForestでBattle 16 map()をtrace変換として固定導入する', async ({ page }) => {
  await seedWorld(page, {
    clearedStageIds: throughDeepFilter,
    mapId: 'js-deep-forest',
    position: { x: 24, y: 8 },
  })

  await page.getByRole('button', { name: 'Move left' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/16\?/)
  const story = page.getByRole('dialog', { name: '同じEnemyが別の形で渡されている' })
  await expect(story).toBeVisible()
  await expect(story).toContainText('trace')
  await expect(story).toContainText('{ enemy, hp }')
  await expect(story).not.toContainText('Slime')
  await expect(story).not.toContainText('Goblin')

  await story.getByRole('button', { name: /NEXT/ }).click()
  await expect(story).toContainText('map()')
  await expect(story).toContainText('新しい配列')
})

test('Battle 18後のDeep ForestでRoot Guardian Battle 19を固定する', async ({ page }) => {
  await seedWorld(page, {
    clearedStageIds: [...throughDeepFilter, 16, 17, 18],
    mapId: 'js-deep-forest',
    position: { x: 11, y: 9 },
  })

  await page.getByRole('button', { name: 'Move left' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/19\?/)
  const story = page.getByRole('dialog', { name: 'Root Guardianのjunctionを突破する' })
  await expect(story).toBeVisible()
  await expect(story).toContainText('incident')
  await expect(story).toContainText('junction')

  await story.getByRole('button', { name: /NEXT/ }).click()
  await expect(story).toContainText('新しいsyntaxはない')
  await expect(story).toContainText('some()')
  await expect(story).toContainText('every()')
})

test('最深部ではBattle 22 reduce()をfinal traceとして固定導入する', async ({ page }) => {
  await seedWorld(page, {
    clearedStageIds: throughBattle21,
    mapId: 'js-deep-forest',
    position: { x: 6, y: 9 },
  })

  await page.getByRole('button', { name: 'Move left' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/22\?/)
  const story = page.getByRole('dialog', { name: '複数の候補が最後に一つへ集約される' })
  await expect(story).toBeVisible()
  await expect(story).toContainText('best')
  await expect(story).toContainText('Deep Forest最後のtrace')
  await expect(story).not.toContainText('Guardian')

  await story.getByRole('button', { name: /NEXT/ }).click()
  await expect(story).toContainText('reduce()')
  await expect(story).toContainText('attackDamage')
})

test('Battle 22前はJavaScript Final Boss 3へ挑戦できない', async ({ page }) => {
  await seedWorld(page, {
    clearedStageIds: throughBattle21,
    mapId: 'overworld',
    position: { x: 8, y: 4 },
  })

  await page.getByRole('button', { name: 'Interact' }).click()

  await expect(page).toHaveURL(/\/world$/)
  await expect(
    page.getByText('Code Coreへ挑む前に、Deep Forestのtraceをroot causeまで最後まで追おう。'),
  ).toBeVisible()
})

test('incident routeとBattle 22完了後にFinal Boss 3を開始できる', async ({ page }) => {
  await seedWorld(page, {
    clearedStageIds: throughDeepForest,
    mapId: 'overworld',
    position: { x: 8, y: 4 },
  })

  await page.getByRole('button', { name: 'Interact' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/3\?/)
  const story = page.getByRole('dialog', { name: 'Code Coreへ' })
  await expect(story).toBeVisible()
  await expect(story).toContainText('ROOT CAUSE')
  await expect(story).toContainText('二つの症状')
})
