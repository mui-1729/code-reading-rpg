import { expect, test, type Page } from '@playwright/test'
import { JS_SECOND_INCIDENT_PREREQS } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'
const BATTLE_2_REPLAY = [...JS_SECOND_INCIDENT_PREREQS, 2] as const

async function seedBattle(page: Page) {
  await page.addInitScript(
    ({ progressKey, rpgKey, tutorialKey, clearedStageIds }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 200,
          inventory: { patchKit: 2 },
          clearedStageIds,
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [7],
          unlockedSkillIds: [
            'trace', 'pulse', 'nova', 'viper', 'lock', 'alert', 'link', 'fork',
            'gather', 'echo', 'project', 'signal', 'sync', 'order', 'safe-path',
            'reduce-focus',
          ],
        },
      }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 5,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: [],
          worldMapId: 'overworld',
          worldPosition: { x: 20, y: 14 },
          stepsSinceEncounter: 8,
          encounterCount: 0,
          currentHp: 108,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      clearedStageIds: [...BATTLE_2_REPLAY],
    },
  )
}

async function settleBattleEntry(page: Page) {
  // Battle entry presentation is 520ms. Visual captures should compare stable
  // interaction states rather than two different frames of that animation.
  await page.waitForTimeout(600)
}

async function battleGeometry(page: Page) {
  return page.evaluate(() => {
    const detail = document.querySelector<HTMLElement>('.selected-skill-reading')
    const consolePanel = document.querySelector<HTMLElement>('.battle-console')
    if (!detail || !consolePanel) throw new Error('battle layout is missing')
    const detailBox = detail.getBoundingClientRect()
    const consoleBox = consolePanel.getBoundingClientRect()
    return {
      detailHeight: detailBox.height,
      detailBottom: detailBox.bottom,
      consoleTop: consoleBox.top,
      consoleHeight: consoleBox.height,
    }
  })
}

function expectStable(actual: Awaited<ReturnType<typeof battleGeometry>>, baseline: Awaited<ReturnType<typeof battleGeometry>>) {
  for (const key of Object.keys(baseline) as Array<keyof typeof baseline>) {
    expect(Math.abs(actual[key] - baseline[key]), `${key} should stay stable`).toBeLessThanOrEqual(1)
  }
}

test('@responsive Fight previews the first Skill without arming it and does not shift after the first press', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedBattle(page)
  await page.goto('/javascript/battle/2?seed=issue-386-layout&returnTo=%2Fworld')
  await settleBattleEntry(page)

  const before = await battleGeometry(page)
  const root = page.getByRole('group', { name: '戦闘コマンド' })
  await root.getByRole('button', { name: '戦う', exact: true }).click()
  await expect(root).toBeHidden()

  const firstSkill = page.locator('[data-skill-id]').first()
  await expect(firstSkill).toHaveAttribute('data-skill-previewed', 'true')
  await expect(firstSkill).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('group', { name: '戦闘サブメニュー操作' }).getByRole('button', { name: '← 戻る' })).toBeVisible()

  const cardCode = (await firstSkill.locator('pre code').textContent()) ?? ''
  const detailCode = (await page.locator('.selected-skill-reading .source-code-line pre code').allTextContents()).join('\n')
  expect(detailCode).toBe(cardCode)

  const afterFight = await battleGeometry(page)
  expectStable(afterFight, before)
  await page.screenshot({ path: testInfo.outputPath('fight-preview.png'), fullPage: true })

  await firstSkill.click()
  await expect(firstSkill).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('body')).toHaveAttribute('data-battle-resolving', 'false')

  const afterFirstPress = await battleGeometry(page)
  expectStable(afterFirstPress, before)
  await page.screenshot({ path: testInfo.outputPath('skill-armed.png'), fullPage: true })

  await firstSkill.click()
  await expect(page.locator('body')).toHaveAttribute('data-battle-resolving', 'true')
})

test('@responsive Escape confirmation replaces root without moving the battle workspace', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedBattle(page)
  await page.goto('/javascript/battle/2?seed=encounter%3Aoverworld%3A8%3A20%3A14&returnTo=%2Fworld')
  await settleBattleEntry(page)

  let root = page.getByRole('group', { name: '戦闘コマンド' })
  const before = await battleGeometry(page)
  const escape = root.getByRole('button', { name: '逃げる' })
  await expect(escape).toBeVisible()

  await escape.click()
  await expect(root).toBeHidden()
  const confirm = page.getByRole('group', { name: '逃走確認' })
  await expect(confirm).toBeVisible()
  await expect(confirm).toContainText('逃げますか？')
  await expect(confirm.getByRole('button', { name: '逃げる' })).toBeVisible()
  const back = confirm.getByRole('button', { name: '← 戻る' })
  await expect(back).toBeVisible()
  await expect(back).toBeFocused()
  expectStable(await battleGeometry(page), before)
  await page.screenshot({ path: testInfo.outputPath('escape-confirm.png'), fullPage: true })

  await back.click()
  root = page.getByRole('group', { name: '戦闘コマンド' })
  await expect(root).toBeVisible()
  await expect(confirm).toBeHidden()
  expectStable(await battleGeometry(page), before)
})
