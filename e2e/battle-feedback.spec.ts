import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedReplay(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 0 },
            clearedStageIds: [1],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [7],
            unlockedSkillIds: ['trace', 'pulse', 'nova'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 5,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: [],
            worldMapId: 'overworld',
            worldPosition: { x: 20, y: 14 },
            stepsSinceEncounter: 0,
            encounterCount: 0,
            currentHp: 108,
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
}

async function incomingDamage(card: ReturnType<Page['locator']>) {
  const text = await card.locator('.intent-box em').innerText()
  const match = text.match(/(\d+) DMG/)
  if (!match) throw new Error(`Could not read incoming damage: ${text}`)
  return Number(match[1])
}

test('Skillは選択時にtarget previewせず、実行後だけfirst-match traceを見せる', async ({ page }) => {
  await seedReplay(page)
  await page.goto('/javascript/battle/1?seed=feedback-semantic&returnTo=%2Fworld')

  const pulse = page.getByRole('button', { name: /^PULSE\b/ })
  const feedback = page.locator('.battle-semantic-feedback')
  const slime = page.locator('.enemy-card').filter({ hasText: 'Slime' })
  const goblin = page.locator('.enemy-card').filter({ hasText: 'Goblin' })

  await expect(feedback).toHaveCount(0)
  await expect(page.locator('[data-semantic-target="true"]')).toHaveCount(0)

  await pulse.click()
  await expect(pulse).toHaveClass(/selected/)
  await expect(feedback).toHaveCount(0)
  await expect(page.locator('[data-semantic-target="true"]')).toHaveCount(0)

  await pulse.click()

  await expect(feedback).toHaveAttribute('data-semantic-family', 'first-match')
  await expect(feedback).toContainText('FIRST MATCH')
  await expect(slime).toHaveAttribute('data-semantic-traced', 'true')
  await expect(goblin).toHaveAttribute('data-semantic-traced', 'true')
  await expect(goblin).toHaveAttribute('data-semantic-target', 'true')
})

test('Enemy Turnは攻撃者ごとにNEXT damageを対応させて順番に表示する', async ({ page }) => {
  await seedReplay(page)
  await page.goto('/javascript/battle/1?seed=feedback-enemy-turn&returnTo=%2Fworld')

  const pulse = page.getByRole('button', { name: /^PULSE\b/ })
  const slime = page.locator('.enemy-card').filter({ hasText: 'Slime' })
  const goblin = page.locator('.enemy-card').filter({ hasText: 'Goblin' })
  const playerDamage = page.locator('.player-damage-number')
  const slimeDamage = await incomingDamage(slime)
  const goblinDamage = await incomingDamage(goblin)

  await pulse.click()
  await pulse.click()

  await expect(slime).toHaveAttribute('data-enemy-attacking', 'true')
  await expect(playerDamage).toHaveText(`-${slimeDamage}`)
  await expect(goblin).not.toHaveAttribute('data-enemy-attacking', 'true')

  await expect(goblin).toHaveAttribute('data-enemy-attacking', 'true')
  await expect(playerDamage).toHaveText(`-${goblinDamage}`)

  await expect(page.getByText('TURN 02')).toBeVisible()
  await expect(page.locator('.log-enemy')).toContainText([
    `Slime / Nibble → ${slimeDamage} DMG`,
    `Goblin / Heavy Slash → ${goblinDamage} DMG`,
  ])
})

test('reduced-motionでもsemantic resultの意味情報を静的に残す', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedReplay(page)
  await page.goto('/javascript/battle/1?seed=feedback-reduced&returnTo=%2Fworld')

  const pulse = page.getByRole('button', { name: /^PULSE\b/ })
  await pulse.click()
  await pulse.click()

  const feedback = page.locator('.battle-semantic-feedback')
  await expect(feedback).toHaveAttribute('data-semantic-family', 'first-match')
  await expect(feedback).toContainText('Goblinで停止')
  await expect(page.locator('.enemy-card').filter({ hasText: 'Goblin' })).toHaveAttribute(
    'data-semantic-target',
    'true',
  )
  await expect(feedback).toHaveCSS('animation-name', 'none')
})
