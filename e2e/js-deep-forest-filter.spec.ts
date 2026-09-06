import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

type DeepForestState = 'filter-locked' | 'incident-pending' | 'incident-cleared'

async function seedDeepForestGate(page: Page, state: DeepForestState) {
  const clearedStageIds =
    state === 'filter-locked'
      ? [7, 8, 9, 1, 10, 11, 12, 13]
      : state === 'incident-pending'
        ? [7, 8, 9, 1, 10, 11, 12, 13, 14]
        : [7, 8, 9, 1, 10, 11, 12, 13, 14, 2]

  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, cleared }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 160,
            gold: 54,
            inventory: { patchKit: 0 },
            clearedStageIds: cleared,
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
            worldPosition: { x: 2, y: 10 },
            stepsSinceEncounter: 0,
            encounterCount: 6,
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
      cleared: clearedStageIds,
    },
  )
  await page.goto('/world')
}

async function waitForMapTransition(page: Page) {
  await expect(page.locator('.world-map-transition')).toHaveCount(0, { timeout: 1_000 })
  await expect(page.locator('body')).not.toHaveAttribute('data-world-transitioning', 'true', { timeout: 1_000 })
}

test('Battle 14未clearではDeep Forest入口が閉じている', async ({ page }) => {
  await seedDeepForestGate(page, 'filter-locked')

  const forest = page.getByLabel('JavaScriptの森のマップ')
  await expect(forest).toHaveAttribute('data-world-map', 'js-forest')
  await page.getByRole('button', { name: '左へ移動' }).click()

  await expect(page.getByLabel('JavaScriptの森のマップ')).toHaveAttribute('data-world-map', 'js-forest')
  await expect(page.getByLabel('JavaScriptの森のマップ')).toHaveAttribute('data-world-x', '2')
})

test('Battle 14 clear後はDeep Forestへ入り、! → swirlを挟んでsecond incident Battle 2を固定再現する', async ({ page }) => {
  await seedDeepForestGate(page, 'incident-pending')

  await expect(page.getByLabel('次の目的')).toContainText('二つ目の症状')
  await page.getByRole('button', { name: '左へ移動' }).click()

  const deepForest = page.getByLabel('JavaScript深層の森のマップ')
  await expect(deepForest).toHaveAttribute('data-world-map', 'js-deep-forest')
  await expect(page.locator('.world-header')).toBeHidden()
  await expect(page.getByLabel('次の目的')).toContainText('二つ目の症状')
  await waitForMapTransition(page)

  await page.getByRole('button', { name: '上へ移動' }).click()

  await expect(page.locator('body')).toHaveAttribute('data-world-encounter-cue', 'alert')
  await expect(page).toHaveURL(/\/world$/)
  const cueVisual = await page.locator('.world-player-sprite').evaluate((player) => {
    const style = getComputedStyle(player, '::before')
    return { content: style.content, fontSize: Number.parseFloat(style.fontSize) }
  })
  expect(cueVisual.content).toBe('"!"')
  expect(cueVisual.fontSize).toBeGreaterThanOrEqual(22)
  await expect(page.getByRole('button', { name: 'メニューを開く' })).toBeDisabled()
  await expect(page.locator('.world-message')).not.toContainText('敵と遭遇！')

  const cuePosition = await deepForest.evaluate((element) => ({
    x: element.getAttribute('data-world-x'),
    y: element.getAttribute('data-world-y'),
  }))
  await page.keyboard.press('ArrowRight')
  await expect(deepForest).toHaveAttribute('data-world-x', cuePosition.x ?? '')
  await expect(deepForest).toHaveAttribute('data-world-y', cuePosition.y ?? '')

  await expect(page.locator('body')).toHaveAttribute('data-world-encounter-cue', 'transition')
  await expect(page).toHaveURL(/\/world$/)
  const transitionVisual = await deepForest.evaluate((viewport) => {
    const style = getComputedStyle(viewport, '::after')
    return { animationName: style.animationName, backgroundImage: style.backgroundImage }
  })
  expect(transitionVisual.animationName).toBe('world-encounter-swirl')
  expect(transitionVisual.backgroundImage).toContain('conic-gradient')
  await expect(page.getByRole('button', { name: 'メニューを開く' })).toBeDisabled()

  await expect(page).toHaveURL(/\/javascript\/battle\/2\?/, { timeout: 2_000 })
  const story = page.getByRole('dialog', { name: '異常が複数targetへ広がっている' })
  await expect(story).toBeVisible()
  await expect(story).toContainText('複数')
  await expect(story).toContainText('別症状')

  await story.getByRole('button', { name: /次へ/ }).click()
  await expect(story).toContainText('filter()')
  await expect(story).toContainText('&&')
  await expect(story).toContainText('||')
})

test('reduced-motionでも! cueの意味を残し、回転せず短いfadeからBattle 2へ進む', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedDeepForestGate(page, 'incident-pending')
  await page.getByRole('button', { name: '左へ移動' }).click()
  const deepForest = page.getByLabel('JavaScript深層の森のマップ')
  await expect(deepForest).toHaveAttribute('data-world-map', 'js-deep-forest')
  await waitForMapTransition(page)

  await page.getByRole('button', { name: '上へ移動' }).click()

  await expect(page.locator('body')).toHaveAttribute('data-world-encounter-cue', 'alert')
  const cueVisual = await page.locator('.world-player-sprite').evaluate((player) => {
    const style = getComputedStyle(player, '::before')
    return { content: style.content, animationName: style.animationName }
  })
  expect(cueVisual.content).toBe('"!"')
  expect(cueVisual.animationName).toBe('none')

  await expect(page.locator('body')).toHaveAttribute('data-world-encounter-cue', 'transition')
  const transitionVisual = await deepForest.evaluate((viewport) => {
    const style = getComputedStyle(viewport, '::after')
    return { animationName: style.animationName, backgroundImage: style.backgroundImage }
  })
  expect(transitionVisual.animationName).toBe('world-encounter-reduced-fade')
  expect(transitionVisual.backgroundImage).toBe('none')
  await expect(page).toHaveURL(/\/javascript\/battle\/2\?/, { timeout: 2_000 })
})

test('second incident clear後はDeep ForestでBattle 15を固定導入し共有traceを追う', async ({ page }) => {
  await seedDeepForestGate(page, 'incident-cleared')
  await page.getByRole('button', { name: '左へ移動' }).click()
  await expect(page.getByLabel('JavaScript深層の森のマップ')).toHaveAttribute('data-world-map', 'js-deep-forest')
  await expect(page.getByLabel('次の目的')).toContainText('共通経路 · FILTER')
  await waitForMapTransition(page)

  await page.getByRole('button', { name: '上へ移動' }).click()

  await expect(page).toHaveURL(/\/javascript\/battle\/15\?/)
  const story = page.getByRole('dialog', { name: '同じfilter()でも条件が変わる' })
  await expect(story).toBeVisible()
  await expect(story).toContainText('filter()')
  await expect(story).toContainText('二つ目の症状')
  await expect(story).not.toContainText('Slime')
  await expect(story).not.toContainText('Boar')
  await expect(story).not.toContainText('Guardian')

  await story.getByRole('button', { name: /次へ/ }).click()
  await expect(story).toContainText('HPが45未満')
  await expect(story).toContainText('HPが65より大きい')
})
