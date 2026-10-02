import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('@responsive GREENFIELD VILLAGEは入口からTRAIN・宿・道具屋を読み取り、工房へ歩いて訪れる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 12,
          gold: 20,
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
          partyMemberIds: [],
          partyEquipment: {},
          worldMapId: 'js-village',
          worldPosition: { x: 10, y: 12 },
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
  const village = page.locator('.world-viewport[data-world-map="js-village"]')
  await expect(village).toBeVisible()
  await page.getByRole('button', {name: '上へ移動', exact: true}).click()
  await expect(village.locator('[data-world-x="12"][data-world-y="7"].terrain-training')).toBeVisible()
  await expect(village.locator('[data-world-x="10"][data-world-y="8"]')).toBeVisible()
  await expect(village.locator('[data-world-x="10"][data-world-y="14"].terrain-exit')).toBeVisible()

  for (const npcId of ['trainer-mio', 'village-child', 'misfire-adventurer']) {
    await expect(village.locator(`[data-world-npc="${npcId}"]`)).toBeVisible()
  }

  for (const npcId of ['village-child', 'misfire-adventurer']) {
    await expect(village.locator(`[data-world-npc="${npcId}"] .world-resident-marker`)).toHaveCSS('font-size', '0px')
  }

  const facilities = [
    { kind: 'inn', x: '5', y: '11' },
    { kind: 'item-shop', x: '14', y: '11' },
  ] as const
  for (const facility of facilities) {
    const tile = village.locator(
      `.terrain-house[data-world-x="${facility.x}"][data-world-y="${facility.y}"]`,
    )
    const sign = tile.locator(`[data-village-facility="${facility.kind}"]`)
    await expect(tile).toBeVisible()
    await expect(sign).toBeVisible()
  }

  const entryGeometry = await village.evaluate((viewport) => {
    const bounds = viewport.getBoundingClientRect()
    const facilitySigns = Array.from(viewport.querySelectorAll<HTMLElement>('[data-village-facility]'))
    return {
      allFacilitiesInsideViewport: facilitySigns.every((sign) => {
        const rect = sign.getBoundingClientRect()
        return rect.left >= bounds.left && rect.right <= bounds.right && rect.top >= bounds.top && rect.bottom <= bounds.bottom
      }),
      visibleFacilities: facilitySigns.length,
    }
  })
  expect(entryGeometry.visibleFacilities).toBe(2)
  expect(entryGeometry.allFacilitiesInsideViewport).toBe(true)

  const leftRoof = village.locator('.terrain-house[data-world-x="5"][data-world-y="9"]')
  const rightRoof = village.locator('.terrain-house[data-world-x="14"][data-world-y="9"]')
  const [leftRoofShape, rightRoofShape] = await Promise.all([
    leftRoof.evaluate((element) => getComputedStyle(element, '::before').clipPath),
    rightRoof.evaluate((element) => getComputedStyle(element, '::before').clipPath),
  ])
  expect(leftRoofShape).not.toBe('none')
  expect(rightRoofShape).not.toBe('none')

  const entryPurpose = await village.locator('.world-entry-transition').evaluate((element) =>
    getComputedStyle(element, '::after').content,
  )
  expect(entryPurpose).toContain('安全な中継地点')
})


test('@responsive Villageの東住宅街と工房は歩いて探索でき、川辺の宝箱へ回り道できる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('code-reading-rpg:player-progress', JSON.stringify({version: 4, progress: {exp:12, gold:20, inventory:{patchKit:0}, clearedStageIds:[1], clearedAreaIds:[], completedSideQuestIds:[], unlockedStageIds:[1,7], unlockedSkillIds:['trace','pulse','nova']}}))
    localStorage.setItem('code-reading-rpg:rpg-state', JSON.stringify({version:5, state:{equipment:{weapon:'training-blade',armor:'traveler-coat',accessory:null},ownedEquipmentIds:['training-blade','traveler-coat'],partyMemberIds:[],partyEquipment:{},worldMapId:'js-village',worldPosition:{x:10,y:12},stepsSinceEncounter:0,encounterCount:0,currentHp:108,openedTreasureIds:[]}}))
    localStorage.setItem('code-reading-rpg:tutorial', JSON.stringify({version:1,status:'skipped',phase:'battle'}))
  })
  await page.goto('/world')
  const village = page.locator('.world-viewport[data-world-map="js-village"]')
  await expect(village.locator('[data-village-facility="equipment-shop"]')).toHaveCount(0)
  let x = 10
  let y = 12
  const move = async (name: string, count: number) => {
    for (let step=0; step<count; step+=1) {
      await page.getByRole('button', {name, exact:true}).click()
      if (name === '上へ移動') y -= 1
      if (name === '下へ移動') y += 1
      if (name === '左へ移動') x -= 1
      if (name === '右へ移動') x += 1
      await expect(village).toHaveAttribute('data-world-x', String(x))
      await expect(village).toHaveAttribute('data-world-y', String(y))
    }
  }
  await move('下へ移動', 1)
  await move('右へ移動', 10)
  await move('上へ移動', 5)
  await expect(village.locator('[data-world-npc="forest-traveler"]')).toBeVisible()
  await move('下へ移動', 11)
  await move('右へ移動', 4)
  await page.getByRole('button', {name:'上へ移動', exact:true}).click()
  await page.getByRole('button', {name:'装備屋を見る', exact:true}).click()
  await expect(page.getByRole('dialog', {name:'装備屋',exact:true})).toBeVisible()
  await page.keyboard.press('Escape')
  await move('左へ移動', 16)
  await move('下へ移動', 1)
  await expect(village.locator('[data-world-x="8"][data-world-y="21"].terrain-treasure')).toBeVisible()
  await page.getByRole('button', {name:'下へ移動', exact:true}).click()
  await expect(page.getByRole('button', {name:/宝箱を開ける/})).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})
