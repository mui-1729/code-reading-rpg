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
    }
  })
}

test('@responsive Fight previews the first Skill without arming it and does not shift after the first press', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedBattle(page)
  await page.goto('/javascript/battle/2?seed=issue-386-layout&returnTo=%2Fworld')
  await settleBattleEntry(page)

  await page.getByRole('button', { name: '戦う', exact: true }).click()
  const firstSkill = page.locator('[data-skill-id]').first()
  await expect(firstSkill).toHaveAttribute('data-skill-previewed', 'true')
  await expect(firstSkill).toHaveAttribute('aria-pressed', 'false')

  const cardCode = (await firstSkill.locator('pre code').textContent()) ?? ''
  const detailCode = (await page.locator('.selected-skill-reading .source-code-line pre code').allTextContents()).join('\n')
  expect(detailCode).toBe(cardCode)

  const afterFight = await battleGeometry(page)
  await page.screenshot({ path: testInfo.outputPath('fight-preview.png'), fullPage: true })

  await firstSkill.click()
  await expect(firstSkill).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('body')).toHaveAttribute('data-battle-resolving', 'false')

  const afterFirstPress = await battleGeometry(page)
  expect(Math.abs(afterFirstPress.detailHeight - afterFight.detailHeight)).toBeLessThanOrEqual(1)
  expect(Math.abs(afterFirstPress.detailBottom - afterFight.detailBottom)).toBeLessThanOrEqual(1)
  expect(Math.abs(afterFirstPress.consoleTop - afterFight.consoleTop)).toBeLessThanOrEqual(1)
  await page.screenshot({ path: testInfo.outputPath('skill-armed.png'), fullPage: true })

  await firstSkill.click()
  await expect(page.locator('body')).toHaveAttribute('data-battle-resolving', 'true')
})

test('@responsive Escape confirmation keeps the command row height stable', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedBattle(page)
  await page.goto('/javascript/battle/2?seed=encounter%3Aoverworld%3A8%3A20%3A14&returnTo=%2Fworld')
  await settleBattleEntry(page)

  const commandBar = page.getByRole('group', { name: '戦闘コマンド' })
  const escape = commandBar.getByRole('button', { name: '逃げる' })
  await expect(escape).toBeVisible()
  const before = await commandBar.evaluate((element) => {
    const box = element.getBoundingClientRect()
    return { top: box.top, height: box.height }
  })

  await escape.click()
  const confirm = page.getByRole('group', { name: '逃走確認' })
  await expect(confirm).toBeVisible()
  const after = await confirm.evaluate((element) => {
    const box = element.getBoundingClientRect()
    return { top: box.top, height: box.height }
  })
  expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1)
  expect(Math.abs(after.top - before.top)).toBeLessThanOrEqual(1)
  await page.screenshot({ path: testInfo.outputPath('escape-confirm.png'), fullPage: true })

  await confirm.getByRole('button', { name: 'やめる' }).click()
  await expect(page.getByRole('group', { name: '戦闘コマンド' })).toBeVisible()
})
