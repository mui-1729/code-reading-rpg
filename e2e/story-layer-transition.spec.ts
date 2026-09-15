import { expect, test } from '@playwright/test'
import { JS_BOSS_PREREQS } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

type Entry = {
  kind: string | null
  phase: string | null
  layer: string | null
}

test('Battle StoryのREMOTE→CODE WORLDもconnectで覆ってからlineを切り替える', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, clearedStageIds }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 0,
          inventory: { patchKit: 0 },
          clearedStageIds,
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 7],
          unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
        },
      }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 4,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: ['byte'],
          partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
          worldMapId: 'overworld',
          worldPosition: { x: 40, y: 6 },
          stepsSinceEncounter: 8,
          encounterCount: 0,
          currentHp: 100,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      clearedStageIds: [...JS_BOSS_PREREQS],
    },
  )

  await page.goto('/javascript/battle/3?seed=story-layer-transition&returnTo=%2Fworld')
  const story = page.getByRole('dialog', { name: 'Code Coreへ' })
  await expect(story).toHaveAttribute('data-story-layer', 'remote')

  await page.evaluate(() => {
    const target = window as Window & { __storyLayerTimeline?: Entry[] }
    target.__storyLayerTimeline = []
    const record = () => {
      const transition = document.querySelector<HTMLElement>('.scene-transition')
      target.__storyLayerTimeline?.push({
        kind: transition?.dataset.sceneTransitionKind ?? null,
        phase: transition?.dataset.sceneTransitionPhase ?? null,
        layer: document.querySelector<HTMLElement>('.battle-story-window')?.dataset.storyLayer ?? null,
      })
    }
    const observer = new MutationObserver(record)
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-scene-transition-phase', 'data-story-layer'],
    })
    record()
  })

  await story.getByRole('button', { name: '▶ 次へ' }).click()
  await expect(story).toHaveAttribute('data-story-layer', 'code-world')
  await expect(page.locator('.scene-transition')).toHaveCount(0)

  const timeline = await page.evaluate(() => (
    (window as Window & { __storyLayerTimeline?: Entry[] }).__storyLayerTimeline ?? []
  ))
  const covering = timeline.findIndex((entry) =>
    entry.kind === 'connect' && entry.phase === 'covering' && entry.layer === 'remote')
  const revealing = timeline.findIndex((entry) =>
    entry.kind === 'connect' && entry.phase === 'revealing' && entry.layer === 'code-world')

  expect(covering).toBeGreaterThanOrEqual(0)
  expect(revealing).toBeGreaterThan(covering)
})
