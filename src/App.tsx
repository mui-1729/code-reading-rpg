import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from './audio/gameAudio'
import { consumePatchKit, PATCH_KIT_HEAL } from './economy'
import {
  areaById,
  battles,
  generateBattle,
  getSkillCardsForBattle,
  getTargets,
  JAVASCRIPT_AREA_ID,
  skills,
  TYPESCRIPT_AREA_ID,
  type Enemy,
  type Seed,
  type SkillCard,
} from './game'
import { BATTLE_MOTION, getNewlyDefeatedIds } from './motion/battleMotion'
import {
  applyBattleVictory,
  useProgress,
  type BattleVictoryReward,
} from './progression'
import {
  getCombatStats,
  getIncomingDamage,
  getPartyFollowUpDamage,
  getSkillDamage,
  partyMemberById,
  useRpg,
} from './rpg'

type Phase = 'battle' | 'victory' | 'defeat'

type LogEntry = {
  id: number
  tone: 'player' | 'enemy' | 'system'
  text: string
}

type BattleReturnPath = '/world' | '/javascript/field' | '/typescript/field'

type AppProps = {
  battleId: number
  seed: Seed
  returnTo?: BattleReturnPath
}

const cloneEnemies = (enemies: Enemy[]) => enemies.map((enemy) => ({ ...enemy }))
const spriteClassName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

