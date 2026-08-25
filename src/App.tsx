import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  battles,
  generateBattle,
  getTargets,
  skills,
  type Enemy,
  type Seed,
  type SkillCard,
} from './game'

type Phase = 'battle' | 'unlock' | 'victory' | 'defeat'

type LogEntry = {
  id: number
  tone: 'player' | 'enemy' | 'system'
  text: string
}

type AppProps = {
  battleId: number
  seed: Seed
}

const cloneEnemies = (enemies: Enemy[]) => enemies.map((enemy) => ({ ...enemy }))
const spriteClassName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

function App({ battleId, seed }: AppProps) {
  const navigate = useNavigate()
  const battleIndex = battles.findIndex((candidate) => candidate.id === battleId)
  const battle = useMemo(() => {
    const generated = generateBattle(battleId, seed)
    if (!generated) throw new Error(`Unknown battle: ${battleId}`)
    return generated
  }, [battleId, seed])

  const [phase, setPhase] = useState<Phase>('battle')
  const [playerHp, setPlayerHp] = useState(100)
  const [enemies, setEnemies] = useState<Enemy[]>(cloneEnemies(battle.enemies))
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)
  const [explainedSkill, setExplainedSkill] = useState<SkillCard | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [turn, setTurn] = useState(1)
  const [animatingIds, setAnimatingIds] = useState<string[]>([])
  const [isResolving, setIsResolving] = useState(false)

  const availableSkills = useMemo(
    () => battle.skillIds.map((id) => skills[id]),
    [battle],
  )

  const addLog = (tone: LogEntry['tone'], text: string) => {
    setLogs((current) => [...current.slice(-4), { id: Date.now() + Math.random(), tone, text }])
  }

  const resetBattle = () => {
    setPlayerHp(100)
    setEnemies(cloneEnemies(battle.enemies))
    setSelectedSkillId(null)
    setLogs([])
    setTurn(1)
    setAnimatingIds([])
    setExplainedSkill(null)
    setIsResolving(false)
    setPhase('battle')
  }

  const runEnemyTurn = (nextEnemies: Enemy[]) => {
    const survivors = nextEnemies.filter((enemy) => enemy.hp > 0)
    const totalDamage = survivors.reduce((total, enemy) => total + enemy.attackDamage, 0)

    if (survivors.length === 0) {
      setPhase('victory')
      return
    }

    const nextPlayerHp = Math.max(0, playerHp - totalDamage)

    setTimeout(() => {
      survivors.forEach((enemy, index) => {
        setTimeout(
          () => addLog('enemy', `${enemy.name} / ${enemy.attackName} → ${enemy.attackDamage} DMG`),
          index * 90,
        )
      })
      setPlayerHp(nextPlayerHp)

      if (nextPlayerHp === 0) {
        setTimeout(() => setPhase('defeat'), 380)
      } else {
        setTurn((currentTurn) => currentTurn + 1)
        setIsResolving(false)
      }
    }, 420)
  }

  const activateSkill = (skill: SkillCard) => {
    setIsResolving(true)
    const targets = getTargets(enemies, skill.rule)
    setSelectedSkillId(null)

    if (targets.length === 0) {
      addLog('player', `${skill.name} → NO TARGET`)
      runEnemyTurn(enemies)
      return
    }

    const targetIds = targets.map((target) => target.id)
    setAnimatingIds(targetIds)
    addLog(
      'player',
      `${skill.name} → ${targets.map((target) => target.name).join(' / ')} · ${skill.power} DMG`,
    )

    const nextEnemies = enemies.map((enemy) =>
      targetIds.includes(enemy.id)
        ? { ...enemy, hp: Math.max(0, enemy.hp - skill.power) }
        : enemy,
    )

    setEnemies(nextEnemies)
    setTimeout(() => setAnimatingIds([]), 360)
    runEnemyTurn(nextEnemies)
  }

  const handleSkillClick = (skill: SkillCard) => {
    if (phase !== 'battle' || isResolving) return

    if (selectedSkillId === skill.id) {
      activateSkill(skill)
      return
    }

    setSelectedSkillId(skill.id)
  }

  const continueAfterVictory = () => {
    if (battle.unlockSkillId) {
      setPhase('unlock')
      return
    }

    navigate({ to: '/javascript/complete' })
  }

  const goNextBattle = () => {
    const nextBattle = battles[battleIndex + 1]

    if (!nextBattle) {
      navigate({ to: '/javascript/complete' })
      return
    }

    navigate({
      to: '/javascript/battle/$battleId',
      params: { battleId: String(nextBattle.id) },
      search: { seed: String(seed) },
    })
  }

  if (phase === 'unlock') {
    const unlocked = battle.unlockSkillId ? skills[battle.unlockSkillId] : null
    if (!unlocked) return null

    return (
      <main className="app-shell center-shell title-screen">
        <section className="result-card unlock-card pixel-window">
          <div className="eyebrow">SKILL UNLOCKED</div>
          <div className="unlock-icon">＋</div>
          <h2>{unlocked.name}</h2>
          <pre>
            <code>{unlocked.code}</code>
          </pre>
          <div className="power-line">
            <span>POWER</span>
            <strong>{unlocked.power}</strong>
          </div>
          <p>{unlocked.explanation}</p>
          <button className="primary-button" onClick={goNextBattle}>
            ▶ NEXT BATTLE
          </button>
        </section>
      </main>
    )
  }

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
        <div className="turn-pill">TURN {String(turn).padStart(2, '0')}</div>
      </header>

      <section className="battle-stage pixel-window">
        <div className="stage-sky" aria-hidden="true">
          <span className="stage-moon" />
          <span className="stage-star star-a">✦</span>
          <span className="stage-star star-b">·</span>
          <span className="stage-star star-c">✧</span>
          <span className="stage-mountain mountain-a" />
          <span className="stage-mountain mountain-b" />
        </div>

        <aside className="status-strip player-panel">
          <div className="player-sprite" aria-hidden="true">
            <span />
          </div>
          <div className="player-stats">
            <div className="status-title">CODE KNIGHT</div>
            <div className="status-label-row">
              <span>HP</span>
              <strong>
                {playerHp}
                <em>/100</em>
              </strong>
            </div>
            <div className="hp-track player-track">
              <div className="hp-fill" style={{ width: `${playerHp}%` }} />
            </div>
            <div className="player-command">READ → SELECT → EXECUTE</div>
          </div>
        </aside>

        <section className="enemy-grid" aria-label="Enemies">
          {enemies.map((enemy) => {
            const hpPercent = (enemy.hp / enemy.maxHp) * 100
            const defeated = enemy.hp <= 0
            const spriteClass = spriteClassName(enemy.name)
            return (
              <article
                className={`enemy-card ${defeated ? 'defeated' : ''} ${animatingIds.includes(enemy.id) ? 'hit' : ''}`}
                key={enemy.id}
              >
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
                  <strong>POWER {skill.power}</strong>
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
        <div className="overlay">
          <section className="result-card pixel-window">
            <div className="eyebrow">VICTORY</div>
            <h2>{battle.title} cleared.</h2>
            <p>評価はなし。倒せたらクリア。</p>
            <button className="primary-button" onClick={continueAfterVictory}>
              ▶ CONTINUE
            </button>
          </section>
        </div>
      )}

      {phase === 'defeat' && (
        <div className="overlay">
          <section className="result-card defeat-card pixel-window">
            <div className="eyebrow">DEFEAT</div>
            <h2>コードを読み直して再戦</h2>
            <p>必要ならカードの解説を確認してからリトライできる。</p>
            <div className="defeat-actions">
              <button className="primary-button" onClick={resetBattle}>
                ▶ RETRY
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
        >
          ?
        </button>
      )}
    </main>
  )
}

export default App
