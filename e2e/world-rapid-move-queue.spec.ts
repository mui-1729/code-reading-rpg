import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedVillageRoad(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 0,
          inventory: { patchKit: 0 },
          clearedStageIds: [1],
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 7],
          unlockedSkillIds: ['trace', 'pulse', 'nova'],
        },
      }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 5,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: ['byte'],
          partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
          worldMapId: 'js-village',
          worldPosition: { x: 7, y: 7 },
          stepsSinceEncounter: 0,
          encounterCount: 0,
          currentHp: 108,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )
  await page.goto('/world')
}

async function rapidClick(page: Page, labels: string[]) {
  await page.evaluate((names) => {
    for (const name of names) {
      document.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)?.click()
    }
  }, labels)
}

async function currentVisualAlignment(page: Page) {
  return page.evaluate(() => {
    const overlays = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.world-player-sprite, .world-follower-sprite, .world-npc-sprite',
      ),
    )
    let maxCenterError = 0
    let compared = 0

    for (const overlay of overlays) {
      const x = overlay.dataset.worldX
      const y = overlay.dataset.worldY
      if (x === undefined || y === undefined) continue
      const tile = document.querySelector<HTMLElement>(
        `.world-tile[data-world-x="${x}"][data-world-y="${y}"]`,
      )
      if (!tile) continue
      const spriteRect = overlay.getBoundingClientRect()
      const tileRect = tile.getBoundingClientRect()
      const spriteCenter = {
        x: spriteRect.left + spriteRect.width / 2,
        y: spriteRect.top + spriteRect.height / 2,
      }
      const tileCenter = {
        x: tileRect.left + tileRect.width / 2,
        y: tileRect.top + tileRect.height / 2,
      }
      maxCenterError = Math.max(
        maxCenterError,
        Math.hypot(spriteCenter.x - tileCenter.x, spriteCenter.y - tileCenter.y),
      )
      compared += 1
    }

    const tile = document.querySelector<HTMLElement>('.world-tile')
    const tileRect = tile?.getBoundingClientRect()
    return {
      compared,
      maxCenterError,
      tolerance: Math.max(3, (tileRect?.width ?? 0) * 0.16),
    }
  })
}

test('@responsive 150ms未満の5連続入力を捨てず1stepずつcameraへ流す', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedVillageRoad(page)

  const player = page.locator('.world-player-sprite')
  await rapidClick(page, Array(5).fill('右へ移動'))

  // synchronous burstでは最初の1stepだけがlogical/visual authorityへ入り、残りはqueueされる。
  await expect(player).toHaveAttribute('data-world-x', '8')
  await expect(page.locator('.world-camera-snapshot')).toHaveCount(1)

  await expect.poll(async () => Number(await player.getAttribute('data-world-x')), { timeout: 2_000 }).toBe(12)
  await expect(player).toHaveAttribute('data-world-y', '7')
  await expect(player).toHaveAttribute('data-facing', 'right')
  await expect.poll(() => page.locator('.world-camera-snapshot').count()).toBe(0)

  const geometry = await page.evaluate(() => {
    const viewport = document.querySelector<HTMLElement>('.world-viewport')
    const playerNode = document.querySelector<HTMLElement>('.world-player-sprite')
    const follower = document.querySelector<HTMLElement>('.world-follower-sprite')
    return {
      viewportX: viewport?.dataset.worldX,
      playerX: playerNode?.dataset.worldX,
      snapshotCount: document.querySelectorAll('.world-camera-snapshot').length,
      followerVisible: Boolean(follower),
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
  expect(geometry.viewportX).toBe('12')
  expect(geometry.playerX).toBe('12')
  expect(geometry.snapshotCount).toBe(0)
  expect(geometry.followerVisible).toBe(true)
  expect(geometry.documentOverflow).toBeLessThanOrEqual(1)
})

test('20ms級の連打中もterrain / Player / follower / NPCの相対位置を同じstepで保つ', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedVillageRoad(page)

  await rapidClick(page, Array(8).fill('右へ移動'))

  for (let frame = 0; frame < 42; frame += 1) {
    const alignment = await currentVisualAlignment(page)
    expect(alignment.compared).toBeGreaterThanOrEqual(2)
    expect(alignment.maxCenterError).toBeLessThanOrEqual(alignment.tolerance)
    await page.waitForTimeout(20)
  }

  await expect.poll(async () => Number(await page.locator('.world-player-sprite').getAttribute('data-world-x')), {
    timeout: 2_000,
  }).toBe(15)
})

test('rapid入力の途中で方向を変えても順序を保って最終座標へ収束する', async ({ page }) => {
  await seedVillageRoad(page)
  const player = page.locator('.world-player-sprite')

  await rapidClick(page, ['右へ移動', '右へ移動', '左へ移動', '右へ移動', '右へ移動'])

  await expect.poll(async () => Number(await player.getAttribute('data-world-x')), { timeout: 2_000 }).toBe(10)
  await expect(player).toHaveAttribute('data-world-y', '7')
  await expect(player).toHaveAttribute('data-facing', 'right')
  await expect.poll(() => page.locator('.world-camera-snapshot').count()).toBe(0)
})

test('prefers-reduced-motionではrapid入力をanimation queue待ちなしで即時反映する', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedVillageRoad(page)
  const player = page.locator('.world-player-sprite')

  await rapidClick(page, ['右へ移動', '右へ移動', '左へ移動', '右へ移動', '右へ移動'])

  await expect(player).toHaveAttribute('data-world-x', '10')
  const snapshots = page.locator('.world-camera-snapshot')
  if (await snapshots.count()) {
    await expect(snapshots.first()).toHaveCSS('display', 'none')
  }
})
