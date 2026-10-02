import { expect, test, type Page } from '@playwright/test'
import { readStoredGameState } from './storedGameState'
import { JS_BOSS_PREREQS } from './canonical-progress-fixtures'

const complete = [...JS_BOSS_PREREQS, 3, 4, 5, 6]

async function seed(
  page: Page,
  options: {
    map?: string
    position?: { x: number; y: number }
    cleared?: number[]
    hp?: number
  } = {},
) {
  await page.goto('/')
  await page.evaluate(
    ({ map, position, cleared, hp }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(
        'code-reading-rpg:game-state',
        JSON.stringify({
          version: 2,
          revision: 1,
          progress: {
            version: 4,
            progress: {
              exp: 200,
              gold: 120,
              inventory: { patchKit: 1 },
              clearedStageIds: cleared,
              clearedAreaIds: ['javascript', 'typescript'],
              completedSideQuestIds: [],
              unlockedStageIds: [],
              unlockedSkillIds: ['trace', 'pulse', 'nova'],
            },
          },
          rpg: {
            version: 8,
            state: {
              equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
              ownedEquipmentIds: ['training-blade', 'traveler-coat'],
              partyMemberIds: ['byte'],
              partyEquipment: {},
              worldMapId: map,
              worldPosition: position,
              safeCheckpoint: { id: 'central-hub', mapId: 'overworld', position: { x: 20, y: 14 } },
              stepsSinceEncounter: 0,
              encounterCount: 0,
              currentHp: hp,
              openedTreasureIds: [],
              revealedWorldCells: {},
              ownedWorldMapIds: [],
            },
          },
          battleSession: null,
        }),
      )
      localStorage.setItem(
        'code-reading-rpg:tutorial',
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    {
      map: options.map ?? 'database-archive',
      position: options.position ?? { x: 15, y: 5 },
      cleared: options.cleared ?? complete,
      hp: options.hp ?? 108,
    },
  )
  await page.goto('/world')
}
async function dismissStory(page: Page) {
  const story = page.locator('.battle-story-window')
  if (await story.isVisible())
    await story.getByRole('button', { name: 'スキップ', exact: true }).click()
  await expect(story).toBeHidden()
  await expect(page.locator('[data-scene-transition-kind]')).toHaveCount(0)
}
async function enterTrial(page: Page) {
  await page.getByRole('button', { name: '上へ移動', exact: true }).click()
  await page.getByRole('button', { name: '台帳を調べる', exact: true }).click()
  await expect(page).toHaveURL(/\/database\/battle\/23/)
  await dismissStory(page)
}

test('@cross-browser @responsive 地下書庫は二つのfinal後に開き、階段の往復とreloadで現在地を保持する', async ({
  page,
}) => {
  await seed(page, {
    map: 'ts-frontier',
    position: { x: 27, y: 15 },
    cleared: [...JS_BOSS_PREREQS, 3, 4, 5],
  })
  await page.getByRole('button', { name: '下へ移動', exact: true }).click()
  await page.getByRole('button', { name: '地下書庫を調べる' }).click()
  await expect(page.locator('.world-message')).toContainText('二つの封印')
  await expect(page.locator('.world-viewport')).toHaveAttribute('data-world-map', 'ts-frontier')
  await seed(page, { map: 'ts-frontier', position: { x: 27, y: 15 } })
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  const archive = page.getByLabel('地下書庫のマップ')
  await expect(archive).toBeVisible()
  await expect(archive).toHaveAttribute('data-world-x', '9')
  await page.reload()
  await expect(archive).toHaveAttribute('data-world-y', '12')
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  await expect(page.getByLabel('地域ごとの目的')).toContainText('DATABASE ARCHIVE')
  await expect(page.getByLabel('地域ごとの目的')).toContainText('北東の閲覧台でtableとqueryを読む')
  await page.keyboard.press('Escape')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.locator('.world-viewport')).toHaveAttribute('data-world-map', 'ts-frontier')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false)
})

