import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const initialSkills = ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label']

const rpg = {
  version: 3,
  state: {
    equipment: {
      weapon: 'training-blade',
      armor: 'traveler-coat',
      accessory: null,
    },
    ownedEquipmentIds: ['training-blade', 'traveler-coat'],
    partyMemberIds: [],
    partyEquipment: {},
    worldPosition: { x: 20, y: 14 },
    stepsSinceEncounter: 8,
    encounterCount: 0,
    currentHp: 108,
    openedTreasureIds: [],
  },
}

async function seedStorage(
  page: Page,
  clearedStageIds: number[],
  unlockedStageIds: number[],
) {
  const progress = {
    version: 4,
    progress: {
      exp: 0,
      gold: 0,
      inventory: { patchKit: 0 },
      clearedStageIds,
      clearedAreaIds: clearedStageIds.includes(3) ? ['javascript'] : [],
      completedSideQuestIds: [],
      unlockedStageIds,
      unlockedSkillIds: initialSkills,
    },
  }

  await page.goto('/')
  await page.evaluate(
    ({ progressValue, rpgValue, progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify(progressValue))
      localStorage.setItem(rpgKey, JSON.stringify(rpgValue))
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    {
      progressValue: progress,
      rpgValue: rpg,
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
    },
  )
}

async function executeSkill(page: Page, name: string) {
  const card = page.getByRole('button', { name: new RegExp(`^${name}\\b`) })
  await expect(card).toBeEnabled()
  await card.click()
  await expect(card).toHaveClass(/selected/)
  await card.click()
}

async function enemyHp(card: ReturnType<Page['locator']>) {
  const text = await card.locator('.enemy-name-row span').innerText()
  return Number(text.split('/')[0])
}

test.describe('Boss GUARD', () => {
  test('JS Bossはminion生存中1 damageに抑え、全滅直後にOPENになる', async ({ page }) => {
    await seedStorage(page, [], [1, 3, 4, 7])
    await page.goto('/javascript/battle/3?seed=boss-guard-js-e2e&returnTo=%2Fworld')

    const briefing = page.getByRole('dialog', { name: 'Code Coreへ' })
    await expect(briefing).toBeVisible()
    await briefing.getByRole('button', { name: 'SKIP' }).click()

    const boss = page.locator('.enemy-card.is-boss-enemy')
    await expect(page.getByLabel('Boss Guard ACTIVE')).toBeVisible()
    await expect(page.getByLabel('Boss Guard ACTIVE')).toContainText(
      'enemies.some(e => e.name !== "Boss" && e.hp > 0)',
    )

    const guardedHpBefore = await enemyHp(boss)
    await executeSkill(page, 'ALERT')
    await expect.poll(() => enemyHp(boss)).toBe(guardedHpBefore - 1)
    await expect(page.getByText('BOSS GUARD → total damage to Boss capped at 1')).toBeVisible()
    await expect(page.getByText('TURN 02')).toBeVisible()

    await executeSkill(page, 'MOON EDGE')
    await expect(page.getByText('TURN 03')).toBeVisible()

    await executeSkill(page, 'PULSE')
    await expect(page.getByText('TURN 04')).toBeVisible()

    await executeSkill(page, 'PULSE')
    await expect(page.getByLabel('Boss Guard OPEN')).toBeVisible()
    await expect(page.getByText('TURN 05')).toBeVisible()

    const hpBeforeOpenHit = await enemyHp(boss)
    await executeSkill(page, 'ALERT')
    await expect.poll(() => enemyHp(boss)).toBeLessThan(hpBeforeOpenHit - 1)
  })

  test('TS BossでもGUARDがBossだけを1 damageへ抑える', async ({ page }) => {
    await seedStorage(page, [3], [1, 4, 6, 7])
    await page.goto('/typescript/battle/6?seed=boss-guard-ts-e2e&returnTo=%2Fworld')

    const briefing = page.getByRole('dialog', { name: 'Frontier Compilerへ' })
    await expect(briefing).toBeVisible()
    await briefing.getByRole('button', { name: 'SKIP' }).click()

    const boss = page.locator('.enemy-card.is-boss-enemy')
    const goblin = page.locator('.enemy-card').filter({ hasText: 'Goblin' })
    await expect(page.getByLabel('Boss Guard ACTIVE')).toBeVisible()

    const bossHpBefore = await enemyHp(boss)
    const goblinHpBefore = await enemyHp(goblin)
    await executeSkill(page, 'TYPE GUARD')
    await expect.poll(() => enemyHp(boss)).toBe(bossHpBefore - 1)
    await expect.poll(() => enemyHp(goblin)).toBeLessThan(goblinHpBefore - 1)
  })
})
