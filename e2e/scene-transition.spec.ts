import { expect, test, type Page } from '@playwright/test'
import { JS_BOSS_PREREQS, JS_FIRST_INCIDENT } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'
const OPENING_KEY = 'code-read-rpg:javascript-opening:v1'

const skills = ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label']

type TimelineEntry = {
  kind: string | null
  phase: string | null
  path: string
  layer: string | null
}

type TimelineWindow = Window & {
  __sceneTransitionTimeline?: TimelineEntry[]
  __sceneTransitionObserver?: MutationObserver
}

async function installTimeline(page: Page) {
  await page.evaluate(() => {
    const state = window as TimelineWindow
    state.__sceneTransitionObserver?.disconnect()
    state.__sceneTransitionTimeline = []

    const record = () => {
      const transition = document.querySelector<HTMLElement>('.scene-transition')
      state.__sceneTransitionTimeline?.push({
        kind: transition?.dataset.sceneTransitionKind ?? null,
        phase: transition?.dataset.sceneTransitionPhase ?? null,
        path: window.location.pathname,
        layer: document.querySelector<HTMLElement>('.opening-scene')?.dataset.storyLayer ?? null,
      })
    }

    const observer = new MutationObserver(record)
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-scene-transition-phase'],
    })
    state.__sceneTransitionObserver = observer
    record()
  })
}

async function readTimeline(page: Page) {
  return page.evaluate(() => (
    (window as TimelineWindow).__sceneTransitionTimeline ?? []
  ))
}

function expectOrderedSwap(
  entries: TimelineEntry[],
  kind: string,
  before: Pick<TimelineEntry, 'path'> & Partial<Pick<TimelineEntry, 'layer'>>,
  after: Pick<TimelineEntry, 'path'> & Partial<Pick<TimelineEntry, 'layer'>>,
) {
  const coveringIndex = entries.findIndex((entry) =>
    entry.kind === kind &&
    entry.phase === 'covering' &&
    entry.path === before.path &&
    (before.layer === undefined || entry.layer === before.layer),
  )
  const revealingIndex = entries.findIndex((entry) =>
    entry.kind === kind &&
    entry.phase === 'revealing' &&
    entry.path === after.path &&
    (after.layer === undefined || entry.layer === after.layer),
  )

  expect(coveringIndex).toBeGreaterThanOrEqual(0)
  expect(revealingIndex).toBeGreaterThan(coveringIndex)
}

async function seedWorld(
  page: Page,
  options: {
    mapId: string
    position: { x: number; y: number }
    clearedStageIds: readonly number[]
    currentHp?: number
  },
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, openingKey, seededSkills, state }) => {
      localStorage.clear()
      localStorage.setItem(openingKey, 'seen')
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 20,
          inventory: { patchKit: 0 },
          clearedStageIds: [...state.clearedStageIds],
          clearedAreaIds: state.clearedStageIds.includes(3) ? ['javascript'] : [],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 7],
          unlockedSkillIds: seededSkills,
        },
      }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 4,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: ['byte'],
          partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
          worldMapId: state.mapId,
          worldPosition: state.position,
          stepsSinceEncounter: 8,
          encounterCount: 5,
          currentHp: state.currentHp ?? 100,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      openingKey: OPENING_KEY,
      seededSkills: skills,
      state: options,
    },
  )
  await page.goto('/world')
}

test('OpeningはREAL→CONNECTを強いvariantで覆い、最終Story→Worldもcover後に切り替える', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((key) => localStorage.removeItem(key), OPENING_KEY)
  await page.reload()

  await page.getByRole('button', { name: 'はじめる' }).click()
  await page.getByRole('button', { name: '次へ ▶' }).click()
  await expect(page.locator('.opening-layer-badge')).toHaveText('REAL WORLD')

  await installTimeline(page)
  await page.getByRole('button', { name: '次へ ▶' }).click()
  await expect(page.locator('.opening-layer-badge')).toHaveText('CONNECT')
  await expect(page.locator('.scene-transition')).toHaveCount(0)

  let entries = await readTimeline(page)
  expectOrderedSwap(entries, 'connect', { path: '/', layer: 'real-world' }, { path: '/', layer: 'connect' })

  await page.getByRole('button', { name: '次へ ▶' }).click()
  await page.getByRole('button', { name: '次へ ▶' }).click()
  await expect(page.locator('.opening-kicker')).toHaveText('MISSION START')

  await installTimeline(page)
  await page.getByRole('button', { name: '▶ CODE WORLDを探索する' }).click()
  await expect(page).toHaveURL(/\/world$/)
  await expect(page.locator('.scene-transition')).toHaveCount(0)

  entries = await readTimeline(page)
  expectOrderedSwap(entries, 'story-to-world', { path: '/', layer: 'code-world' }, { path: '/world' })
})

