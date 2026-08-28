import { describe, expect, it } from 'vitest'
import { battles } from '../game/battles'
import {
  applyBattleVictory,
  createInitialPlayerProgress,
  getBattleGoldReward,
  getPlayerStats,
  restorePlayerProgress,
  serializePlayerProgress,
} from '../progression'
import {
  createInitialRpgState,
  equipItem,
  getCombatStats,
  restoreRpgState,
  serializeRpgState,
} from '../rpg'
import { worldTreasureDefinitions } from '../world/treasures'
import { consumePatchKit, PATCH_KIT_PRICE } from './economy'
import { INN_REST_PRICE, resolveInnRest } from './inn'
import { getShopItemPrice, purchaseShopItem, worldShopItems } from './shop'

describe('RPG economy integration', () => {
  it('JS初回100GでEquipment + PATCH KIT + Innを選び、save / restore後も整合する', () => {
    let progress = createInitialPlayerProgress()

    for (const battle of battles.filter((candidate) => candidate.id >= 1 && candidate.id <= 3)) {
      progress = applyBattleVictory(progress, {
        stageId: battle.id,
        expReward: battle.expReward,
        goldReward: battle.goldReward,
      }).progress
    }

    expect(progress.gold).toBe(100)

    let rpgState = createInitialRpgState()
    const equipmentPurchase = purchaseShopItem(progress, rpgState, 'life-charm')
    expect(equipmentPurchase.purchased).toBe(true)
    progress = equipmentPurchase.progress
    rpgState = equipmentPurchase.rpgState
    expect(progress.gold).toBe(50)
    expect(rpgState.ownedEquipmentIds).toContain('life-charm')

    rpgState = {
      ...rpgState,
      equipment: equipItem(rpgState.equipment, 'life-charm'),
    }
    expect(rpgState.equipment.accessory).toBe('life-charm')

    const itemPurchase = purchaseShopItem(progress, rpgState, 'patch-kit')
    expect(itemPurchase.purchased).toBe(true)
    progress = itemPurchase.progress
    rpgState = itemPurchase.rpgState
    expect(progress.gold).toBe(INN_REST_PRICE)
    expect(progress.inventory.patchKit).toBe(1)

    const stats = getPlayerStats(progress.exp)
    const combatStats = getCombatStats(stats, rpgState)
    expect(rpgState.currentHp).toBeLessThan(combatStats.maxHp)

    const rest = resolveInnRest(progress, rpgState, combatStats.maxHp)
    expect(rest.rested).toBe(true)
    progress = rest.progress
    rpgState = rest.rpgState
    expect(progress.gold).toBe(0)
    expect(rpgState.currentHp).toBe(combatStats.maxHp)

    const restoredProgress = restorePlayerProgress(serializePlayerProgress(progress))
    const restoredRpg = restoreRpgState(serializeRpgState(rpgState), stats.maxHp)

    expect(restoredProgress.gold).toBe(0)
    expect(restoredProgress.inventory.patchKit).toBe(1)
    expect(restoredRpg.ownedEquipmentIds).toContain('life-charm')
    expect(restoredRpg.equipment.accessory).toBe('life-charm')
    expect(restoredRpg.currentHp).toBe(combatStats.maxHp)
  })

  it('replay 1周では初回+TreasureからShop全商品を即買い切れない', () => {
    const javascriptBattles = battles.filter((battle) => battle.id >= 1 && battle.id <= 3)
    const firstClearGold = javascriptBattles.reduce((total, battle) => total + battle.goldReward, 0)
    const treasureGold = worldTreasureDefinitions['js-debug-cache'].reward.gold
    const oneReplayGold = javascriptBattles.reduce(
      (total, battle) => total + getBattleGoldReward(battle.goldReward, false),
      0,
    )
    const allShopGold = worldShopItems.reduce(
      (total, item) => total + getShopItemPrice(item),
      0,
    )

    expect(firstClearGold).toBe(100)
    expect(PATCH_KIT_PRICE).toBe(30)
    expect(INN_REST_PRICE).toBe(20)
    expect(firstClearGold).toBe(50 + PATCH_KIT_PRICE + INN_REST_PRICE)
    expect(firstClearGold + treasureGold).toBe(120)
    expect(oneReplayGold).toBe(50)
    expect(firstClearGold + treasureGold + oneReplayGold).toBe(170)
    expect(allShopGold).toBe(195)
    expect(firstClearGold + treasureGold + oneReplayGold).toBeLessThan(allShopGold)
  })

  it('legacy Player v3 + RPG v2を同時restoreしてもEconomyと装備を安全に引き継ぐ', () => {
    const legacyProgress = JSON.stringify({
      version: 3,
      progress: {
        exp: 320,
        clearedStageIds: [1, 2, 3],
        clearedAreaIds: ['javascript'],
        completedSideQuestIds: ['javascript-second-pass'],
        unlockedStageIds: [1, 2, 3],
        unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper', 'moon-edge'],
      },
    })
    const initialRpg = createInitialRpgState()
    const legacyRpg = JSON.stringify({
      version: 2,
      state: {
        ...initialRpg,
        ownedEquipmentIds: [...initialRpg.ownedEquipmentIds, 'debug-charm'],
        equipment: { ...initialRpg.equipment, accessory: 'debug-charm' },
        currentHp: 61,
      },
    })

    const progress = restorePlayerProgress(legacyProgress)
    const rpgState = restoreRpgState(legacyRpg, getPlayerStats(progress.exp).maxHp)

    expect(progress.gold).toBe(0)
    expect(progress.inventory.patchKit).toBe(0)
    expect(progress.clearedAreaIds).toEqual(['javascript'])
    expect(rpgState.ownedEquipmentIds).toContain('debug-charm')
    expect(rpgState.equipment.accessory).toBe('debug-charm')
    expect(rpgState.currentHp).toBe(61)
  })

  it('PATCH KIT 0個からconsumeしてもInventoryはunderflowしない', () => {
    const progress = createInitialPlayerProgress()
    const result = consumePatchKit(progress, 40, 100)

    expect(result.consumed).toBe(false)
    expect(result.progress.inventory.patchKit).toBe(0)
  })
})
