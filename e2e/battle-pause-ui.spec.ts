import { expect, test, type Page } from '@playwright/test'
import { JS_COMPLETE, JS_SECOND_INCIDENT_PREREQS } from './canonical-progress-fixtures'
import { readStoredGameState } from './storedGameState'

const BATTLE_2_REPLAY = [...JS_SECOND_INCIDENT_PREREQS, 2] as const

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

type SeedOptions = {
  clearedStageIds?: readonly number[]
  currentHp?: number
  equipment?: { weapon: string | null; armor: string | null; accessory: string | null }
  ownedEquipmentIds?: readonly string[]
  worldMapId?: string
  worldPosition?: { x: number; y: number }
}

async function seedState(page: Page, options: SeedOptions = {}) {
  const clearedStageIds = [...(options.clearedStageIds ?? [])]
  const ownedEquipmentIds = [...(options.ownedEquipmentIds ?? ['training-blade', 'traveler-coat'])]
  await page.addInitScript(
    ({ progressKey, rpgKey, tutorialKey, state }) => {
      if (sessionStorage.getItem('issue-259:seeded') === 'true') return
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 200,
            inventory: { patchKit: 2 },
            clearedStageIds: state.clearedStageIds,
            clearedAreaIds: state.clearedStageIds.includes(3) ? ['javascript'] : [],
            completedSideQuestIds: [],
            unlockedStageIds: [7],
            unlockedSkillIds: [
              'trace', 'pulse', 'nova', 'viper', 'lock', 'alert', 'link', 'fork',
              'gather', 'echo', 'project', 'signal', 'sync', 'order', 'safe-path',
              'reduce-focus', 'ts-scan', 'ts-guard', 'ts-label', 'ts-union',
              'ts-optional', 'ts-narrow', 'ts-keyof',
            ],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 5,
          state: {
            equipment: state.equipment ?? {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: state.ownedEquipmentIds,
            partyMemberIds: [],
            worldMapId: state.worldMapId ?? 'overworld',
            worldPosition: state.worldPosition ?? { x: 20, y: 14 },
            stepsSinceEncounter: 8,
            encounterCount: 0,
            currentHp: state.currentHp ?? 108,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
      sessionStorage.setItem('issue-259:seeded', 'true')
    },
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      state: { ...options, clearedStageIds, ownedEquipmentIds },
    },
  )
}

async function openBattle(page: Page, battleId: number, seed: string) {
  await page.goto(`/javascript/battle/${battleId}?seed=${encodeURIComponent(seed)}&returnTo=%2Fworld`)
  await expect(page.locator('.battle-console')).toBeVisible()
}

async function openPause(page: Page) {
  const trigger = page.getByRole('button', { name: 'メニューを開く' })
  await expect(trigger).toBeVisible()
  await trigger.click()
  const pause = page.getByRole('dialog', { name: 'メニュー' })
  await expect(pause).toBeVisible()
  return pause
}

test('@cross-browser Battle MENU is unavailable during an action and while CODE HELP/CODE DATA owns the modal stack', async ({ page }) => {
  await seedState(page, { clearedStageIds: BATTLE_2_REPLAY })
  await openBattle(page, 2, 'issue-259-menu-stack')

  const menuTrigger = page.getByRole('button', { name: 'メニューを開く' })
  await expect(menuTrigger).toBeVisible()

  await page.clock.install()
  const firstSkill = page.locator('[data-skill-id]').first()
  await firstSkill.click()
  await firstSkill.click()
  await expect(page.locator('body')).toHaveAttribute('data-battle-resolving', 'true')
  await expect(menuTrigger).toHaveCount(0)

  await page.clock.runFor(2_000)
  await expect(page.getByRole('button', { name: 'コード解説を開く' })).toBeEnabled()
  await page.getByRole('button', { name: 'コード解説を開く' }).click()
  await expect(page.getByRole('dialog', { name: 'コード解説' })).toBeVisible()
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
  await expect(page.getByRole('button', { name: 'メニューを開く' })).toHaveCount(0)

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'コード解説' })).toBeHidden()
  const enemy = page.locator('.enemy-card').first()
  await enemy.click()
  await expect(page.getByRole('dialog', { name: 'コードデータ' })).toBeVisible()
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
  await expect(page.getByRole('button', { name: 'メニューを開く' })).toHaveCount(0)
})

test('@cross-browser Battle equipment is read-only, while World equipment remains editable', async ({ page }) => {
  await seedState(page, {
    clearedStageIds: BATTLE_2_REPLAY,
    equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
    ownedEquipmentIds: ['training-blade', 'guard-edge', 'traveler-coat'],
  })
  await page.goto('/world')
  const worldPause = await openPause(page)
  await worldPause.getByRole('button', { name: '装備', exact: true }).click()
  const guardEdge = worldPause.locator('[data-equipment-id="guard-edge"]')
  await expect(guardEdge).toBeEnabled()
  await guardEdge.click()
  await expect(guardEdge).toHaveAttribute('data-equipment-state', 'equipped')
  await page.keyboard.press('Escape')

  await openBattle(page, 2, 'issue-259-equipment-lock')
  const battlePause = await openPause(page)
  await battlePause.getByRole('button', { name: '装備', exact: true }).click()
  await expect(battlePause.getByRole('status')).toContainText('バトル中は装備を変更できません')
  await expect(battlePause.locator('[data-equipment-id="training-blade"]')).toBeDisabled()
  await expect(battlePause.locator('[data-equipment-id="guard-edge"]')).toBeDisabled()
})