function App({ battleId, seed, returnTo }: AppProps) {
  const navigate = useNavigate()
  const { progress, stats: baseStats, setProgress } = useProgress()
  const { rpgState } = useRpg()
  const playerStats = getCombatStats(baseStats, rpgState)
  const partyFollowUpDamage = getPartyFollowUpDamage(rpgState.partyMemberIds, playerStats.level)
  const battle = useMemo(() => {
    const generated = generateBattle(battleId, seed)
    if (!generated) throw new Error(`Unknown battle: ${battleId}`)
    return generated
  }, [battleId, seed])
  const battleArea = areaById[battle.areaId]
  const battleIndex = battles.findIndex((candidate) => candidate.id === battleId)
  const nextBattleCandidate = battles[battleIndex + 1]
  const nextBattle = nextBattleCandidate?.areaId === battle.areaId ? nextBattleCandidate : undefined

  const [phase, setPhase] = useState<Phase>('battle')
  const [playerHp, setPlayerHp] = useState(() => playerStats.maxHp)
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
  const [victoryReward, setVictoryReward] = useState<BattleVictoryReward | null>(null)

  const availableSkills = useMemo(
    () => getSkillCardsForBattle(battle, seed),
    [battle, seed],
  )

  useEffect(() => {
    gameAudio.requestBgm('battle')
    return () => gameAudio.stopBgm()
  }, [battleId])

  const addLog = (tone: LogEntry['tone'], text: string) => {
    setLogs((current) => [...current.slice(-4), { id: Date.now() + Math.random(), tone, text }])
  }

  const clearMotionState = () => {
    setAnimatingIds([])
    setDefeatingIds([])
    setDamagePopups({})
    setPlayerDamagePopup(null)
    setPlayerHit(false)
    setSkillWindup(false)
    setEnemyTurnActive(false)
  }

  const resetBattle = () => {
    gameAudio.playSe('confirm')
    gameAudio.requestBgm('battle')
    setPlayerHp(playerStats.maxHp)
    setEnemies(cloneEnemies(battle.enemies))
    setSelectedSkillId(null)
    setLogs([])
    setTurn(1)
    clearMotionState()
    setExplainedSkill(null)
    setIsResolving(false)
    setPatchKitUsed(false)
    setVictoryReward(null)
    setPhase('battle')
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
      setTimeout(() => gameAudio.playSe('levelUp'), 420)
    }
    if (reward.firstClear) {
      setTimeout(() => gameAudio.playSe('stageClear'), 720)
    }
    if (reward.unlockedSkillId) {
      setTimeout(() => gameAudio.playSe('skillUnlock'), 1040)
    }

    setProgress(battleResult.progress)
    setVictoryReward(reward)
    setIsResolving(false)
    setPhase('victory')
  }

  const runEnemyTurn = (nextEnemies: Enemy[]) => {
    const survivors = nextEnemies.filter((enemy) => enemy.hp > 0)

    if (survivors.length === 0) {
      setTimeout(completeVictory, BATTLE_MOTION.resultDelayMs)
      return
    }

    const damages = survivors.map((enemy) => getIncomingDamage(enemy.attackDamage, playerStats.defense))
    const totalDamage = damages.reduce((total, damage) => total + damage, 0)
    const nextPlayerHp = Math.max(0, playerHp - totalDamage)
    setEnemyTurnActive(true)
    gameAudio.playSe('enemyAttack')

    setTimeout(() => {
      survivors.forEach((enemy, index) => {
        setTimeout(
          () => addLog('enemy', `${enemy.name} / ${enemy.attackName} → ${damages[index] ?? 1} DMG`),
          index * 90,
        )
      })

      gameAudio.playSe('playerHit')
      setPlayerHit(true)
      setPlayerDamagePopup(totalDamage)
      setPlayerHp(nextPlayerHp)

      setTimeout(() => {
        setPlayerHit(false)
        setPlayerDamagePopup(null)
        setEnemyTurnActive(false)

        if (nextPlayerHp === 0) {
          setTimeout(() => {
            gameAudio.stopBgm()
            gameAudio.playSe('defeat')
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

    const targets = getTargets(enemies, skill.rule)
    const skillPower = getSkillDamage(skill.power, playerStats)
    const totalPower = skillPower + partyFollowUpDamage

    setTimeout(() => {
      setSkillWindup(false)

      if (targets.length === 0) {
        addLog('player', `${skill.name} → NO TARGET`)
        gameAudio.playSe('cancel')
        runEnemyTurn(enemies)
        return
      }

      const targetIds = targets.map((target) => target.id)
      const nextEnemies = enemies.map((enemy) =>
        targetIds.includes(enemy.id)
          ? { ...enemy, hp: Math.max(0, enemy.hp - totalPower) }
          : enemy,
      )
      const newlyDefeatedIds = getNewlyDefeatedIds(enemies, nextEnemies)

      gameAudio.playSe('enemyHit')
      if (newlyDefeatedIds.length > 0) {
        setTimeout(() => gameAudio.playSe('enemyDefeat'), 100)
      }
      setAnimatingIds(targetIds)
      setDefeatingIds(newlyDefeatedIds)
      setDamagePopups(Object.fromEntries(targetIds.map((id) => [id, totalPower])))
      setEnemies(nextEnemies)
      addLog(
        'player',
        `${skill.name} → ${targets.map((target) => target.name).join(' / ')} · ${skillPower} DMG`,
      )
      if (partyFollowUpDamage > 0) {
        const allies = rpgState.partyMemberIds
          .map((id) => partyMemberById[id]?.name)
          .filter(Boolean)
          .join(' + ')
        addLog('system', `${allies} FOLLOW-UP → +${partyFollowUpDamage} DMG`)
      }

      setTimeout(() => {
        setAnimatingIds([])
        setDamagePopups({})
      }, BATTLE_MOTION.hitMs)

      setTimeout(() => setDefeatingIds([]), BATTLE_MOTION.defeatMs)
      setTimeout(() => runEnemyTurn(nextEnemies), BATTLE_MOTION.hitMs)
    }, BATTLE_MOTION.skillWindupMs)
  }

  const handleSkillClick = (skill: SkillCard) => {
    if (phase !== 'battle' || isResolving) return

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
    setProgress(result.progress)
    setPlayerHp(result.hp)
    setPatchKitUsed(true)
    addLog('system', `PATCH KIT → +${result.healed} HP`)
  }

  const goNextBattle = () => {
    gameAudio.playSe('confirm')

    if (returnTo === '/world') {
      navigate({ to: '/world' })
      return
    }

    if (!nextBattle) {
      navigate({ to: '/world' })
      return
    }

    if (battle.areaId === TYPESCRIPT_AREA_ID) {
      navigate({
        to: '/typescript/battle/$battleId',
        params: { battleId: String(nextBattle.id) },
        search: {
          seed: String(seed),
          returnTo: returnTo === '/typescript/field' ? returnTo : undefined,
        },
      })
      return
    }

    navigate({
      to: '/javascript/battle/$battleId',
      params: { battleId: String(nextBattle.id) },
      search: {
        seed: String(seed),
        returnTo: returnTo === '/javascript/field' ? returnTo : undefined,
      },
    })
  }

  const goReturnDestination = () => {
    gameAudio.playSe('confirm')

    if (returnTo === '/world') {
      navigate({ to: '/world' })
      return
    }
    if (returnTo === '/typescript/field') {
      navigate({ to: '/world' })
      return
    }
    if (returnTo === '/javascript/field') {
      navigate({ to: '/world' })
      return
    }
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

  const unlockedSkill = victoryReward?.unlockedSkillId
    ? skills[victoryReward.unlockedSkillId]
    : null
  const clearedArea = victoryReward?.clearedAreaId
    ? areaById[victoryReward.clearedAreaId]
    : null
  const playerHpPercent = Math.max(0, Math.min(100, (playerHp / playerStats.maxHp) * 100))
  const areaLabel = battleArea?.title.toUpperCase() ?? (
    battle.areaId === JAVASCRIPT_AREA_ID ? 'JAVASCRIPT KINGDOM' : 'TYPESCRIPT FRONTIER'
  )

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
          <div className="player-sprite" aria-hidden="true"><span /></div>
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
              <div className="party-battle-line">
                ALLY {rpgState.partyMemberIds.map((id) => partyMemberById[id]?.name ?? id).join(' + ')} · FOLLOW-UP {partyFollowUpDamage}
              </div>
            )}
          </div>
        </aside>

        <section className="enemy-grid" aria-label="Enemies">
          {enemies.map((enemy) => {
            const hpPercent = (enemy.hp / enemy.maxHp) * 100
            const defeated = enemy.hp <= 0
            const spriteClass = spriteClassName(enemy.name)
            const isBossEnemy = battle.isBoss && spriteClass === 'boss'
            return (
              <article
                className={`enemy-card ${defeated ? 'defeated' : ''} ${animatingIds.includes(enemy.id) ? 'hit' : ''} ${defeatingIds.includes(enemy.id) ? 'defeating' : ''} ${isBossEnemy ? 'is-boss-enemy' : ''}`}
                key={enemy.id}
              >
                {damagePopups[enemy.id] !== undefined && (
                  <span className="damage-number enemy-damage-number">-{damagePopups[enemy.id]}</span>
                )}
                <div className={`enemy-sprite ${spriteClass}`} aria-hidden="true">
                  <span className="sprite-face">{enemy.glyph}</span>
                </div>
                <div className="enemy-name-row">
                  <h2>{enemy.name}</h2>
                  <span>{enemy.hp}/{enemy.maxHp}</span>
                </div>
                <div className="hp-track enemy-track">
                  <div className="hp-fill" style={{ width: `${hpPercent}%` }} />
                </div>
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
        {progress.inventory.patchKit > 0 && (
          <div className="battle-item-row">
            <button
              type="button"
              className="secondary-button patch-kit-action"
              onClick={handlePatchKit}
              disabled={isResolving || patchKitUsed || playerHp >= playerStats.maxHp}
            >
              PATCH KIT ×{progress.inventory.patchKit} · +{PATCH_KIT_HEAL} HP
            </button>
            {patchKitUsed && <span>USED THIS BATTLE</span>}
          </div>
        )}

        <div className="skill-grid">
          {availableSkills.map((skill) => {
            const selected = selectedSkillId === skill.id
            const skillPower = getSkillDamage(skill.power, playerStats)
            return (
              <button
                type="button"
                key={skill.id}
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

      {phase === 'victory' && (
        <div className="overlay result-overlay victory-overlay">
          <section className="result-card victory-card pixel-window result-card-enter">
            <div className="eyebrow">VICTORY</div>
            <h2>{battle.title} cleared.</h2>
            {victoryReward && (
              <div className="reward-summary pixel-inner-window">
                <div className="reward-stat"><span>EXP GAINED</span><strong>+{victoryReward.expGained}</strong></div>
                <div className="reward-stat"><span>GOLD GAINED</span><strong>+{victoryReward.goldGained} G</strong></div>
                <div className="reward-stat">
                  <span>LEVEL</span>
                  <strong>{victoryReward.previousLevel}{victoryReward.newLevel > victoryReward.previousLevel ? ` → ${victoryReward.newLevel}` : ''}</strong>
                </div>
                {victoryReward.newLevel > victoryReward.previousLevel && (
                  <div className="reward-unlock level-up-reward motion-reward">LEVEL UP!</div>
                )}
                {victoryReward.firstClear && (
                  <div className="reward-unlock motion-reward">STAGE CLEAR RECORDED</div>
                )}
                {victoryReward.unlockedStageId && (
                  <div className="reward-unlock motion-reward">STAGE {victoryReward.unlockedStageId} UNLOCKED</div>
                )}
                {unlockedSkill && (
                  <div className="reward-unlock motion-reward">SKILL UNLOCKED: {unlockedSkill.name}</div>
                )}
                {clearedArea && (
                  <div className="reward-unlock area-clear-reward motion-reward">
                    AREA CLEAR: {clearedArea.title.toUpperCase()}
                  </div>
                )}
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
        <div className="overlay result-overlay defeat-overlay">
          <section className="result-card defeat-card pixel-window result-card-enter">
            <div className="eyebrow">DEFEAT</div>
            <div className="defeat-actions">
              <button className="primary-button" onClick={resetBattle}>▶ RETRY</button>
              <button className="secondary-button" onClick={goReturnDestination}>◀ RETURN TO WORLD</button>
              <button className="secondary-button" onClick={() => openCodeHelp(availableSkills[0])}>CODE HELP</button>
            </div>
          </section>
        </div>
      )}

      {explainedSkill && (
        <div className="overlay modal-overlay" onClick={closeCodeHelp}>
          <section className="explain-modal pixel-window" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={closeCodeHelp}>×</button>
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
    </main>
  )
}

export default App
