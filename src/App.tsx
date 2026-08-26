import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  areaById,
  battles,
  generateBattle,
  getTargets,
  skills,
  type Enemy,
  type Seed,
  type SkillCard,
} from './game'
import { BATTLE_MOTION, getNewlyDefeatedIds } from './motion/battleMotion'
import {
  applyBattleVictory,
  getPlayerStats,
  getSkillPowerForLevel,
  useProgress,
  type BattleVictoryReward,
} from './progression'

type Phase = 'battle' | 'victory' | 'defeat'

type LogEntry = {
  id: number
  tone: 'player' | 'enemy' | 'system'
  text: string
}

type AppProps = {
  battleId: number
  seed: Seed
  returnTo?: '/javascript/field'
}

const cloneEnemies = (enemies: Enemy[]) => enemies.map((enemy) => ({ ...enemy }))
const spriteClassName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

function App({ battleId, seed, returnTo }: AppProps) {
  const navigate = useNavigate()
  const { progress, setProgress } = useProgress()
  const playerStats = getPlayerStats(progress.exp)
  const battle = useMemo(() => {
    const generated = generateBattle(battleId, seed)
    if (!generated) throw new Error(`Unknown battle: ${battleId}`)
    return generated
  }, [battleId, seed])
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
  const [victoryReward, setVictoryReward] = useState<BattleVictoryReward | null>(null)

  const availableSkills = useMemo(
    () => battle.skillIds.map((id) => skills[id]),
    [battle],
  )

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
    setPlayerHp(playerStats.maxHp)
    setEnemies(cloneEnemies(battle.enemies))
    setSelectedSkillId(null)
    setLogs([])
    setTurn(1)
    clearMotionState()
    setExplainedSkill(null)
    setIsResolving(false)
    setVictoryReward(null)
    setPhase('battle')
  }

  const completeVictory = () => {
    const result = applyBattleVictory(progress, {
      stageId: battle.id,
      expReward: battle.expReward,
      nextStageId: nextBattle?.id,
      unlockSkillId: battle.unlockSkillId,
      clearAreaId: battle.isBoss ? battle.areaId : undefined,
    })

    setProgress(result.progress)
    setVictoryReward(result.reward)
    setIsResolving(false)
    setPhase('victory')
  }

  const runEnemyTurn = (nextEnemies: Enemy[]) => {
    const survivors = nextEnemies.filter((enemy) => enemy.hp > 0)

    if (survivors.length === 0) {
      setTimeout(completeVictory, BATTLE_MOTION.resultDelayMs)
      return
    }

    const totalDamage = survivors.reduce((total, enemy) => total + enemy.attackDamage, 0)
    const nextPlayerHp = Math.max(0, playerHp - totalDamage)
    setEnemyTurnActive(true)

    setTimeout(() => {
      survivors.forEach((enemy, index) => {
        setTimeout(
          () => addLog('enemy', `${enemy.name} / ${enemy.attackName} → ${enemy.attackDamage} DMG`),
          index * 90,
        )
      })

      setPlayerHit(true)
      setPlayerDamagePopup(totalDamage)
      setPlayerHp(nextPlayerHp)

      setTimeout(() => {
        setPlayerHit(false)
        setPlayerDamagePopup(null)
        setEnemyTurnActive(false)

        if (nextPlayerHp === 0) {
          setTimeout(() => setPhase('defeat'), BATTLE_MOTION.resultDelayMs)
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
    const skillPower = getSkillPowerForLevel(skill.power, playerStats.level)

    setTimeout(() => {
      setSkillWindup(false)

      if (targets.length === 0) {
        addLog('player', `${skill.name} → NO TARGET`)
        runEnemyTurn(enemies)
        return
      }

      const targetIds = targets.map((target) => target.id)
      const nextEnemies = enemies.map((enemy) =>
        targetIds.includes(enemy.id)
          ? { ...enemy, hp: Math.max(0, enemy.hp - skillPower) }
          : enemy,
      )
      const newlyDefeatedIds = getNewlyDefeatedIds(enemies, nextEnemies)

      setAnimatingIds(targetIds)
      setDefeatingIds(newlyDefeatedIds)
      setDamagePopups(Object.fromEntries(targetIds.map((id) => [id, skillPower])))
      setEnemies(nextEnemies)
      addLog(
        'player',
        `${skill.name} → ${targets.map((target) => target.name).join(' / ')} · ${skillPower} DMG`,
      )

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
      activateSkill(skill)
      return
    }

    setSelectedSkillId(skill.id)
  }

  const goNextBattle = () => {
    if (!nextBattle) {
      navigate({ to: '/javascript/complete' })
      return
    }

    navigate({
      to: '/javascript/battle/$battleId',
      params: { battleId: String(nextBattle.id) },
      search: { seed: String(seed), returnTo },
    })
  }

  const goReturnDestination = () => {
    if (returnTo === '/javascript/field') {
      navigate({ to: '/javascript/field' })
      return
    }
    navigate({ to: '/javascript' })
  }

  const unlockedSkill = victoryReward?.unlockedSkillId
    ? skills[victoryReward.unlockedSkillId]
    : null
  const clearedArea = victoryReward?.clearedAreaId
    ? areaById[victoryReward.clearedAreaId]
    : null
  const playerHpPercent = Math.max(0, Math.min(100, (playerHp / playerStats.maxHp) * 100))

  return (
    <main className="app-shell battle-screen">
      <header className="topbar pixel-window">
        <div>
          <div className="eyebrow">JAVASCRIPT // {battle.label}</div>
          <h1>CODE//READ RPG</h1>
          <p>
            {battle.title} — {battle.subtitle}
          </p>
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
          <div className="player-sprite" aria-hidden="true">
            <span />
          </div>
          <div className="player-stats">
            <div className="status-title">CODE KNIGHT · LV {playerStats.level}</div>
            <div className="status-label-row">
              <span>HP</span>
              <strong>
                {playerHp}
                <em>/{playerStats.maxHp}</em>
              </strong>
            </div>
            <div className="hp-track player-track">
              <div className="hp-fill" style={{ width: `${playerHpPercent}%` }} />
            </div>
            <div className="player-command">READ → SELECT → EXECUTE</div>
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
                  <span>
                    {enemy.hp}/{enemy.maxHp}
                  </span>
                </div>
                <div className="hp-track enemy-track">
                  <div className="hp-fill" style={{ width: `${hpPercent}%` }} />
                </div>
                <div className="intent-box">
                  <span>NEXT</span>
                  <strong>{defeated ? '—' : enemy.attackName}</strong>
                  <em>{defeated ? 'DEFEATED' : `${enemy.attackDamage} DMG`}</em>
                </div>
              </article>
            )
          })}
        </section>

        <div className="stage-ground" aria-hidden="true" />
      </section>

      <section className="battle-console pixel-window">
        <div className="console-head">
          <div>
            <div className="eyebrow">SELECT CODE SKILL</div>
            <h2>コードを読む → カードを選ぶ → 同じカードをもう一度押す</h2>
          </div>
          <span className="no-preview">TARGET PREVIEW: OFF</span>
        </div>

        <div className="skill-grid">
          {availableSkills.map((skill) => {
            const selected = selectedSkillId === skill.id
            const skillPower = getSkillPowerForLevel(skill.power, playerStats.level)
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
                <pre>
                  <code>{skill.code}</code>
                </pre>
                <div className="skill-card-foot">
                  <span>{selected ? '▶ PRESS AGAIN TO EXECUTE' : '▷ SELECT'}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="log-panel pixel-inner-window">
          <div className="log-title">BATTLE LOG</div>
          <div className="log-list">
            {logs.length === 0 ? (
              <span className="log-empty">&gt; The battle begins. Read the code.</span>
            ) : (
              logs.map((log) => (
                <span key={log.id} className={`log-${log.tone}`}>
                  &gt; {log.text}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      {phase === 'victory' && (
        <div className="overlay result-overlay victory-overlay">
          <section className="result-card victory-card pixel-window result-card-enter">
            <div className="eyebrow">VICTORY</div>
            <h2>{battle.title} cleared.</h2>
            {victoryReward && (
              <div className="reward-summary pixel-inner-window">
                <div className="reward-stat">
                  <span>EXP GAINED</span>
                  <strong>+{victoryReward.expGained}</strong>
                </div>
                <div className="reward-stat">
                  <span>LEVEL</span>
                  <strong>
                    {victoryReward.previousLevel}
                    {victoryReward.newLevel > victoryReward.previousLevel
                      ? ` → ${victoryReward.newLevel}`
                      : ''}
                  </strong>
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
                {nextBattle ? '▶ NEXT STAGE' : '▶ AREA CLEAR'}
              </button>
              <button className="secondary-button" onClick={goReturnDestination}>
                {returnTo === '/javascript/field' ? '◀ RETURN TO FIELD' : '◀ STAGE SELECT'}
              </button>
            </div>
          </section>
        </div>
      )}

      {phase === 'defeat' && (
        <div className="overlay result-overlay defeat-overlay">
          <section className="result-card defeat-card pixel-window result-card-enter">
            <div className="eyebrow">DEFEAT</div>
            <h2>コードを読み直して再戦</h2>
            <p>必要ならカードの解説を確認するか、前のStageへ戻って再挑戦できる。</p>
            <div className="defeat-actions">
              <button className="primary-button" onClick={resetBattle}>
                ▶ RETRY
              </button>
              <button className="secondary-button" onClick={goReturnDestination}>
                {returnTo === '/javascript/field' ? '◀ RETURN TO FIELD' : '◀ STAGE SELECT'}
              </button>
              <button
                className="secondary-button"
                onClick={() => setExplainedSkill(availableSkills[0])}
              >
                CODE HELP
              </button>
            </div>
          </section>
        </div>
      )}

      {explainedSkill && (
        <div className="overlay modal-overlay" onClick={() => setExplainedSkill(null)}>
          <section className="explain-modal pixel-window" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setExplainedSkill(null)}>
              ×
            </button>
            <div className="eyebrow">CODE EXPLANATION</div>
            <h2>{explainedSkill.concept}</h2>
            <pre>
              <code>{explainedSkill.code}</code>
            </pre>
            <p>{explainedSkill.explanation}</p>
            <div className="explain-switcher">
              {availableSkills.map((skill) => (
                <button key={skill.id} onClick={() => setExplainedSkill(skill)}>
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
          onClick={() => setExplainedSkill(availableSkills[0])}
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