test('@cross-browser the second selected Skill keeps its exact source in CODE HELP and exposes selected state', async ({ page }) => {
  await seedState(page, { clearedStageIds: BATTLE_2_REPLAY })
  await openBattle(page, 2, 'issue-259-selected-help')

  const secondSkill = page.locator('[data-skill-id]').nth(1)
  await secondSkill.click()
  await expect(secondSkill).toHaveAttribute('aria-pressed', 'true')
  const selectedCode = (await secondSkill.locator('pre code').textContent()) ?? ''
  const selectedReadingCode = (await page.locator('.selected-skill-reading .source-code-line pre code').allTextContents()).join('\n')
  expect(selectedReadingCode).toBe(selectedCode)

  await page.getByRole('button', { name: 'コード解説を開く' }).click()
  const help = page.getByRole('dialog', { name: 'コード解説' })
  await expect(help).toBeVisible()
  await expect(help.locator('.source-code')).toBeVisible()
  await expect(help.locator('.source-code-line')).toHaveCount(selectedCode.split('\n').length)
  const helpCode = (await help.locator('.source-code-line pre code').allTextContents()).join('\n')
  expect(helpCode).toBe(selectedCode)
  await expect(help.getByRole('button', { pressed: true })).toHaveCount(1)
})

test('@responsive Pause navigation remains inside the viewport after reading a long CODEX', async ({ page }) => {
  await seedState(page, { clearedStageIds: JS_COMPLETE, worldMapId: 'ts-frontier', worldPosition: { x: 5, y: 5 } })
  await page.goto('/world')
  const pause = await openPause(page)
  await pause.getByRole('button', { name: 'コード図鑑', exact: true }).click()
  await expect(pause.locator('.codex-entry').first()).toBeVisible()

  const scrollTop = await pause.locator('.pause-content').evaluate((content) => {
    content.scrollTop = content.scrollHeight
    return content.scrollTop
  })
  expect(scrollTop).toBeGreaterThan(0)
  const geometry = await pause.evaluate((dialog) => {
    const tabs = dialog.querySelector<HTMLElement>('.pause-tabs')
    const dialogBox = dialog.getBoundingClientRect()
    const tabsBox = tabs?.getBoundingClientRect()
    return {
      dialogTop: dialogBox.top,
      dialogBottom: dialogBox.bottom,
      tabsTop: tabsBox?.top ?? -1,
      tabsBottom: tabsBox?.bottom ?? Number.POSITIVE_INFINITY,
    }
  })
  expect(geometry.tabsTop).toBeGreaterThanOrEqual(geometry.dialogTop)
  expect(geometry.tabsBottom).toBeLessThanOrEqual(geometry.dialogBottom)
  await expect(pause.getByRole('button', { name: 'ステータス', exact: true })).toBeVisible()
})

test('@responsive TypeScript Frontier opens CODEX on TypeScript by default', async ({ page }) => {
  await seedState(page, { clearedStageIds: JS_COMPLETE, worldMapId: 'ts-frontier', worldPosition: { x: 5, y: 5 } })
  await page.goto('/world')
  const pause = await openPause(page)
  await pause.getByRole('button', { name: 'コード図鑑', exact: true }).click()
  const codex = pause.getByRole('region', { name: 'Code Codex' })
  await expect(codex.getByRole('tab', { name: 'TYPESCRIPT' })).toHaveAttribute('aria-selected', 'true')
  await expect(codex.locator('.codex-summary')).toContainText('TYPESCRIPT')
  await expect(codex.locator('.codex-entry').first()).toContainText('type annotation')

  const typescriptTab = codex.getByRole('tab', { name: 'TYPESCRIPT' })
  const javascriptTab = codex.getByRole('tab', { name: 'JAVASCRIPT' })
  await typescriptTab.focus()
  await expect(typescriptTab).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(javascriptTab).toHaveAttribute('aria-selected', 'true')
  await expect(javascriptTab).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(codex.getByRole('tabpanel')).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(javascriptTab).toBeFocused()
})

test('@cross-browser reduced motion requires manual Victory result advancement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedState(page, { clearedStageIds: [1], currentHp: 108 })
  await openBattle(page, 1, 'encounter:5:10:11')
  await page.clock.install()

  for (const name of ['TRACE', 'NOVA', 'TRACE']) {
    const skill = page.getByRole('button', { name: new RegExp(`^${name}\\b`) })
    await skill.click()
    await skill.click()
    await page.clock.runFor(1_500)
  }

  const result = page.getByRole('dialog', { name: '勝利結果' })
  await expect(result).toBeVisible()
  const event = result.locator('.result-sequence-event')
  const firstEvent = (await event.textContent()) ?? ''
  await page.clock.runFor(10_000)
  await expect(event).toHaveText(firstEvent)
  await result.getByRole('button', { name: '次へ', exact: true }).click()
  await expect(event).not.toHaveText(firstEvent)
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
  await expect(page.getByRole('button', { name: 'メニューを開く' })).toHaveCount(0)
  await result.getByRole('button', { name: 'スキップ', exact: true }).click()
  await result.getByRole('button', { name: /ワールドへ戻る/ }).click()
  await expect(page).toHaveURL(/\/world$/)
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
})

