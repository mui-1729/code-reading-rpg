import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from './audio/gameAudio'
import { useBattleRuntime } from './battle/BattleRuntimeContext'
import { withBattleHp } from './battle/resultHandoff'
import { createBattleSession, type BattleReturnPath } from './battle/session'
import { useBattleSession } from './battle/useBattleSession'
import { SourceCode } from './battle/SourceCode'
import { consumePatchKit } from './economy'
import { BattleItemPanel } from './economy/BattleItemPanel'
import { BattleEscapePanel } from './game/BattleEscapePanel'
import {
  areaById,
  getBattlePresentation,
  getEnemyVisualId,
  getSkillCardsForBattle,
  resolveEnemyAttack,
  resolvePlayerAction,
  skills,
  type Enemy,
  type Seed,
  type SkillCard,
} from './game'
import {
  BOSS_GUARD_CONDITION_CODE,
  hasBossGuard,
  isBossGuardActive,
} from './game/bossGuard'
import { BattleCodeData, type RuntimeEnemy } from './inspector'
import {
  getBattleSemanticFeedback,
  type BattleSemanticFeedback,
} from './motion/battleFeedback'
import { BATTLE_MOTION, getNewlyDefeatedIds } from './motion/battleMotion'
import {
  applyBattleVictory,
  useProgress,
  type BattleVictoryReward,
} from './progression'
import { BattleResultSequence } from './results/BattleResultSequence'
import { createVictoryResultSequence, type ResultSequenceItem } from './results/resultSequence'
import {
  characterVisuals,
  equipmentById,
  getCombatStats,
  getIncomingDamage,
  getPartyFollowUpDamage,
  getSkillDamage,
  getWeaponVisual,
  partyMemberById,
  useRpg,
} from './rpg'
import { BattleStoryEvent } from './story/BattleStoryEvent'
import { getBattleStoryEventForBattle } from './story/battleStoryEvents'
import { getWorldProgressChange } from './world/worldObjective'
import { useModalFocus } from './ui/useModalFocus'

type Phase = 'battle' | 'victory' | 'defeat'

type LogEntry = {
  id: number
  tone: 'player' | 'enemy' | 'system'
  text: string
}

type AppProps = {
  battleId: number
  seed: Seed
  returnTo?: BattleReturnPath
}

const cloneEnemies = (enemies: Enemy[]) => enemies.map((enemy) => ({ ...enemy }))

