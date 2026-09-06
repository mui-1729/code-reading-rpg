import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

type MidbossProgress = 'locked' | 'ready' | 'cleared'

async function seedMidboss(page: Page, state: MidbossProgress) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, midbossState }) => {
      localStorage.clear()
      const clearedStageIds =
        midbossState === 'locked'
          ? [1, 7, 8, 9, 10, 11]
          : midbossState === 'ready'
            ? [1, 7, 8, 9, 10, 11, 12]
            : [1, 7, 8, 9, 10, 11, 12, 13]

      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 96,
            gold: 24,
            inventory: { patchKit: 0 },
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
            worldMapId: 'js-forest',
            worldPosition: { x: 6, y: 10 },
            stepsSinceEncounter: 8,
            encounterCount: 4,
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
      midbossState: state,
    },
  )
  await page.goto('/world')
}

async function faceMidboss(page: Page) {
  await page.getByRole('button', { name: '左へ移動' }).click()
  await expect(page.locator('.world-player-sprite')).toHaveAttribute('data-facing', 'left')
}

test('Battle 12未clearではForest MID BOSSを開始できない', async ({ page }) => {
  await seedMidboss(page, 'locked')

  await expect(page.getByLabel('JavaScriptの森のマップ')).toHaveAttribute('data-world-map', 'js-forest')
  await expect(page.getByLabel('JavaScriptの森 中ボス')).toBeVisible()
  await faceMidboss(page)
  await page.getByRole('button', { name: '中ボスを調べる' }).click()

  await expect(page).toHaveURL(/\/world$/)
  await expect(page.getByText(/JavaScriptの森で条件の経路を最後まで追おう/)).toBeVisible()
})

test('Battle 12 clear済みsaveはtrace-blocked objectiveからBattle 13へ進める', async ({ page }) => {
  await seedMidboss(page, 'ready')

  await expect(page.getByLabel('次の目的')).toContainText('経路封鎖')
  await expect(page.getByLabel('次の目的')).toContainText('経路を塞ぐ守り人を突破する')
  await expect(page.getByLabel('JavaScriptの森 中ボス')).toBeVisible()

  await faceMidboss(page)
  await page.getByRole('button', { name: '中ボスに挑む' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/13\?/)
  const story = page.getByRole('dialog', { name: '異常の経路を守る相手を越える' })
  await expect(story).toBeVisible()
  await expect(story).toContainText('trace')
  await expect(story).not.toContainText('filter()')

  await story.getByRole('button', { name: /次へ/ }).click()
  await expect(story).toContainText('find()')
  await expect(story).toContainText('&&')
  await expect(story).toContainText('||')
  await expect(story).not.toContainText('filter()')
})

test('Battle 13 clear後は守り人がいたmain trailを西へ通過できimpact range調査へ進む', async ({ page }) => {
  await seedMidboss(page, 'cleared')

  const forest = page.getByLabel('JavaScriptの森のマップ')
  await expect(forest).toHaveAttribute('data-world-x', '6')
  await expect(page.getByLabel('次の目的')).toContainText('影響範囲')
  await expect(page.getByLabel('次の目的')).toContainText('複数の対象へ広がる影響')

  await page.getByRole('button', { name: '左へ移動' }).click()

  await expect(page).toHaveURL(/\/world$/)
  await expect(forest).toHaveAttribute('data-world-x', '5')
  await expect(forest).toHaveAttribute('data-world-y', '10')
})