test('@cross-browser Pause traps focus, blocks the background, and restores its opener', async ({ page }) => {
  await seedState(page, { clearedStageIds: BATTLE_2_REPLAY })
  await openBattle(page, 2, 'issue-259-pause-focus')
  const trigger = page.getByRole('button', { name: 'メニューを開く' })
  await trigger.click()
  const pause = page.getByRole('dialog', { name: 'メニュー' })
  await expect(pause).toBeVisible()
  await expect(page.locator('body')).toHaveAttribute('data-rpg-paused', 'true')
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
  const scrollBefore = await page.evaluate(() => window.scrollY)
  await page.mouse.wheel(0, 800)
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore)

  await page.locator('[data-skill-id]').first().focus()
  await expect(pause.getByRole('button').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(pause).toBeHidden()
  await expect(trigger).toBeFocused()
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
})

test('@cross-browser Story and Victory/Defeat overlays do not expose a second MENU', async ({ page }) => {
  await seedState(page, { clearedStageIds: [], currentHp: 1 })
  await openBattle(page, 1, 'issue-259-story-stack')
  await expect(page.locator('.battle-story-window[role="dialog"]')).toBeVisible()
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
  await expect(page.getByRole('button', { name: 'メニューを開く' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'コードで使う実データを確認' })).toBeDisabled()
  await page.getByRole('button', { name: 'スキップ', exact: true }).click()

  await page.clock.install()
  await page.locator('[data-skill-id="trace"]').click()
  await page.locator('[data-skill-id="trace"]').click()
  await page.clock.runFor(3_000)
  const defeat = page.getByRole('dialog', { name: '敗北結果' })
  await expect(defeat).toBeVisible()
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
  await expect(page.getByRole('button', { name: 'メニューを開く' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'コードで使う実データを確認' })).toHaveCount(0)

  const helpTrigger = defeat.getByRole('button', { name: 'コード解説', exact: true })
  await helpTrigger.click()
  const help = page.getByRole('dialog', { name: 'コード解説' })
  await expect(help).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(help).toBeHidden()
  await expect(helpTrigger).toBeFocused()

  await page.getByRole('button', { name: /チェックポイントへ戻る/ }).click()
  await expect(page).toHaveURL(/\/world$/)
  await expect.poll(() => readStoredGameState(page)).toMatchObject({ battleSession: null })
})

test('desktop Battle reference actions remain inline and do not overlap RUN or the Battle log', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await seedState(page, { clearedStageIds: BATTLE_2_REPLAY })
  await openBattle(page, 2, 'issue-259-desktop-reference-actions')

  await page.clock.install()
  const firstSkill = page.locator('[data-skill-id]').first()
  await firstSkill.click()
  await firstSkill.click()
  await page.clock.runFor(2_000)

  const geometry = await page.evaluate(() => {
    const references = document.querySelector<HTMLElement>('.battle-reference-actions')
    const referenceButtons = Array.from(document.querySelectorAll<HTMLElement>(
      '.battle-reference-actions > .floating-code-data, .battle-reference-actions > .floating-help',
    ))
    const run = document.querySelector<HTMLElement>('.battle-escape-row')
    const log = document.querySelector<HTMLElement>('.log-panel')
    if (!references || !run || !log) return null
    const referenceBounds = references.getBoundingClientRect()
    const runBounds = run.getBoundingClientRect()
    const logBounds = log.getBoundingClientRect()
    const overlaps = (first: DOMRect, second: DOMRect) =>
      first.left < second.right && first.right > second.left &&
      first.top < second.bottom && first.bottom > second.top
    return {
      position: getComputedStyle(references).position,
      buttonCount: referenceButtons.length,
      buttonsAreStatic: referenceButtons.every((button) => getComputedStyle(button).position === 'static'),
      withinWidth: referenceBounds.left >= 0 && referenceBounds.right <= window.innerWidth,
      buttonsWithinWidth: referenceButtons.every((button) => {
        const bounds = button.getBoundingClientRect()
        return bounds.left >= 0 && bounds.right <= window.innerWidth
      }),
      overlapsRun: referenceButtons.some((button) => overlaps(button.getBoundingClientRect(), runBounds)),
      overlapsLog: referenceButtons.some((button) => overlaps(button.getBoundingClientRect(), logBounds)),
    }
  })

  expect(geometry).toEqual({
    position: 'static',
    buttonCount: 2,
    buttonsAreStatic: true,
    withinWidth: true,
    buttonsWithinWidth: true,
    overlapsRun: false,
    overlapsLog: false,
  })
})