function App({ battleId, seed, returnTo }: AppProps) {
  const navigate = useNavigate()
  const { setSnapshot } = useBattleRuntime()
  const { progress, stats: baseStats } = useProgress()
  const { rpgState } = useRpg()
  const playerStats = useMemo(
    () => getCombatStats(baseStats, rpgState),
    [baseStats, rpgState],
  )
  const playerHp = Math.max(0, Math.min(playerStats.maxHp, rpgState.currentHp))
  const partyFollowUpDamage = getPartyFollowUpDamage(rpgState.partyMemberIds, playerStats.level)
  const equippedWeaponVisual = getWeaponVisual(rpgState.equipment.weapon)
  const session = useMemo(
    () => createBattleSession(battleId, seed, returnTo),
    [battleId, returnTo, seed],
  )
  const { battle, nextBattle } = session
  const battleArea = areaById[battle.areaId]
  const battlePresentation = getBattlePresentation(battle)
  const { schedule, updateState, finish, rollback } = useBattleSession({
    areaId: battle.areaId, battleId, seed: String(seed), returnTo,
  })

  const [phase, setPhase] = useState<Phase>('battle')
  const [enemies, setEnemies] = useState<Enemy[]>(cloneEnemies(battle.enemies))
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)
  const [explainedSkill, setExplainedSkill] = useState<SkillCard | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [turn, setTurn] = useState(1)
  const [animatingIds, setAnimatingIds] = useState<string[]>([])
  const [defeatingIds, setDefeatingIds] = useState<string[]>([])
  const [damagePopups, setDamagePopups] = useState<Record<string, number>>({})
  const [playerDamagePopup, setPlayerDamagePopup] = useState<number | null>(null)
  const [playerHit, setPlayerHit] = useState(false)
  const [skillWindup, setSkillWindup] = useState(false)
  const [enemyTurnActive, setEnemyTurnActive] = useState(false)
  const [activeEnemyId, setActiveEnemyId] = useState<string | null>(null)
  const [semanticFeedback, setSemanticFeedback] = useState<BattleSemanticFeedback | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [patchKitUsed, setPatchKitUsed] = useState(false)
  const [lastPatchKitHeal, setLastPatchKitHeal] = useState<number | null>(null)
  const [partyFollowUpActive, setPartyFollowUpActive] = useState(false)
  const [victoryReward, setVictoryReward] = useState<BattleVictoryReward | null>(null)
  const [resultItems, setResultItems] = useState<ResultSequenceItem[]>([])
  const [resultSequenceDone, setResultSequenceDone] = useState(false)
  const completeResultSequence = useCallback(() => setResultSequenceDone(true), [])
  const [storyEvent, setStoryEvent] = useState(() =>
    getBattleStoryEventForBattle(battle.areaId, battle.id, 'pre', progress.clearedStageIds),
  )
  const [codeDataOpen, setCodeDataOpen] = useState(false)
  const [inspectedEnemyKey, setInspectedEnemyKey] = useState<string | null>(null)
  const codeHelpOpenerRef = useRef<HTMLElement | null>(null)
  const getCodeHelpRestoreTarget = useCallback(() => codeHelpOpenerRef.current, [])

  const availableSkills = useMemo(
    () => getSkillCardsForBattle(battle, seed, progress.unlockedSkillIds),
    [battle, progress.unlockedSkillIds, seed],
  )
  const selectedSkill = useMemo(
    () => availableSkills.find((skill) => skill.id === selectedSkillId) ?? null,
    [availableSkills, selectedSkillId],
  )
  const codeDataEnemies = useMemo<RuntimeEnemy[]>(
    () =>
      enemies.map((enemy) => ({
        key: enemy.id,
        name: enemy.name,
        role: enemy.role,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        attackName: enemy.attackName,
        attackDamage: enemy.attackDamage,
        incomingDamage: getIncomingDamage(enemy.attackDamage, playerStats.defense),
      })),
    [enemies, playerStats],
  )
  const bossGuardEnabled = hasBossGuard(battle)
  const bossGuardActive = isBossGuardActive(battle, enemies)
  const actionLocked = isResolving || phase !== 'battle' || Boolean(storyEvent || explainedSkill || codeDataOpen)

  useLayoutEffect(() => {
    setSnapshot({
      areaId: battle.areaId,
      battleId: battle.id,
      capabilities: battleArea.capabilities,
      enemies,
      isModalOpen: Boolean(storyEvent || explainedSkill || codeDataOpen),
      isResolving,
      phase,
      playerHp,
      playerMaxHp: playerStats.maxHp,
      selectedSkillId,
      turn,
      result: victoryReward,
    })
    return () => setSnapshot(null)
  }, [battle.areaId, battle.id, battleArea.capabilities, codeDataOpen, enemies, explainedSkill, isResolving, phase, playerHp, playerStats.maxHp, selectedSkillId, setSnapshot, storyEvent, turn, victoryReward])

  useEffect(() => {
    const track = battlePresentation.bgmTrack
    gameAudio.requestBgm(track)
    return () => gameAudio.releaseBgm(track)
  }, [battlePresentation.bgmTrack])

  useLayoutEffect(() => {
    document.body.dataset.battlePhase = phase
    document.body.dataset.battleResolving = isResolving ? 'true' : 'false'
    document.body.dataset.battleScene = battlePresentation.sceneId
    document.body.dataset.battleArena = battlePresentation.arenaKind
    return () => {
      delete document.body.dataset.battlePhase
      delete document.body.dataset.battleResolving
      delete document.body.dataset.battleScene
      delete document.body.dataset.battleArena
    }
  }, [battlePresentation.arenaKind, battlePresentation.sceneId, isResolving, phase])

  const addLog = (tone: LogEntry['tone'], text: string) => {
    setLogs((current) => [...current.slice(-4), { id: Date.now() + Math.random(), tone, text }])
  }

  const completeVictory = () => {
    const battleResult = applyBattleVictory(progress, {
      stageId: battle.id,
      expReward: battle.expReward,
      goldReward: battle.goldReward,
      nextStageId: nextBattle?.id,
      unlockSkillId: battle.unlockSkillId,
      clearAreaId: battle.isBoss ? battle.areaId : undefined,
    })
    const reward: BattleVictoryReward = battleResult.reward

    gameAudio.stopBgm()
    gameAudio.playSe('victory')
    if (reward.newLevel > reward.previousLevel) {
      schedule(() => gameAudio.playSe('levelUp'), 420)
    }
    if (reward.firstClear) {
      schedule(() => gameAudio.playSe('stageClear'), 720)
    }
    if (reward.unlockedSkillId) {
      schedule(() => gameAudio.playSe('skillUnlock'), 1040)
    }

    finish('VICTORY', (current) => ({ ...current, progress: battleResult.progress }))
    setVictoryReward(reward)
    const clearedArea = reward.clearedAreaId ? areaById[reward.clearedAreaId] : undefined
    const equipmentId = clearedArea?.clearRewardEquipmentId
    setResultItems(createVictoryResultSequence(reward, {
      unlockedSkillName: reward.unlockedSkillId ? skills[reward.unlockedSkillId]?.name : undefined,
      clearedAreaTitle: clearedArea?.title.toUpperCase(),
      worldFeedback: getWorldProgressChange(progress, battleResult.progress),
      equipment: equipmentId ? equipmentById[equipmentId] : undefined,
    }))
    if (reward.firstClear) setStoryEvent(getBattleStoryEventForBattle(battle.areaId, battle.id, 'post'))
    setIsResolving(false)
    setPhase('victory')
  }

  const runEnemyTurn = (nextEnemies: Enemy[]) => {
    const attack = resolveEnemyAttack({
      enemies: nextEnemies,
      playerHp,
      defense: playerStats.defense,
    })

    if (attack.attackers.length === 0) {
      schedule(completeVictory, BATTLE_MOTION.resultDelayMs)
      return
    }

    setEnemyTurnActive(true)
    const lastAttackIndex = attack.attackers.length - 1

    attack.attackers.forEach(({ enemy, damage, playerHpAfter }, index) => {
      const windupDelay = BATTLE_MOTION.enemyWindupMs + index * BATTLE_MOTION.enemyAttackStepMs
      const impactDelay = windupDelay + BATTLE_MOTION.enemyImpactDelayMs

      schedule(() => {
        setActiveEnemyId(enemy.id)
        gameAudio.playSe('enemyAttack')
        addLog('enemy', `${enemy.name} / ${enemy.attackName} → ${damage} ダメージ`)
      }, windupDelay)

      schedule(() => {
        gameAudio.playSe('playerHit')
        setPlayerHit(true)
        setPlayerDamagePopup(damage)
        updateState((current) => ({
          ...current,
          rpgState: withBattleHp(current.rpgState, playerHpAfter),
        }))
      }, impactDelay)

      schedule(() => {
        setPlayerHit(false)
        setPlayerDamagePopup(null)
        setActiveEnemyId(null)
      }, impactDelay + BATTLE_MOTION.playerHitMs)
    })

    const resolutionDelay =
      BATTLE_MOTION.enemyWindupMs +
      lastAttackIndex * BATTLE_MOTION.enemyAttackStepMs +
      BATTLE_MOTION.enemyImpactDelayMs +
      BATTLE_MOTION.playerHitMs

    schedule(() => {
      setEnemyTurnActive(false)
      setActiveEnemyId(null)
      setPlayerHit(false)
      setPlayerDamagePopup(null)

      if (attack.playerHp === 0) {
        schedule(() => {
          gameAudio.stopBgm()
          gameAudio.playSe('defeat')
          setIsResolving(false)
          setPhase('defeat')
        }, BATTLE_MOTION.resultDelayMs)
      } else {
        setTurn((currentTurn) => currentTurn + 1)
        setIsResolving(false)
      }
    }, resolutionDelay)
  }

  const activateSkill = (skill: SkillCard) => {
    setIsResolving(true)
    setSkillWindup(true)
    setSelectedSkillId(null)

    const action = resolvePlayerAction({
      battle,
      enemies,
      skill,
      playerStats: { ...playerStats },
      partyFollowUpDamage,
    })
    const { targets, skillDamage: skillPower } = action
    const feedback = getBattleSemanticFeedback(skill.rule, enemies, targets)

    schedule(() => {
      setSkillWindup(false)
      setSemanticFeedback(feedback)
      schedule(() => setSemanticFeedback(null), BATTLE_MOTION.semanticFeedbackMs)

      if (targets.length === 0) {
        addLog('player', `${skill.name} → 対象なし`)
        gameAudio.playSe('cancel')
        schedule(() => runEnemyTurn(enemies), BATTLE_MOTION.semanticFeedbackMs)
        return
      }

      const targetIds = targets.map((target) => target.id)
      const {
        damageByTargetId,
        guardedBossTargeted,
        enemies: nextEnemies,
        partyFollowUpTargetId,
        partyFollowUpDamage: resolvedPartyFollowUpDamage,
      } = action
      const newlyDefeatedIds = getNewlyDefeatedIds(enemies, nextEnemies)

      gameAudio.playSe('enemyHit')
      if (newlyDefeatedIds.length > 0) {
        schedule(() => gameAudio.playSe('enemyDefeat'), 100)
      }
      setAnimatingIds(targetIds)
      setDefeatingIds(newlyDefeatedIds)
      setDamagePopups(damageByTargetId)
      setEnemies(nextEnemies)
      addLog(
        'player',
        `${skill.name} → ${targets.map((target) => target.name).join(' / ')} · ${skillPower} ダメージ`,
      )
      if (partyFollowUpTargetId && resolvedPartyFollowUpDamage > 0) {
        const allies = rpgState.partyMemberIds
          .map((id) => partyMemberById[id]?.name)
          .filter(Boolean)
          .join(' + ')
        setPartyFollowUpActive(true)
        schedule(() => setPartyFollowUpActive(false), 260)
        const followUpTarget = targets.find((target) => target.id === partyFollowUpTargetId)
        addLog(
          'system',
          `${allies} 追撃 → ${followUpTarget?.name ?? partyFollowUpTargetId} · ${resolvedPartyFollowUpDamage} ダメージ`,
        )
      }
      if (guardedBossTargeted) {
        addLog('system', 'ボスガード → ボスへのスキルダメージは1')
      }

      schedule(() => {
        setAnimatingIds([])
        setDamagePopups({})
      }, BATTLE_MOTION.hitMs)

      schedule(() => setDefeatingIds([]), BATTLE_MOTION.defeatMs)
      schedule(
        () => runEnemyTurn(nextEnemies),
        Math.max(BATTLE_MOTION.hitMs, BATTLE_MOTION.semanticFeedbackMs),
      )
    }, BATTLE_MOTION.skillWindupMs)
  }

  const handleSkillClick = (skill: SkillCard) => {
    if (actionLocked) return

    if (selectedSkillId === skill.id) {
      gameAudio.playSe('execute')
      activateSkill(skill)
      return
    }

    gameAudio.playSe('select')
    setSelectedSkillId(skill.id)
  }

  const handlePatchKit = () => {
    if (actionLocked || patchKitUsed) return

    const result = consumePatchKit(progress, playerHp, playerStats.maxHp)
    if (!result.consumed) return

    gameAudio.playSe('confirm')
    updateState((current) => ({
      ...current, progress: result.progress, rpgState: withBattleHp(current.rpgState, result.hp),
    }))
    setPatchKitUsed(true)
    setLastPatchKitHeal(result.healed)
    addLog('system', `PATCH KIT → +${result.healed} HP`)
  }

  const goNextBattle = () => {
    gameAudio.playSe('confirm')
    if (returnTo === '/world' || !nextBattle) {
      navigate({ to: '/world' })
      return
    }
    navigate({
      to: '/$areaId/battle/$battleId',
      params: { areaId: nextBattle.areaId, battleId: String(nextBattle.id) },
      search: { seed: String(seed), returnTo },
    })
  }

  const goReturnDestination = () => {
    gameAudio.playSe('confirm')
    navigate({ to: '/world' })
  }

  const retryBattle = () => {
    gameAudio.playSe('confirm')
    rollback('retry')
    requestAnimationFrame(() => window.location.reload())
  }

  const returnToCheckpoint = () => {
    gameAudio.playSe('confirm')
    rollback('checkpoint')
    requestAnimationFrame(() => void navigate({ to: '/world' }))
  }

  const openCodeHelp = (skill: SkillCard, opener: HTMLElement) => {
    if ((isResolving && phase === 'battle') || storyEvent || codeDataOpen || explainedSkill) return
    codeHelpOpenerRef.current = opener
    gameAudio.playSe('confirm')
    setExplainedSkill(skill)
  }

  const closeCodeHelp = () => {
    gameAudio.playSe('cancel')
    setExplainedSkill(null)
  }
  const codeHelpDialogRef = useModalFocus<HTMLElement>({
    open: explainedSkill !== null,
    getRestoreFocusTarget: getCodeHelpRestoreTarget,
    onEscape: closeCodeHelp,
  })
  const resultCovered = Boolean(storyEvent || explainedSkill)
  const resultDialogRef = useModalFocus<HTMLElement>({
    open: phase !== 'battle',
    active: !resultCovered,
    onEscape: phase === 'defeat' ? returnToCheckpoint : goReturnDestination,
  })

  const playerHpPercent = Math.max(0, Math.min(100, (playerHp / playerStats.maxHp) * 100))
  const areaLabel = battleArea?.title.toUpperCase() ?? battle.areaId.toUpperCase()

  return (
    <main className="app-shell battle-screen">
      <header className="topbar pixel-window">
        <div>
          <div className="eyebrow">{areaLabel} // {battle.label}</div>
          <h1>{battle.title}</h1>
          <p>{battle.subtitle}</p>
        </div>
        <div className="battle-location-stack">
          <span className="battle-location-chip">{battlePresentation.locationLabel}</span>
          <div className={`turn-pill ${enemyTurnActive ? 'enemy-turn-active' : ''}`}>
            {enemyTurnActive ? '敵のターン' : `ターン ${turn}`}
          </div>
        </div>
      </header>

      <section
        className={`battle-stage pixel-window battle-scene-${battlePresentation.sceneId} battle-arena-${battlePresentation.arenaKind} ${skillWindup ? 'skill-windup' : ''}`}
        data-battle-scene={battlePresentation.sceneId}
        data-battle-arena={battlePresentation.arenaKind}
      >
        <div className="stage-sky" aria-hidden="true">
          <span className="stage-moon" />
          <span className="stage-star star-a">✦</span>
          <span className="stage-star star-b">·</span>
          <span className="stage-star star-c">✧</span>
          <span className="stage-mountain mountain-a" />
          <span className="stage-mountain mountain-b" />
          <span className="stage-landmark landmark-a" />
          <span className="stage-landmark landmark-b" />
          <span className="stage-atmosphere" />
        </div>

        <aside className={`status-strip player-panel ${playerHit ? 'player-hit' : ''}`}>
          {playerDamagePopup !== null && (
            <span className="damage-number player-damage-number">-{playerDamagePopup}</span>
          )}
          <div className="player-sprite battle-character-stack" aria-hidden="true">
            <img
              className="battle-character-pixel"
              src={characterVisuals.player.battle}
              alt=""
            />
            {equippedWeaponVisual && (
              <img className="battle-weapon-pixel" src={equippedWeaponVisual} alt="" />
            )}
          </div>
          <div className="player-stats">
            <div className="status-title">CODE KNIGHT · LV {playerStats.level}</div>
            <div className="status-label-row">
              <span>HP</span>
              <strong>{playerHp}<em>/{playerStats.maxHp}</em></strong>
            </div>
            <div className="hp-track player-track">
              <div className="hp-fill" style={{ width: `${playerHpPercent}%` }} />
            </div>
            {rpgState.partyMemberIds.length > 0 && (
              <>
                <div className="party-battle-line">
                  仲間 {rpgState.partyMemberIds.map((id) => partyMemberById[id]?.name ?? id).join(' + ')} · 追撃 {partyFollowUpDamage}
                </div>
                <div className="battle-party-pixels" aria-label="戦闘中の仲間">
                  {rpgState.partyMemberIds.map((memberId) => {
                    const member = partyMemberById[memberId]
                    if (!member) return null
                    return (
                      <div
                        className={`battle-party-member ${partyFollowUpActive ? 'is-following-up' : ''}`}
                        key={memberId}
                      >
                        <img src={characterVisuals.byte.battle} alt="" />
                        <span>{member.name}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </aside>

        <section className="enemy-grid" aria-label="敵">
          {enemies.map((enemy) => {
            const hpPercent = (enemy.hp / enemy.maxHp) * 100
            const defeated = enemy.hp <= 0
            const isBossEnemy = enemy.role === 'boss'
            const displayName = isBossEnemy && battlePresentation.bossDisplayName
              ? battlePresentation.bossDisplayName
              : enemy.name
            const visualId = getEnemyVisualId({
              visualId: isBossEnemy && battlePresentation.bossVisualId
                ? battlePresentation.bossVisualId
                : enemy.visualId,
            })
            const semanticTraced = semanticFeedback?.tracedEnemyIds.includes(enemy.id) ?? false
            const semanticTarget = semanticFeedback?.targetEnemyIds.includes(enemy.id) ?? false
            return (
              <article
                className={`enemy-card ${battleArea.capabilities.codeData ? 'code-data-clickable' : ''} ${inspectedEnemyKey === enemy.id ? 'code-data-inspected' : ''} ${defeated ? 'defeated' : ''} ${animatingIds.includes(enemy.id) ? 'hit' : ''} ${defeatingIds.includes(enemy.id) ? 'defeating' : ''} ${isBossEnemy ? 'is-boss-enemy' : ''} ${activeEnemyId === enemy.id ? 'enemy-attacking' : ''} ${semanticTraced ? 'semantic-traced' : ''} ${semanticTarget ? 'semantic-target' : ''}`}
                key={enemy.id}
                role={battleArea.capabilities.codeData ? 'button' : undefined}
                tabIndex={battleArea.capabilities.codeData ? actionLocked ? -1 : 0 : undefined}
                data-enemy-role={enemy.role}
                data-boss-display-name={isBossEnemy ? displayName : undefined}
                data-semantic-traced={semanticTraced || undefined}
                data-semantic-target={semanticTarget || undefined}
                data-enemy-attacking={activeEnemyId === enemy.id || undefined}
                aria-label={battleArea.capabilities.codeData ? `${displayName}のコード上のデータを確認` : undefined}
                aria-disabled={battleArea.capabilities.codeData ? actionLocked : undefined}
                onClick={(event) => {
                  if (!battleArea.capabilities.codeData || actionLocked) return
                  event.currentTarget.focus()
                  setInspectedEnemyKey(enemy.id)
                  setCodeDataOpen(true)
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return
                  if (!battleArea.capabilities.codeData || actionLocked) return
                  event.preventDefault()
                  setInspectedEnemyKey(enemy.id)
                  setCodeDataOpen(true)
                }}
              >
                {damagePopups[enemy.id] !== undefined && (
                  <span className="damage-number enemy-damage-number">-{damagePopups[enemy.id]}</span>
                )}
                <div
                  className={`enemy-sprite ${visualId}`}
                  data-enemy-visual-id={visualId}
                  aria-hidden="true"
                >
                  <span className="sprite-face">{enemy.glyph}</span>
                </div>
                <div className="enemy-name-row">
                  <div>
                    <h2>{displayName}</h2>
                    {displayName !== enemy.name && (
                      <small className="enemy-code-name">コード名 · {enemy.name}</small>
                    )}
                  </div>
                  <span aria-label={`HP ${enemy.hp} / ${enemy.maxHp}`}>{enemy.hp}/{enemy.maxHp}</span>
                </div>
                <div className="hp-track enemy-track">
                  <div className="hp-fill" style={{ width: `${hpPercent}%` }} />
                </div>
                {isBossEnemy && bossGuardEnabled && (
                  <div
                    className={`boss-guard ${bossGuardActive ? 'active' : 'open'}`}
                    aria-label={`ボスガード ${bossGuardActive ? '有効' : '解除'}`}
                  >
                    <div className="boss-guard-head">
                      <span>ガード</span>
                      <strong>{bossGuardActive ? '有効' : '解除'}</strong>
                    </div>
                    <code>{BOSS_GUARD_CONDITION_CODE}</code>
                  </div>
                )}
                <div className="intent-box">
                  <span>次の攻撃</span>
                  <strong>{defeated ? '—' : enemy.attackName}</strong>
                  <em>{defeated ? '撃破' : `${getIncomingDamage(enemy.attackDamage, playerStats.defense)} ダメージ`}</em>
                </div>
                <div className="enemy-code-facts">
                  <span className="enemy-role">{enemy.role}</span>
                  <span className="enemy-raw-attack" aria-label={`attackDamage ${enemy.attackDamage}（防御反映前）`} title="attackDamage（防御反映前）">
                    <span>attackDamage</span> <strong>{enemy.attackDamage}</strong>
                  </span>
                </div>
              </article>
            )
          })}
        </section>
        {semanticFeedback && (
          <div
            className={`battle-semantic-feedback semantic-${semanticFeedback.family}`}
            role="status"
            aria-live="polite"
            data-semantic-family={semanticFeedback.family}
          >
            <span>判定結果</span>
            <strong>{semanticFeedback.label}</strong>
            <small>{semanticFeedback.detail}</small>
          </div>
        )}
        <section className="selected-skill-reading" aria-label="選択中Skillのコード">
          {selectedSkill ? (
            <>
              <div className="selected-skill-reading-head">
                <strong>{selectedSkill.name}</strong>
                <span>威力 {getSkillDamage(selectedSkill.power, playerStats)}</span>
              </div>
              <SourceCode code={selectedSkill.code} scrollable />
            </>
          ) : (
            <p>{isResolving ? '実行中…' : 'スキルを選んでコードを読む'}</p>
          )}
        </section>
        <div className="stage-ground" aria-hidden="true" />
      </section>

      <section className="battle-console pixel-window">
        <div className="skill-grid" role="group" aria-label="スキル">
          {availableSkills.map((skill) => {
            const selected = selectedSkillId === skill.id
            const skillPower = getSkillDamage(skill.power, playerStats)
            return (
              <button
                type="button"
                key={skill.id}
                data-skill-id={skill.id}
                className={`skill-card ${selected ? 'selected' : ''}`}
                onClick={() => handleSkillClick(skill)}
                disabled={actionLocked}
                aria-pressed={selected}
              >
                <div className="skill-card-head">
                  <span>{skill.name}</span>
                  <strong>威力 {skillPower}</strong>
                </div>
                <pre><code>{skill.code}</code></pre>
                {selected && <div className="skill-card-foot">▶ 実行</div>}
              </button>
            )
          })}
        </div>

        <div className="battle-secondary-actions">
          <BattleItemPanel progress={progress} hp={playerHp} maxHp={playerStats.maxHp} usedThisBattle={patchKitUsed} lastHeal={lastPatchKitHeal} actionLocked={actionLocked} onUse={handlePatchKit} />
          <BattleEscapePanel areaId={battle.areaId} battleId={battle.id} seed={String(seed)} returnTo={returnTo} actionLocked={actionLocked} onRun={() => rollback('abort')} />
        </div>

        {logs.length > 0 && (
          <div className="log-panel pixel-inner-window">
            <div className="log-title">戦闘ログ</div>
            <div className="log-list">
              {logs.map((log) => (
                <span key={log.id} className={`log-${log.tone}`}>&gt; {log.text}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      {phase === 'battle' && (
        <div className="battle-reference-actions">
          {battleArea.capabilities.codeData && (
            <BattleCodeData
              enemies={codeDataEnemies}
              selectedCode={selectedSkill?.code ?? null}
              selectedSkillName={selectedSkill?.name ?? null}
              open={codeDataOpen}
              onOpenChange={setCodeDataOpen}
              actionLocked={isResolving || Boolean(storyEvent || explainedSkill)}
              selectedEnemyKey={inspectedEnemyKey}
            />
          )}
          <button
            className="floating-help"
            onClick={(event) => openCodeHelp(selectedSkill ?? availableSkills[0], event.currentTarget)}
            aria-label="コード解説を開く"
            disabled={actionLocked}
          >
            ?
          </button>
        </div>
      )}

      {phase === 'victory' && (
        <div
          className="overlay result-overlay victory-overlay"
          role="presentation"
          inert={resultCovered}
          aria-hidden={resultCovered || undefined}
        >
          <section
            ref={resultDialogRef}
            className={`result-card victory-card pixel-window result-card-enter result-sequence-host ${resultSequenceDone ? 'result-sequence-complete' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="勝利結果"
            tabIndex={-1}
          >
            <div className="eyebrow">勝利</div>
            <h2>{battle.title} クリア</h2>
            {victoryReward && (
              <div className="reward-summary pixel-inner-window">
                <BattleResultSequence items={resultItems} paused={Boolean(storyEvent)} done={resultSequenceDone} onComplete={completeResultSequence} />
              </div>
            )}
            <div className="result-actions">
              <button className="primary-button" onClick={goNextBattle}>
                {returnTo === '/world' ? '▶ ワールドへ戻る' : nextBattle ? '▶ 次のステージ' : '▶ ワールドへ戻る'}
              </button>
              {returnTo !== '/world' && (
                <button className="secondary-button" onClick={goReturnDestination}>◀ ワールドへ戻る</button>
              )}
            </div>
          </section>
        </div>
      )}

      {phase === 'defeat' && (
        <div
          className="overlay result-overlay defeat-overlay"
          role="presentation"
          inert={resultCovered}
          aria-hidden={resultCovered || undefined}
        >
          <section
            ref={resultDialogRef}
            className="result-card defeat-card pixel-window result-card-enter"
            role="dialog"
            aria-modal="true"
            aria-label="敗北結果"
            tabIndex={-1}
          >
            <div className="eyebrow">敗北</div>
            <p className="result-note">再挑戦ではBattle開始時のHP / Itemへ戻る。チェックポイントへ戻っても全回復せず、開始地点へ戻る。</p>
            <div className="defeat-actions">
              <button className="primary-button" onClick={retryBattle}>▶ 再挑戦</button>
              <button className="secondary-button" onClick={returnToCheckpoint}>◀ チェックポイントへ戻る</button>
              <button className="secondary-button" onClick={(event) => openCodeHelp(selectedSkill ?? availableSkills[0], event.currentTarget)}>コード解説</button>
            </div>
          </section>
        </div>
      )}

      {explainedSkill && (
        <div className="overlay modal-overlay" onClick={closeCodeHelp}>
          <section
            ref={codeHelpDialogRef}
            className="explain-modal pixel-window"
            role="dialog"
            aria-modal="true"
            aria-label="コード解説"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="close-button" onClick={closeCodeHelp} aria-label="コード解説を閉じる">×</button>
            <header className="code-help-head">
              <div className="eyebrow">コード解説 · {explainedSkill.name}</div>
              <h2>{explainedSkill.concept}</h2>
            </header>
            <p className="source-line-note">行番号は元のコードの改行に対応します。画面幅による折り返しは同じ行です。</p>
            <SourceCode code={explainedSkill.code} />
            {explainedSkill.codeHelpLines && explainedSkill.codeHelpLines.length > 0 && (
              <div className="code-help-steps" aria-label="コードを1行ずつ読む">
                {explainedSkill.code.split('\n').map((line, index) => (
                  <div className="code-help-step pixel-inner-window" key={`${index}:${line}`}>
                    <span>コード行 {String(index + 1).padStart(2, '0')}</span>
                    <code>{line}</code>
                    <p>{explainedSkill.codeHelpLines?.[index]}</p>
                  </div>
                ))}
              </div>
            )}
            <p>{explainedSkill.explanation}</p>
            <div className="explain-switcher">
              {availableSkills.map((skill) => (
                <button key={skill.id} aria-pressed={skill.id === explainedSkill.id} onClick={() => { gameAudio.playSe('select'); setExplainedSkill(skill) }}>
                  {skill.name}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {storyEvent && (
        <BattleStoryEvent
          key={storyEvent.id}
          event={storyEvent}
          onComplete={() => setStoryEvent(undefined)}
          onSkip={() => {
            setStoryEvent(undefined)
            if (phase === 'victory') completeResultSequence()
          }}
        />
      )}
    </main>
  )
}

export default App