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
          worldPosition: { x: 6, y: 6 },
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

async function currentRapidFrame(page: Page) {
  return page.evaluate(() => {
    const centerOf = (element: HTMLElement | null) => {
      if (!element) return null
      const rect = element.getBoundingClientRect()
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    }

    const npcOffsets = Array.from(document.querySelectorAll<HTMLElement>('.world-npc-sprite')).flatMap((npc) => {
      const npcId = npc.dataset.worldNpc
      const x = npc.dataset.worldX
      const y = npc.dataset.worldY
      if (!npcId || x === undefined || y === undefined) return []
      const tile = document.querySelector<HTMLElement>(
        `.world-tile[data-world-x="${x}"][data-world-y="${y}"]`,
      )
      const npcCenter = centerOf(npc)
      const tileCenter = centerOf(tile)
      if (!npcCenter || !tileCenter) return []
      return [{
        id: npcId,
        x: npcCenter.x - tileCenter.x,
        y: npcCenter.y - tileCenter.y,
      }]
    })

    const tile = document.querySelector<HTMLElement>('.world-tile')
    return {
      tileWidth: tile?.getBoundingClientRect().width ?? 0,
      player: centerOf(document.querySelector<HTMLElement>('.world-player-sprite')),
      follower: centerOf(document.querySelector<HTMLElement>('.world-follower-sprite')),
      npcOffsets,
    }
  })
}

test('@responsive 150ms未満の5連続入力を捨てず1stepずつcameraへ流す', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedVillageRoad(page)

  const player = page.locator('.world-player-sprite')
  await rapidClick(page, Array(5).fill('右へ移動'))

  // synchronous burstでは最初の1stepだけがlogical/visual authorityへ入り、残りはqueueされる。
  await expect(player).toHaveAttribute('data-world-x', '7')
  await expect(page.locator('.world-camera-snapshot')).toHaveCount(1)

  await expect.poll(async () => Number(await player.getAttribute('data-world-x')), { timeout: 2_000 }).toBe(11)
  await expect(player).toHaveAttribute('data-world-y', '6')
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
  expect(geometry.viewportX).toBe('11')
  expect(geometry.playerX).toBe('11')
  expect(geometry.snapshotCount).toBe(0)
  expect(geometry.followerVisible).toBe(true)
  expect(geometry.documentOverflow).toBeLessThanOrEqual(1)
})

test('20ms級の連打中もterrain / Player / follower / NPCを同じvisual transactionで保つ', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedVillageRoad(page)

  await rapidClick(page, Array(8).fill('右へ移動'))

  const npcBaselines = new Map<string, { x: number; y: number }>()
  let previousPlayer: { x: number; y: number } | null = null
  let previousFollower: { x: number; y: number } | null = null
  let comparedNpcFrames = 0

  for (let frameIndex = 0; frameIndex < 42; frameIndex += 1) {
    const frame = await currentRapidFrame(page)
    expect(frame.tileWidth).toBeGreaterThan(0)
    expect(frame.player).not.toBeNull()
    expect(frame.follower).not.toBeNull()

    for (const npc of frame.npcOffsets) {
      const baseline = npcBaselines.get(npc.id)
      if (baseline) {
        expect(Math.hypot(npc.x - baseline.x, npc.y - baseline.y)).toBeLessThan(1.5)
        comparedNpcFrames += 1
      } else {
        npcBaselines.set(npc.id, { x: npc.x, y: npc.y })
      }
    }

    // logical座標はstep開始時に確定するため、animation中のPlayerを新tile中心へ即一致させるのではなく、
    // 20ms sampling間で1tile分のsnapが起きていないことを検証する。
    const continuityTolerance = frame.tileWidth * 0.55
    if (previousPlayer && frame.player) {
      expect(Math.hypot(frame.player.x - previousPlayer.x, frame.player.y - previousPlayer.y))
        .toBeLessThanOrEqual(continuityTolerance)
    }
    if (previousFollower && frame.follower) {
      expect(Math.hypot(frame.follower.x - previousFollower.x, frame.follower.y - previousFollower.y))
        .toBeLessThanOrEqual(continuityTolerance)
    }
    previousPlayer = frame.player
    previousFollower = frame.follower
    await page.waitForTimeout(20)
  }

  expect(comparedNpcFrames).toBeGreaterThan(0)
  await expect.poll(async () => Number(await page.locator('.world-player-sprite').getAttribute('data-world-x')), {
    timeout: 2_000,
  }).toBe(14)
  await expect.poll(() => page.locator('.world-camera-snapshot').count()).toBe(0)

  // transaction完了後はlogical座標とvisual座標が再び完全に一致する。
  const settled = await currentVisualAlignment(page)
  expect(settled.compared).toBeGreaterThanOrEqual(2)
  expect(settled.maxCenterError).toBeLessThanOrEqual(settled.tolerance)
})

test('rapid入力の途中で方向を変えても順序を保って最終座標へ収束する', async ({ page }) => {
  await seedVillageRoad(page)
  const player = page.locator('.world-player-sprite')

  await rapidClick(page, ['右へ移動', '右へ移動', '左へ移動', '右へ移動', '右へ移動'])

  await expect.poll(async () => Number(await player.getAttribute('data-world-x')), { timeout: 2_000 }).toBe(9)
  await expect(player).toHaveAttribute('data-world-y', '6')
  await expect(player).toHaveAttribute('data-facing', 'right')
  await expect.poll(() => page.locator('.world-camera-snapshot').count()).toBe(0)
})

test('prefers-reduced-motionではrapid入力をanimation queue待ちなしで即時反映する', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedVillageRoad(page)
  const player = page.locator('.world-player-sprite')

  await rapidClick(page, ['右へ移動', '右へ移動', '左へ移動', '右へ移動', '右へ移動'])

  await expect(player).toHaveAttribute('data-world-x', '9')
  const snapshots = page.locator('.world-camera-snapshot')
  if (await snapshots.count()) {
    await expect(snapshots.first()).toHaveCSS('display', 'none')
  }
})
