import { expect, test, type Page } from '@playwright/test'
import { JS_SECOND_INCIDENT_PREREQS } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'
const BATTLE_2_REPLAY = [...JS_SECOND_INCIDENT_PREREQS, 2] as const

async function seedBattle(page: Page, clearedStageIds: readonly number[] = BATTLE_2_REPLAY) {
  await page.addInitScript(
    ({ progressKey, rpgKey, tutorialKey, clearedStageIds: seededClearedStageIds }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 200,
          inventory: { patchKit: 2 },
          clearedStageIds: seededClearedStageIds,
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [7],
          unlockedSkillIds: [
            'trace', 'pulse', 'nova', 'viper', 'lock', 'alert', 'link', 'fork',
            'gather', 'echo', 'project', 'signal', 'sync', 'order', 'safe-path',
            'reduce-focus', 'moon-edge', 'sweep', 'judge',
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
      clearedStageIds: [...clearedStageIds],
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

async function expectViewportStable(page: Page, initialScroll: number) {
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - initialScroll)).toBeLessThanOrEqual(1)
}

test('@responsive Battle root, Fight and Items share one stable command workspace', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedBattle(page)
  await page.goto('/javascript/battle/2?seed=stable-workspace-v3&returnTo=%2Fworld')
  await settleBattleEntry(page)

  let root = page.getByRole('group', { name: '戦闘コマンド' })
  await root.scrollIntoViewIfNeeded()
  const scrollBefore = await page.evaluate(() => window.scrollY)
  const initial = await workspaceGeometry(page)
  await page.screenshot({ path: testInfo.outputPath('00-root.png'), fullPage: true })

  await root.getByRole('button', { name: '戦う', exact: true }).dispatchEvent('click')
  await expect(root).toBeHidden()
  const skills = page.getByRole('group', { name: 'スキル' })
  const fightBack = page.getByRole('group', { name: '戦闘サブメニュー操作' }).getByRole('button', { name: '← 戻る' })
  await expect(skills).toBeVisible()
  await expect(fightBack).toBeVisible()

  const firstSkill = page.locator('[data-skill-id]').first()
  await expect(firstSkill).toHaveAttribute('data-skill-previewed', 'true')
  await expect(firstSkill).toHaveAttribute('aria-pressed', 'false')
  expectStable(await workspaceGeometry(page), initial)
  await expectViewportStable(page, scrollBefore)
  await page.screenshot({ path: testInfo.outputPath('01-fight.png'), fullPage: true })

  await firstSkill.dispatchEvent('click')
  await expect(firstSkill).toHaveAttribute('aria-pressed', 'true')
  expectStable(await workspaceGeometry(page), initial)
  await fightBack.dispatchEvent('click')

  root = page.getByRole('group', { name: '戦闘コマンド' })
  await expect(root).toBeVisible()
  await expect(skills).toBeHidden()
  expectStable(await workspaceGeometry(page), initial)

  await root.getByRole('button', { name: 'アイテム', exact: true }).dispatchEvent('click')
  await expect(root).toBeHidden()
  const itemMenu = page.getByRole('group', { name: 'アイテム選択' })
  const itemBack = page.getByRole('group', { name: '戦闘サブメニュー操作' }).getByRole('button', { name: '← 戻る' })
  await expect(itemMenu).toBeVisible()
  await expect(itemBack).toBeVisible()
  await expect(page.getByLabel('戦闘アイテム詳細')).toContainText('下の一覧からアイテムを選ぶ')
  expectStable(await workspaceGeometry(page), initial)
  await page.screenshot({ path: testInfo.outputPath('02-items.png'), fullPage: true })

  const firstItem = itemMenu.locator('[data-item-id]').first()
  await firstItem.dispatchEvent('click')
  await expect(firstItem).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.battle-item-detail')).toBeVisible()
  await expect(itemMenu.getByRole('button', { name: /を使う/ })).toBeVisible()
  expectStable(await workspaceGeometry(page), initial)
  await expectViewportStable(page, scrollBefore)
  await page.screenshot({ path: testInfo.outputPath('03-item-detail.png'), fullPage: true })

  await itemBack.dispatchEvent('click')
  await expect(page.getByRole('group', { name: '戦闘コマンド' })).toBeVisible()
  await expect(itemMenu).toBeHidden()
  expectStable(await workspaceGeometry(page), initial)
})

test('@responsive Escape replaces the root with confirm plus shared Back without moving the workspace', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedBattle(page)
  await page.goto('/javascript/battle/2?seed=encounter%3Aoverworld%3A8%3A20%3A14&returnTo=%2Fworld')
  await settleBattleEntry(page)

  let root = page.getByRole('group', { name: '戦闘コマンド' })
  await root.scrollIntoViewIfNeeded()
  const scrollBefore = await page.evaluate(() => window.scrollY)
  const initial = await workspaceGeometry(page)

  await root.getByRole('button', { name: '逃げる' }).dispatchEvent('click')
  await expect(root).toBeHidden()
  const confirm = page.getByRole('group', { name: '逃走確認' })
  await expect(confirm).toBeVisible()
  await expect(confirm).toContainText('逃げますか？')
  await expect(confirm.getByRole('button', { name: '逃げる' })).toBeVisible()
  const back = confirm.getByRole('button', { name: '← 戻る' })
  await expect(back).toBeFocused()
  expectStable(await workspaceGeometry(page), initial)
  await expectViewportStable(page, scrollBefore)
  await page.screenshot({ path: testInfo.outputPath('04-escape.png'), fullPage: true })

  await back.dispatchEvent('click')
  root = page.getByRole('group', { name: '戦闘コマンド' })
  await expect(root).toBeVisible()
  await expect(confirm).toBeHidden()
  expectStable(await workspaceGeometry(page), initial)
})

test('@responsive NEXT is hidden normally and only overlays during a Boss attack', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedBattle(page, [...BATTLE_2_REPLAY, 3])

  await page.goto('/javascript/battle/2?seed=no-intent-hud&returnTo=%2Fworld')
  await settleBattleEntry(page)
  await expect(page.locator('.enemy-card .intent-box')).toHaveCount(3)
  for (const intent of await page.locator('.enemy-card .intent-box').all()) {
    await expect(intent).toBeHidden()
  }

  await page.goto('/javascript/battle/3?seed=boss-warning-only&returnTo=%2Fworld')
  await settleBattleEntry(page)
  const bossIntent = page.locator('.enemy-card.is-boss-enemy .intent-box')
  await expect(bossIntent).toBeHidden()

  const initial = await workspaceGeometry(page)
  await page.getByRole('group', { name: '戦闘コマンド' }).getByRole('button', { name: '戦う', exact: true }).dispatchEvent('click')
  const firstSkill = page.locator('[data-skill-id]').first()
  await firstSkill.dispatchEvent('click')
  await firstSkill.dispatchEvent('click')

  await expect(bossIntent).toBeVisible({ timeout: 5000 })
  expectStable(await workspaceGeometry(page), initial)
  await page.screenshot({ path: testInfo.outputPath('05-boss-attack-warning.png'), fullPage: true })
  await expect(bossIntent).toBeHidden({ timeout: 3000 })
})
