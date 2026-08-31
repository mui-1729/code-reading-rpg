import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from './audio/gameAudio'
import { useBattleRuntime } from './battle/BattleRuntimeContext'
import { createDefeatRecoveryState, withBattleHp } from './battle/resultHandoff'
import { createBattleSession, type BattleReturnPath } from './battle/session'
import { useBattleSession } from './battle/useBattleSession'
import { consumePatchKit } from './economy'
import { BattleItemPanel } from './economy/BattleItemPanel'
import { BattleEscapePanel } from './game/BattleEscapePanel'
import {
  areaById,
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
  const { schedule, updateState, finish } = useBattleSession({
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

  const availableSkills = useMemo(
    () => getSkillCardsForBattle(battle, seed),
    [battle, seed],
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
    gameAudio.requestBgm('battle')
    return () => gameAudio.stopBgm()
  }, [battleId])

  useLayoutEffect(() => {
    document.body.dataset.battlePhase = phase
    document.body.dataset.battleResolving = isResolving ? 'true' : 'false'
    return () => {
      delete document.body.dataset.battlePhase
      delete document.body.dataset.battleResolving
    }
  }, [isResolving, phase])

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
    const survivors = attack.attackers.map(({ enemy }) => enemy)

    if (survivors.length === 0) {
      schedule(completeVictory, BATTLE_MOTION.resultDelayMs)
      return
    }

    const damages = attack.attackers.map(({ damage }) => damage)
    const totalDamage = attack.totalDamage
    const nextPlayerHp = attack.playerHp
    setEnemyTurnActive(true)
    gameAudio.playSe('enemyAttack')

    schedule(() => {
      survivors.forEach((enemy, index) => {
        schedule(
          () => addLog('enemy', `${enemy.name} / ${enemy.attackName} → ${damages[index] ?? 1} DMG`),
          index * 90,
        )
      })

      gameAudio.playSe('playerHit')
      setPlayerHit(true)
      setPlayerDamagePopup(totalDamage)
      updateState((current) => ({ ...current, rpgState: withBattleHp(current.rpgState, nextPlayerHp) }))

      schedule(() => {
        setPlayerHit(false)
        setPlayerDamagePopup(null)
        setEnemyTurnActive(false)

        if (nextPlayerHp === 0) {
          schedule(() => {
            gameAudio.stopBgm()
            gameAudio.playSe('defeat')
            finish('DEFEAT', (current) => ({
              ...current,
              rpgState: createDefeatRecoveryState(current.rpgState, playerStats.maxHp),
            }))
            setPhase('defeat')
          }, BATTLE_MOTION.resultDelayMs)
        } else {
          setTurn((currentTurn) => currentTurn + 1)
          setIsResolving(false)
        }
      }, BATTLE_MOTION.playerHitMs)
    }, BATTLE_MOTION.enemyWindupMs)
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

    schedule(() => {
      setSkillWindup(false)

      if (targets.length === 0) {
        addLog('player', `${skill.name} → NO TARGET`)
        gameAudio.playSe('cancel')
        runEnemyTurn(enemies)
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
        `${skill.name} → ${targets.map((target) => target.name).join(' / ')} · ${skillPower} DMG`,
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
          `${allies} FOLLOW-UP → ${followUpTarget?.name ?? partyFollowUpTargetId} · ${resolvedPartyFollowUpDamage} DMG`,
        )
      }
      if (guardedBossTargeted) {
        addLog('system', 'BOSS GUARD → Skill damage to Boss capped at 1')
      }

      schedule(() => {
        setAnimatingIds([])
        setDamagePopups({})
      }, BATTLE_MOTION.hitMs)

      schedule(() => setDefeatingIds([]), BATTLE_MOTION.defeatMs)
      schedule(() => runEnemyTurn(nextEnemies), BATTLE_MOTION.hitMs)
    }, BATTLE_MOTION.skillWindupMs)
  }

  const handleSkillClick = (skill: SkillCard) => {
    if (phase !== 'battle' || isResolving || storyEvent || explainedSkill || codeDataOpen) return

    if (selectedSkillId === skill.id) {
      gameAudio.playSe('execute')
      activateSkill(skill)
      return
    }

    gameAudio.playSe('select')
    setSelectedSkillId(skill.id)
  }

  const handlePatchKit = () => {
    if (phase !== 'battle' || isResolving || patchKitUsed) return

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

  const openCodeHelp = (skill: SkillCard) => {
    gameAudio.playSe('confirm')
    setExplainedSkill(skill)
  }

  const closeCodeHelp = () => {
    gameAudio.playSe('cancel')
    setExplainedSkill(null)
  }
  const codeHelpDialogRef = useModalFocus<HTMLElement>({
    open: explainedSkill !== null,
    onEscape: closeCodeHelp,
  })
  const resultCovered = Boolean(storyEvent || explainedSkill)
  const resultDialogRef = useModalFocus<HTMLElement>({
    open: phase !== 'battle' && !resultCovered,
    onEscape: goReturnDestination,
  })

  const playerHpPercent = Math.max(0, Math.min(100, (playerHp / playerStats.maxHp) * 100))
  const areaLabel = battleArea?.title.toUpperCase() ?? battle.areaId.toUpperCase()

  return (
    <main className="app-shell battle-screen">
      <header className="topbar pixel-window">
        <div>
          <div className="eyebrow">{areaLabel} // {battle.label}</div>
          <h1>CODE//READ RPG</h1>
          <p>{battle.title} — {battle.subtitle}</p>
        </div>
        <div className={`turn-pill ${enemyTurnActive ? 'enemy-turn-active' : ''}`}>
          {enemyTurnActive ? 'ENEMY TURN' : `TURN ${String(turn).padStart(2, '0')}`}
        </div>
      </header>

      <section className={`battle-stage pixel-window ${skillWindup ? 'skill-windup' : ''}`}>
        <div className="stage-sky" aria-hidden="true">
          <span className="stage-moon" />
          <span className="stage-star star-a">✦</span>
          <span className="stage-star star-b">·</span>
          <span className="stage-star star-c">✧</span>
          <span className="stage-mountain mountain-a" />
          <span className="stage-mountain mountain-b" />
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
                  ALLY {rpgState.partyMemberIds.map((id) => partyMemberById[id]?.name ?? id).join(' + ')} · FOLLOW-UP {partyFollowUpDamage}
                </div>
                <div className="battle-party-pixels" aria-label="Battle party">
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

        <section className="enemy-grid" aria-label="Enemies">
          {enemies.map((enemy) => {
            const hpPercent = (enemy.hp / enemy.maxHp) * 100
            const defeated = enemy.hp <= 0
            const visualId = getEnemyVisualId(enemy)
            const isBossEnemy = enemy.role === 'boss'
            return (
              <article
                className={`enemy-card ${battleArea.capabilities.codeData ? 'code-data-clickable' : ''} ${inspectedEnemyKey === enemy.id ? 'code-data-inspected' : ''} ${defeated ? 'defeated' : ''} ${animatingIds.includes(enemy.id) ? 'hit' : ''} ${defeatingIds.includes(enemy.id) ? 'defeating' : ''} ${isBossEnemy ? 'is-boss-enemy' : ''}`}
                key={enemy.id}
                role={battleArea.capabilities.codeData ? 'button' : undefined}
                tabIndex={battleArea.capabilities.codeData ? 0 : undefined}
                aria-label={battleArea.capabilities.codeData ? `${enemy.name}のコード上のデータを確認` : undefined}
                onClick={(event) => {
                  if (!battleArea.capabilities.codeData || phase !== 'battle' || storyEvent || explainedSkill) return
                  event.currentTarget.focus()
                  setInspectedEnemyKey(enemy.id)
                  setCodeDataOpen(true)
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return
                  if (!battleArea.capabilities.codeData || phase !== 'battle' || storyEvent || explainedSkill) return
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
                  <h2>{enemy.name}</h2>
                  <span>{enemy.hp}/{enemy.maxHp}</span>
                </div>
                <div className="hp-track enemy-track">
                  <div className="hp-fill" style={{ width: `${hpPercent}%` }} />
                </div>
                {isBossEnemy && bossGuardEnabled && (
                  <div
                    className={`boss-guard ${bossGuardActive ? 'active' : 'open'}`}
                    aria-label={`Boss Guard ${bossGuardActive ? 'ACTIVE' : 'OPEN'}`}
                  >
                    <div className="boss-guard-head">
                      <span>GUARD</span>
                      <strong>{bossGuardActive ? 'ACTIVE' : 'OPEN'}</strong>
                    </div>
                    <code>{BOSS_GUARD_CONDITION_CODE}</code>
                  </div>
                )}
                <div className="intent-box">
                  <span>NEXT</span>
                  <strong>{defeated ? '—' : enemy.attackName}</strong>
                  <em>{defeated ? 'DEFEATED' : `${getIncomingDamage(enemy.attackDamage, playerStats.defense)} DMG`}</em>
                </div>
              </article>
            )
          })}
        </section>
        <div className="stage-ground" aria-hidden="true" />
      </section>

      <section className="battle-console pixel-window">
        <BattleItemPanel progress={progress} hp={playerHp} maxHp={playerStats.maxHp} usedThisBattle={patchKitUsed} lastHeal={lastPatchKitHeal} actionLocked={isResolving || phase !== 'battle' || Boolean(storyEvent)} onUse={handlePatchKit} />
        <BattleEscapePanel areaId={battle.areaId} battleId={battle.id} seed={String(seed)} returnTo={returnTo} actionLocked={isResolving || phase !== 'battle' || Boolean(storyEvent)} onRun={() => finish('RUN')} />

        <div className="skill-grid">
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
                disabled={isResolving}
              >
                <div className="skill-card-head">
                  <span>{skill.name}</span>
                  <strong>POWER {skillPower}</strong>
                </div>
                <pre><code>{skill.code}</code></pre>
                {selected && <div className="skill-card-foot">▶ EXECUTE</div>}
              </button>
            )
          })}
        </div>

        {logs.length > 0 && (
          <div className="log-panel pixel-inner-window">
            <div className="log-title">BATTLE LOG</div>
            <div className="log-list">
              {logs.map((log) => (
                <span key={log.id} className={`log-${log.tone}`}>&gt; {log.text}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      {phase === 'battle' && battleArea.capabilities.codeData && (
        <BattleCodeData
          enemies={codeDataEnemies}
          selectedCode={selectedSkill?.code ?? null}
          selectedSkillName={selectedSkill?.name ?? null}
          open={codeDataOpen}
          onOpenChange={setCodeDataOpen}
          selectedEnemyKey={inspectedEnemyKey}
        />
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
            aria-label="Victory result"
            tabIndex={-1}
          >
            <div className="eyebrow">VICTORY</div>
            <h2>{battle.title} cleared.</h2>
            {victoryReward && (
              <div className="reward-summary pixel-inner-window">
                <BattleResultSequence items={resultItems} paused={Boolean(storyEvent)} done={resultSequenceDone} onComplete={completeResultSequence} />
              </div>
            )}
            <div className="result-actions">
              <button className="primary-button" onClick={goNextBattle}>
                {returnTo === '/world' ? '▶ RETURN TO WORLD' : nextBattle ? '▶ NEXT STAGE' : '▶ WORLD'}
              </button>
              {returnTo !== '/world' && (
                <button className="secondary-button" onClick={goReturnDestination}>◀ WORLD</button>
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
            aria-label="Defeat result"
            tabIndex={-1}
          >
            <div className="eyebrow">DEFEAT</div>
            <div className="defeat-actions">
              <button className="primary-button" onClick={goReturnDestination}>▶ RETURN TO HUB</button>
              <button className="secondary-button" onClick={() => openCodeHelp(availableSkills[0])}>CODE HELP</button>
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
            aria-label="Code help"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="close-button" onClick={closeCodeHelp} aria-label="コード解説を閉じる">×</button>
            <div className="eyebrow">CODE EXPLANATION</div>
            <h2>{explainedSkill.concept}</h2>
            <pre><code>{explainedSkill.code}</code></pre>
            {explainedSkill.codeHelpLines && explainedSkill.codeHelpLines.length > 0 && (
              <div className="code-help-steps" aria-label="コードを1行ずつ読む">
                {explainedSkill.code.split('\n').map((line, index) => (
                  <div className="code-help-step pixel-inner-window" key={`${index}:${line}`}>
                    <span>LINE {String(index + 1).padStart(2, '0')}</span>
                    <code>{line}</code>
                    <p>{explainedSkill.codeHelpLines?.[index]}</p>
                  </div>
                ))}
              </div>
            )}
            <p>{explainedSkill.explanation}</p>
            <div className="explain-switcher">
              {availableSkills.map((skill) => (
                <button key={skill.id} onClick={() => { gameAudio.playSe('select'); setExplainedSkill(skill) }}>
                  {skill.name}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {phase === 'battle' && (
        <button
          className="floating-help"
          onClick={() => openCodeHelp(availableSkills[0])}
          aria-label="コード解説を開く"
          disabled={isResolving}
        >
          ?
        </button>
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