test('Village fixed Battleはbattle-startでWorldを覆ってからBattleへ入る', async ({ page }) => {
  await seedWorld(page, {
    mapId: 'js-village',
    position: { x: 11, y: 7 },
    clearedStageIds: [1],
  })

  await page.getByRole('button', { name: '右へ移動' }).click()
  await expect(page.getByRole('button', { name: 'MIOと訓練する' })).toBeEnabled()

  await installTimeline(page)
  await page.getByRole('button', { name: 'MIOと訓練する' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/7\?/)
  await expect(page.locator('.scene-transition')).toHaveCount(0)

  expectOrderedSwap(
    await readTimeline(page),
    'battle-start',
    { path: '/world' },
    { path: '/javascript/battle/7' },
  )
})

test('明示Boss挑戦は通常Battleより重いboss-start variantを使う', async ({ page }) => {
  await seedWorld(page, {
    mapId: 'overworld',
    position: { x: 40, y: 6 },
    clearedStageIds: JS_BOSS_PREREQS,
  })

  await page.getByRole('button', { name: '上へ移動' }).click()
  await expect(page.locator('.world-player-sprite')).toHaveAttribute('data-facing', 'up')
  await expect(page.locator('.world-interact')).toBeEnabled()

  await installTimeline(page)
  await page.locator('.world-interact').click()
  await expect(page).toHaveURL(/\/javascript\/battle\/3\?/)
  await expect(page.locator('.scene-transition')).toHaveCount(0)

  expectOrderedSwap(
    await readTimeline(page),
    'boss-start',
    { path: '/world' },
    { path: '/javascript/battle/3' },
  )
})

test('Battle逃走はbattle-returnで覆ってから元World位置へ戻る', async ({ page }) => {
  await seedWorld(page, {
    mapId: 'overworld',
    position: { x: 10, y: 11 },
    clearedStageIds: JS_FIRST_INCIDENT,
    currentHp: 73,
  })
  await page.goto('/javascript/battle/1?seed=encounter%3A5%3A10%3A11&returnTo=%2Fworld')

  await page.getByRole('group', { name: '戦闘コマンド' }).getByRole('button', { name: '逃げる' }).click()
  const confirm = page.getByRole('group', { name: '逃走確認' })
  await expect(confirm).toBeVisible()

  await installTimeline(page)
  await confirm.getByRole('button', { name: '逃げる' }).click()
  await expect(page).toHaveURL(/\/world$/)
  await expect(page.locator('.scene-transition')).toHaveCount(0)

  expectOrderedSwap(
    await readTimeline(page),
    'battle-return',
    { path: '/javascript/battle/1' },
    { path: '/world' },
  )
})

test('Defeat safe returnはdefeat-returnで覆ってからcheckpointへ戻る', async ({ page }) => {
  test.setTimeout(30_000)
  await seedWorld(page, {
    mapId: 'js-village',
    position: { x: 8, y: 10 },
    clearedStageIds: JS_FIRST_INCIDENT,
    currentHp: 1,
  })
  await page.goto('/javascript/battle/7?seed=scene-transition-defeat&returnTo=%2Fworld')

  const story = page.locator('.battle-story-window')
  await expect(story).toBeVisible()
  await story.getByRole('button', { name: 'スキップ', exact: true }).click()
  await page.getByRole('button', { name: '戦う', exact: true }).click()
  const trace = page.getByRole('button', { name: /^TRACE\b/ })
  await trace.click()
  await trace.click()
  await expect(page.getByText('敗北', { exact: true })).toBeVisible()

  await installTimeline(page)
  await page.getByRole('button', { name: /チェックポイントへ戻る/ }).click()
  await expect(page).toHaveURL(/\/world$/)
  await expect(page.locator('.scene-transition')).toHaveCount(0)

  expectOrderedSwap(
    await readTimeline(page),
    'defeat-return',
    { path: '/javascript/battle/7' },
    { path: '/world' },
  )
})
