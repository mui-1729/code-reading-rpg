import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedBattle(page: Page) {
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
            inventory: { patchKit: 1 },
            clearedStageIds: [1],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 7],
            unlockedSkillIds: ['trace', 'pulse', 'nova'],
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
            worldPosition: { x: 10, y: 11 },
            stepsSinceEncounter: 0,
            encounterCount: 5,
            currentHp: 40,
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

test('Random Encounterはrootから戦う / アイテム / 逃げるを選び各submenuに入る', async ({ page }) => {
  await seedBattle(page)
  await page.goto('/javascript/battle/1?seed=encounter:5:10:11&returnTo=%2Fworld')

  let commands = page.getByRole('group', { name: '戦闘コマンド' })
  await expect(commands.getByRole('button', { name: '戦う', exact: true })).toBeVisible()
  await expect(commands.getByRole('button', { name: 'アイテム', exact: true })).toBeVisible()
  await expect(commands.getByRole('button', { name: '逃げる', exact: true })).toBeVisible()
  await expect(page.getByRole('group', { name: 'スキル' })).toBeHidden()

  await commands.getByRole('button', { name: '戦う', exact: true }).click()
  await expect(commands).toBeHidden()
  const skills = page.getByRole('group', { name: 'スキル' })
  const fightBack = page.getByRole('group', { name: '戦闘サブメニュー操作' }).getByRole('button', { name: '← 戻る' })
  await expect(skills).toBeVisible()
  await expect(fightBack).toBeVisible()
  await page.getByRole('button', { name: /^TRACE\b/ }).click()
  await expect(page.getByLabel('戦闘詳細')).toContainText('TRACE')

  await fightBack.click()
  commands = page.getByRole('group', { name: '戦闘コマンド' })
  await expect(commands).toBeVisible()
  await expect(skills).toBeHidden()

  await commands.getByRole('button', { name: 'アイテム', exact: true }).click()
  await expect(commands).toBeHidden()
  await expect(skills).toBeHidden()
  const itemMenu = page.getByRole('group', { name: 'アイテム選択' })
  const itemBack = page.getByRole('group', { name: '戦闘サブメニュー操作' }).getByRole('button', { name: '← 戻る' })
  await expect(itemMenu).toBeVisible()
  await expect(itemBack).toBeVisible()

  const patchKit = itemMenu.locator('.battle-item-browser-row[data-item-id="patch-kit"]')
  await expect(patchKit).toContainText('PATCH KIT')
  await expect(patchKit).toContainText('×1')
  await patchKit.click()
  await expect(page.locator('.battle-item-detail[data-item-id="patch-kit"]')).toBeVisible()
  await expect(itemMenu.getByRole('button', { name: /PATCH KIT ×1を使う/ })).toBeEnabled()
  await itemMenu.getByRole('button', { name: /PATCH KIT ×1を使う/ }).click()
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')

  await itemBack.click()
  await expect(page.getByRole('group', { name: '戦闘コマンド' })).toBeVisible()
})

test('escape不可Battleでは逃げるcommandを表示しない', async ({ page }) => {
  await seedBattle(page)
  await page.goto('/javascript/battle/1?seed=fixed-test&returnTo=%2Fworld')

  const commands = page.getByRole('group', { name: '戦闘コマンド' })
  await expect(commands.getByRole('button', { name: '戦う', exact: true })).toBeVisible()
  await expect(commands.getByRole('button', { name: 'アイテム', exact: true })).toBeVisible()
  await expect(commands.getByRole('button', { name: '逃げる', exact: true })).toHaveCount(0)
})
