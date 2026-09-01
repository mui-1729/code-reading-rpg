import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorld(page: Parameters<typeof test>[0] extends never ? never : any) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }: { progressKey: string; rpgKey: string; tutorialKey: string }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 0 },
            clearedStageIds: [],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [],
            unlockedSkillIds: [],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 5,
          state: {
            equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: [],
            partyEquipment: {},
            worldMapId: 'overworld',
            worldPosition: { x: 20, y: 14 },
            stepsSinceEncounter: 0,
            encounterCount: 0,
            currentHp: 100,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )
  await page.goto('/world')
}

test('FIELD LOGの表示・長文化でD-PadとINTERACTの位置が変わらない', async ({ page }) => {
  await seedWorld(page)

  const readPositions = () =>
    page.evaluate(() => {
      const dpad = document.querySelector<HTMLElement>('.world-dpad')
      const interact = document.querySelector<HTMLElement>('.world-interact')
      if (!dpad || !interact) return null
      return {
        dpadTop: dpad.getBoundingClientRect().top,
        interactTop: interact.getBoundingClientRect().top,
      }
    })

  const ambient = await readPositions()
  expect(ambient).not.toBeNull()

  await page.locator('.world-message').evaluate((log) => {
    const element = log as HTMLElement
    element.dataset.logPriority = 'event'
    const paragraph = element.querySelector('p')
    if (paragraph) paragraph.textContent = 'イベントが発生した。操作位置は変わらない。'
  })
  const event = await readPositions()
  expect(event).toEqual(ambient)

  await page.locator('.world-message').evaluate((log) => {
    const paragraph = log.querySelector('p')
    if (paragraph) {
      paragraph.textContent =
        'これは複数行になる長いイベントメッセージです。FIELD LOGが長くなってもD-PadとINTERACTは同じ位置に残ります。追加の情報もこの固定slot内で読めます。'
    }
  })
  const longEvent = await readPositions()
  expect(longEvent).toEqual(ambient)
  await expect(page.locator('.world-message')).toBeVisible()
})
