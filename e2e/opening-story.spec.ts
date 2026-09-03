import { expect, test } from '@playwright/test'

const openingKey = 'code-read-rpg:javascript-opening:v1'

const resetOpening = async (page: import('@playwright/test').Page) => {
  await page.goto('/')
  await page.evaluate((key) => window.localStorage.removeItem(key), openingKey)
  await page.reload()
}

test('最初の開始でteamを紹介しincident-driven CODE WORLD調査へ接続する', async ({ page }) => {
  await resetOpening(page)

  await expect(page.getByRole('button', { name: 'はじめる' })).toBeVisible()
  await page.getByRole('button', { name: 'はじめる' }).click()

  await expect(page.locator('.opening-layer-badge')).toHaveText('REAL WORLD')
  await expect(page.locator('.opening-kicker')).toHaveText('DEVELOPMENT ROOM')
  await expect(page.locator('.opening-speaker')).toHaveText('LEAD ADA')
  await expect(page.locator('.opening-copy')).toContainText('新人エンジニア')
  await expect(page.locator('.opening-copy')).toContainText('最初のincident')

  await page.getByRole('button', { name: '次へ ▶' }).click()
  await expect(page.locator('.opening-layer-badge')).toHaveText('REAL WORLD')
  await expect(page.locator('.opening-kicker')).toHaveText('INCIDENT MONITOR')
  await expect(page.locator('.opening-speaker')).toHaveText('BYTE')
  await expect(page.locator('.opening-copy')).toContainText('僕はBYTE')
  await expect(page.locator('.opening-copy')).toContainText('先に答えを決めたくなる')

  await page.getByRole('button', { name: '次へ ▶' }).click()
  await expect(page.locator('.opening-layer-badge')).toHaveText('CONNECT')
  await expect(page.locator('.opening-kicker')).toHaveText('CONNECT')
  await expect(page.locator('.opening-copy')).toContainText('codeが世界のrule')

  await page.getByRole('button', { name: '次へ ▶' }).click()
  await expect(page.locator('.opening-layer-badge')).toHaveText('CODE WORLD')
  await expect(page.locator('.opening-kicker')).toHaveText('JAVASCRIPT GRASSLAND')
  await expect(page.locator('.opening-copy')).toContainText('現実側のtarget bug')
  await expect(page.locator('.opening-copy')).toContainText('実際の症状')

  await page.getByRole('button', { name: '次へ ▶' }).click()
  await expect(page.locator('.opening-layer-badge')).toHaveText('CODE WORLD')
  await expect(page.locator('.opening-kicker')).toHaveText('MISSION START')
  await expect(page.locator('.opening-copy')).toContainText('最初にやるのは研修じゃない')
  await expect(page.locator('.opening-copy')).toContainText('現場でtarget異常')
  await expect(page.locator('.opening-copy')).toContainText('VillageのMIO')

  await page.getByRole('button', { name: '▶ CODE WORLDを探索する' }).click()
  await expect(page).toHaveURL(/\/world$/)
  await expect(page.getByLabel('ワールドマップ')).toBeVisible()
  const objective = page.getByLabel('次の目的')
  await expect(objective).toContainText('BYTEと合流する')
  await expect(objective).toHaveAttribute('title', /Openingで見た対象異常/)
  await expect(objective).toHaveAttribute('title', /まず再現する/)
})

test('Opening確認済みなら続きから入り、Openingを見直せる', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((key) => window.localStorage.setItem(key, 'seen'), openingKey)
  await page.reload()

  await expect(page.getByRole('button', { name: '続きから' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'オープニングを見る' })).toBeVisible()

  await page.getByRole('button', { name: 'オープニングを見る' }).click()
  await expect(page.locator('.opening-layer-badge')).toHaveText('REAL WORLD')
  await expect(page.locator('.opening-kicker')).toHaveText('DEVELOPMENT ROOM')

  await page.getByRole('button', { name: 'スキップ' }).click()
  await expect(page).toHaveURL(/\/world$/)
})

test('TypeScript Chapter 1 starts as a new real world incident and enters CODE WORLD investigation', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem(
      'code-reading-rpg:tutorial',
      JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
    )
    localStorage.setItem(
      'code-reading-rpg:player-progress',
      JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 0,
          inventory: { patchKit: 0 },
          clearedStageIds: [3],
          clearedAreaIds: ['javascript'],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 4, 7],
          unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
        },
      }),
    )
  })

  await page.goto('/typescript/battle/4?seed=world-framing-ts&returnTo=%2Fworld')
  const briefing = page.getByRole('dialog', { name: 'API更新後の型ずれ' })
  await expect(briefing).toBeVisible()
  await expect(briefing.locator('.story-world-layer')).toHaveText('REAL WORLD')
  await expect(briefing).toContainText('次の仕事だ')

  await briefing.getByRole('button', { name: '▶ 次へ' }).click()
  await expect(briefing.locator('.story-world-layer')).toHaveText('REMOTE LINK')
  await expect(briefing).toContainText('TypeScript Frontier')

  await briefing.getByRole('button', { name: '▶ 次へ' }).click()
  await expect(briefing.locator('.story-world-layer')).toHaveText('CODE WORLD')
  await expect(briefing).toContainText('CONNECT先をTypeScript Frontierへ切り替えた')
})