test('@cross-browser @responsive SQLの元tableとHELPを読め、EXECUTE前にquery結果を示さない', async ({
  page,
}) => {
  await seed(page)
  await enterTrial(page)
  await page.getByRole('button', { name: '戦う', exact: true }).click()
  const skill = page.locator('.skill-card').first()
  await skill.click()
  await expect(skill.locator('pre code')).toContainText('SELECT id')
  await expect(skill.locator('pre code')).toContainText('ORDER BY')
  await expect(page.locator('[data-semantic-target="true"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'コードで使う実データを確認' }).click()
  const data = page.getByRole('dialog', { name: 'コードデータ' })
  await expect(data.getByRole('table')).toBeVisible()
  await expect(data.getByRole('row')).toHaveCount(4)
  await expect(data.getByRole('columnheader', { name: 'attackDamage' })).toBeVisible()
  await expect(data).not.toContainText('QUERY RESULT')
  const beforeRows = await data.getByRole('row').allTextContents()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'コード解説を開く' }).click()
  const help = page.getByRole('dialog', { name: /コード解説/ })
  await expect(help).toContainText('SELECT id')
  await expect(help).toContainText('LIMIT')
  await page.keyboard.press('Escape')
  await skill.click()
  await expect(page.locator('.battle-semantic-feedback')).toContainText('QUERY RESULT')
  await page.getByRole('button', { name: 'コードで使う実データを確認' }).click()
  await expect(data.getByRole('table')).toBeVisible()
  expect(await data.getByRole('row').allTextContents()).not.toEqual(beforeRows)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false)
})

test('Databaseの勝利は同じ書庫へ戻り、Gold・clear・HPをreload後も保存する', async ({ page }) => {
  test.setTimeout(60000)
  await seed(page)
  await enterTrial(page)
  for (let turn = 0; turn < 15; turn += 1) {
    if (await page.locator('.victory-overlay').isVisible()) break
    await page.getByRole('button', { name: '戦う', exact: true }).click()
    const skill = page.getByRole('button', { name: /^RECORD SPARK\b/ })
    await expect(skill).toBeEnabled()
    await skill.click()
    await skill.click()
    await expect(page.locator('body')).not.toHaveAttribute('data-battle-resolving', 'true')
  }
  await dismissStory(page)
  const result = page.getByRole('dialog', { name: '勝利結果' })
  await expect(result).toBeVisible()
  await result.getByRole('button', { name: /ワールドへ戻る/ }).click()
  await expect(page.getByLabel('地下書庫のマップ')).toHaveAttribute('data-world-x', '15')
  const stored = await readStoredGameState(page)
  expect(stored.progress.progress.clearedStageIds).toContain(23)
  expect(stored.progress.progress.clearedAreaIds).toContain('database')
  expect(stored.progress.progress.gold).toBeGreaterThan(120)
  expect(stored.rpg.state.currentHp).toBeGreaterThan(0)
  await page.reload()
  expect((await readStoredGameState(page)).progress.progress).toEqual(stored.progress.progress)
  await expect(page.getByLabel('地下書庫のマップ')).toHaveAttribute('data-world-y', '5')
})

test('既習queryのescapeは元の書庫とHPへ戻り、報酬を付与しない', async ({ page }) => {
  await seed(page, { cleared: [...complete, 23], hp: 73 })
  await enterTrial(page)
  const before = await readStoredGameState(page)
  await page
    .getByRole('group', { name: '戦闘コマンド' })
    .getByRole('button', { name: '逃げる', exact: true })
    .click()
  await page
    .getByRole('group', { name: '逃走確認' })
    .getByRole('button', { name: '逃げる', exact: true })
    .click()
  await expect(page.getByLabel('地下書庫のマップ')).toHaveAttribute('data-world-y', '5')
  const stored = await readStoredGameState(page)
  expect(stored.progress.progress).toEqual(before.progress.progress)
  expect(stored.rpg.state.currentHp).toBe(73)
})

test('Database敗北は既存checkpointへ戻り、未確定のGold・clearを残さない', async ({ page }) => {
  await seed(page, { hp: 1 })
  await enterTrial(page)
  await page.getByRole('button', { name: '戦う', exact: true }).click()
  const skill = page.getByRole('button', { name: /^RECORD SPARK\b/ })
  await skill.click()
  await skill.click()
  const result = page.getByRole('dialog', { name: '敗北結果' })
  await expect(result).toBeVisible()
  await result.getByRole('button', { name: /チェックポイントへ戻る/ }).click()
  await expect(page.locator('.world-viewport')).toHaveAttribute('data-world-map', 'overworld')
  const stored = await readStoredGameState(page)
  expect(stored.progress.progress.clearedStageIds).not.toContain(23)
  expect(stored.progress.progress.gold).toBe(120)
  expect(stored.rpg.state.currentHp).toBe(1)
})
