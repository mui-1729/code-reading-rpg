import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

type RapidVisualOffset = {
  id: string
  x: number
  y: number
}

type RapidVisualFrame = {
  tileWidth: number
  tileHeight: number
  partyOffsets: RapidVisualOffset[]
  npcOffsets: RapidVisualOffset[]
  snapshotCount: number
}

type RapidVisualCaptureState = {
  frames: RapidVisualFrame[]
  done: boolean
}

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

async function beginRapidVisualCapture(page: Page, expectedPlayerX: number) {
  await page.evaluate((expectedX) => {
    const captureWindow = window as Window & { __rapidMoveVisualCapture?: RapidVisualCaptureState }
    const capture: RapidVisualCaptureState = { frames: [], done: false }
    captureWindow.__rapidMoveVisualCapture = capture
    const startedAt = performance.now()

    const centerOf = (element: HTMLElement | null) => {
      if (!element) return null
      const rect = element.getBoundingClientRect()
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    }

    const relativeOffset = (overlay: HTMLElement, id: string): RapidVisualOffset | null => {
      const x = overlay.dataset.worldX
      const y = overlay.dataset.worldY
      if (x === undefined || y === undefined) return null
      const tile = document.querySelector<HTMLElement>(
        `.world-tile[data-world-x="${x}"][data-world-y="${y}"]`,
      )
      const overlayCenter = centerOf(overlay)
      const tileCenter = centerOf(tile)
      if (!overlayCenter || !tileCenter) return null
      return {
        id,
        x: overlayCenter.x - tileCenter.x,
        y: overlayCenter.y - tileCenter.y,
      }
    }

    const sample = () => {
      const tile = document.querySelector<HTMLElement>('.world-tile')
      const tileRect = tile?.getBoundingClientRect()
      const player = document.querySelector<HTMLElement>('.world-player-sprite')
      const follower = document.querySelector<HTMLElement>('.world-follower-sprite')
      const partyOffsets = [
        player ? relativeOffset(player, 'player') : null,
        follower ? relativeOffset(follower, 'follower') : null,
      ].filter((offset): offset is RapidVisualOffset => offset !== null)
      const npcOffsets = Array.from(document.querySelectorAll<HTMLElement>('.world-npc-sprite')).flatMap((npc) => {
        const npcId = npc.dataset.worldNpc
        if (!npcId) return []
        const offset = relativeOffset(npc, npcId)
        return offset ? [offset] : []
      })

      capture.frames.push({
        tileWidth: tileRect?.width ?? 0,
        tileHeight: tileRect?.height ?? 0,
        partyOffsets,
        npcOffsets,
        snapshotCount: document.querySelectorAll('.world-camera-snapshot').length,
      })

      const settled =
        player?.dataset.worldX === String(expectedX)
        && document.querySelectorAll('.world-camera-snapshot').length === 0
        && capture.frames.length > 2
      const timedOut = performance.now() - startedAt >= 2_500
      if (settled || timedOut) {
        capture.done = true
        return
      }
      requestAnimationFrame(sample)
    }

    requestAnimationFrame(sample)
  }, expectedPlayerX)
}

async function readRapidVisualCapture(page: Page) {
  return page.evaluate(() => {
    const captureWindow = window as Window & { __rapidMoveVisualCapture?: RapidVisualCaptureState }
    return captureWindow.__rapidMoveVisualCapture ?? { frames: [], done: false }
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

  await beginRapidVisualCapture(page, 14)
  await rapidClick(page, Array(8).fill('右へ移動'))

  await expect.poll(async () => (await readRapidVisualCapture(page)).done, { timeout: 3_000 }).toBe(true)
  const capture = await readRapidVisualCapture(page)
  expect(capture.frames.length).toBeGreaterThan(5)

  let comparedPartyFrames = 0
  let comparedNpcFrames = 0
  for (const frame of capture.frames) {
    expect(frame.tileWidth).toBeGreaterThan(0)
    expect(frame.tileHeight).toBeGreaterThan(0)
    expect(frame.snapshotCount).toBeLessThanOrEqual(1)

    // Player / BYTEは1stepのleft/top transition中なので、対応するlogical tileから
    // 1tileを超えて離れたframeがあればvisual transactionのsnap/破綻とみなす。
    const oneTileTolerance = Math.max(frame.tileWidth, frame.tileHeight) * 1.05
    for (const party of frame.partyOffsets) {
      expect(Math.hypot(party.x, party.y)).toBeLessThanOrEqual(oneTileTolerance)
      comparedPartyFrames += 1
    }

    // static NPCはterrainと同じcamera transformを受けるため、対応tileとのoffsetは不変であるべき。
    for (const npc of frame.npcOffsets) {
      expect(Math.hypot(npc.x, npc.y)).toBeLessThan(1.5)
      comparedNpcFrames += 1
    }
  }

  expect(comparedPartyFrames).toBeGreaterThan(0)
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
