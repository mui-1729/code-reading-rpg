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
  await page.waitForTimeout(600)
}

async function workspaceGeometry(page: Page) {
  return page.evaluate(() => {
    const detail = document.querySelector<HTMLElement>('.selected-skill-reading')
    const consolePanel = document.querySelector<HTMLElement>('.battle-console')
    if (!detail || !consolePanel) throw new Error('battle workspace is missing')

    const detailBox = detail.getBoundingClientRect()
    const consoleBox = consolePanel.getBoundingClientRect()
    return {
      detailTop: detailBox.top + window.scrollY,
      detailHeight: detailBox.height,
      detailBottom: detailBox.bottom + window.scrollY,
      consoleTop: consoleBox.top + window.scrollY,
      consoleHeight: consoleBox.height,
      consoleBottom: consoleBox.bottom + window.scrollY,
    }
  })
}

function expectStable(actual: Awaited<ReturnType<typeof workspaceGeometry>>, baseline: Awaited<ReturnType<typeof workspaceGeometry>>) {
  for (const key of Object.keys(baseline) as Array<keyof typeof baseline>) {
    expect(Math.abs(actual[key] - baseline[key]), `${key} should stay stable`).toBeLessThanOrEqual(1)
  }
}

test('@responsive Battle workspace keeps its page geometry through Fight, arm, and Items', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedBattle(page)
  await page.goto('/javascript/battle/2?seed=stable-workspace-v2&returnTo=%2Fworld')
  await settleBattleEntry(page)

  const commandBar = page.getByRole('group', { name: '戦闘コマンド' })
  await commandBar.scrollIntoViewIfNeeded()
  const scrollBefore = await page.evaluate(() => window.scrollY)
  const initial = await workspaceGeometry(page)
  await page.screenshot({ path: testInfo.outputPath('00-initial.png'), fullPage: true })

  await commandBar.getByRole('button', { name: '戦う', exact: true }).dispatchEvent('click')
  const firstSkill = page.locator('[data-skill-id]').first()
  await expect(firstSkill).toHaveAttribute('data-skill-previewed', 'true')
  await expect(firstSkill).toHaveAttribute('aria-pressed', 'false')
  expectStable(await workspaceGeometry(page), initial)
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore)).toBeLessThanOrEqual(1)
  await page.screenshot({ path: testInfo.outputPath('01-fight-preview.png'), fullPage: true })

  await firstSkill.dispatchEvent('click')
  await expect(firstSkill).toHaveAttribute('aria-pressed', 'true')
  expectStable(await workspaceGeometry(page), initial)
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore)).toBeLessThanOrEqual(1)
  await page.screenshot({ path: testInfo.outputPath('02-skill-armed.png'), fullPage: true })

  await page.getByRole('group', { name: '戦闘コマンド' }).getByRole('button', { name: 'アイテム', exact: true }).dispatchEvent('click')
  await expect(page.getByLabel('戦闘アイテム一覧')).toBeVisible()
  expectStable(await workspaceGeometry(page), initial)
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore)).toBeLessThanOrEqual(1)
  await page.screenshot({ path: testInfo.outputPath('03-items.png'), fullPage: true })
})

test('@responsive Escape confirmation does not move the workspace or viewport', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedBattle(page)
  await page.goto('/javascript/battle/2?seed=encounter%3Aoverworld%3A8%3A20%3A14&returnTo=%2Fworld')
  await settleBattleEntry(page)

  const commandBar = page.getByRole('group', { name: '戦闘コマンド' })
  await commandBar.scrollIntoViewIfNeeded()
  const scrollBefore = await page.evaluate(() => window.scrollY)
  const initial = await workspaceGeometry(page)

  await commandBar.getByRole('button', { name: '逃げる' }).dispatchEvent('click')
  const confirm = page.getByRole('group', { name: '逃走確認' })
  await expect(confirm).toBeVisible()
  await expect(confirm.getByRole('button', { name: 'やめる' })).toBeFocused()
  expectStable(await workspaceGeometry(page), initial)
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore)).toBeLessThanOrEqual(1)
  await page.screenshot({ path: testInfo.outputPath('04-escape-confirm.png'), fullPage: true })

  await confirm.getByRole('button', { name: 'やめる' }).dispatchEvent('click')
  await expect(page.getByRole('group', { name: '戦闘コマンド' })).toBeVisible()
  expectStable(await workspaceGeometry(page), initial)
})
