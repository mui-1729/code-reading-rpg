import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { battles, getTargets, skills, type Enemy, type SkillCard } from './game'

type Phase = 'battle' | 'unlock' | 'victory' | 'defeat'

type LogEntry = {
  id: number
  tone: 'player' | 'enemy' | 'system'
  text: string
}

type AppProps = {
  battleId: number
}

const cloneEnemies = (enemies: Enemy[]) => enemies.map((enemy) => ({ ...enemy }))

function App({ battleId }: AppProps) {
  const navigate = useNavigate()
  const battleIndex = battles.findIndex((candidate) => candidate.id === battleId)
  const battle = battles[battleIndex]

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
        setTimeout(() => addLog('enemy', `${enemy.name} / ${enemy.attackName} → ${enemy.attackDamage} DMG`), index * 90)
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
    addLog('player', `${skill.name} → ${targets.map((target) => target.name).join(' / ')} · ${skill.power} DMG`)

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
    })
  }

  if (phase === 'unlock') {
    const unlocked = battle.unlockSkillId ? skills[battle.unlockSkillId] : null
    if (!unlocked) return null

    return (
      <main className="app-shell center-shell result-screen">
        <div className="crt-overlay" aria-hidden="true" />
        <section className="result-card unlock-card pixel-window">
          <div className="chapter-label">SKILL UNLOCKED</div>
          <div className="unlock-rune" aria-hidden="true">+</div>
          <h2>{unlocked.name}</h2>
          <pre><code>{unlocked.code}</code></pre>
          <div className="power-line"><span>POWER</span><strong>{unlocked.power}</strong></div>
          <p>{unlocked.explanation}</p>
          <button className="primary-button" onClick={goNextBattle}>▶ NEXT BATTLE</button>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell battle-shell">
      <div className="crt-overlay" aria-hidden="true" />

      <header className="battle-header pixel-window">
        <div>
          <div className="chapter-label">JAVASCRIPT // {battle.label}</div>
          <h1>CODE<span>//</span>READ RPG</h1>
        </div>
        <div className="battle-heading">
          <strong>{battle.title}</strong>
          <span>{battle.subtitle}</span>
        </div>
        <div className="turn-counter">TURN {String(turn).padStart(2, '0')}</div>
      </header>

      <section className="battlefield pixel-window" aria-label="Battlefield">
        <div className="pixel-skyline" aria-hidden="true">
          <span className="field-moon">C</span>
          <span className="field-star field-star-a">+</span>
          <span className="field-star field-star-b">.</span>
          <span className="field-star field-star-c">*</span>
          <div className="field-mountains" />
          <div className="field-trees" />
        </div>

        <aside className="player-panel pixel-window inner-window">
          <div className="player-name">CODE KNIGHT</div>
          <div className="player-avatar" aria-hidden="true">
            <span className="player-sword" />
          </div>
          <div className="hp-label-row"><span>HP</span><strong>{playerHp} / 100</strong></div>
          <div className="hp-track player-track">
            <div className="hp-fill" style={{ width: `${playerHp}%` }} />
          </div>
          <div className="player-hint">READ → SELECT → EXECUTE</div>
        </aside>

        <section className="enemy-grid" aria-label="Enemies">
          {enemies.map((enemy) => {
            const hpPercent = (enemy.hp / enemy.maxHp) * 100
            const defeated = enemy.hp <= 0
            const spriteName = enemy.name.toLowerCase().replace(/\s+/g, '-')

            return (
              <article
                className={`enemy-card ${defeated ? 'defeated' : ''} ${animatingIds.includes(enemy.id) ? 'hit' : ''}`}
                key={enemy.id}
              >
                <div className="enemy-status pixel-window inner-window">
                  <div className="enemy-name-row">
                    <h2>{enemy.name}</h2>
                    <span>{enemy.hp}/{enemy.maxHp}</span>
                  </div>
                  <div className="hp-track enemy-track">
                    <div className="hp-fill" style={{ width: `${hpPercent}%` }} />
                  </div>
                </div>

                <div className={`enemy-sprite enemy-sprite-${spriteName}`} aria-hidden="true">
                  <span />
                </div>

                <div className="intent-box pixel-window inner-window">
                  <span>NEXT</span>
                  <strong>{defeated ? '—' : enemy.attackName}</strong>
                  <em>{defeated ? 'DEFEATED' : `${enemy.attackDamage} DMG`}</em>
                </div>
              </article>
            )
          })}
        </section>
      </section>

      <section className="battle-console pixel-window">
        <div className="console-head">
          <div>
            <div className="chapter-label">SELECT CODE SKILL</div>
            <h2>コードが選ぶ対象を読む</h2>
          </div>
          <span className="no-preview">NO TARGET PREVIEW</span>
        </div>

        <div className="skill-grid">
          {availableSkills.map((skill, index) => {
            const selected = selectedSkillId === skill.id
            return (
              <button
                type="button"
                key={skill.id}
                className={`skill-card skill-tone-${index + 1} ${selected ? 'selected' : ''}`}
                onClick={() => handleSkillClick(skill)}
                disabled={isResolving}
              >
                <div className="skill-card-head">
                  <span>{skill.name}</span>
                  <strong>POWER {skill.power}</strong>
                </div>
                <pre><code>{skill.code}</code></pre>
                <div className="skill-card-foot">
                  <span className="card-cursor">{selected ? '▶' : '·'}</span>
                  <span>{selected ? 'PRESS AGAIN TO EXECUTE' : 'SELECT'}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="log-panel pixel-window inner-window">
          <div className="log-title">BATTLE LOG</div>
          <div className="log-list">
            {logs.length === 0 ? (
              <span className="log-empty">&gt; The battlefield is waiting for your command...</span>
            ) : logs.map((log) => (
              <span key={log.id} className={`log-${log.tone}`}>&gt; {log.text}</span>
            ))}
          </div>
        </div>
      </section>

      {phase === 'victory' && (
        <div className="overlay">
          <section className="result-card pixel-window">
            <div className="chapter-label">VICTORY</div>
            <div className="result-rune" aria-hidden="true">✦</div>
            <h2>{battle.title} CLEARED</h2>
            <p>評価はなし。敵をすべて倒せたらクリア。</p>
            <button className="primary-button" onClick={continueAfterVictory}>▶ CONTINUE</button>
          </section>
        </div>
      )}

      {phase === 'defeat' && (
        <div className="overlay">
          <section className="result-card defeat-card pixel-window">
            <div className="chapter-label danger-label">DEFEAT</div>
            <h2>コードを読み直して再戦</h2>
            <p>必要ならカードの解説を確認してからリトライできる。</p>
            <div className="defeat-actions">
              <button className="primary-button" onClick={resetBattle}>▶ RETRY</button>
              <button className="secondary-button" onClick={() => setExplainedSkill(availableSkills[0])}>? CODE HELP</button>
            </div>
          </section>
        </div>
      )}

      {explainedSkill && (
        <div className="overlay modal-overlay" onClick={() => setExplainedSkill(null)}>
          <section className="explain-modal pixel-window" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setExplainedSkill(null)}>×</button>
            <div className="chapter-label">CODE EXPLANATION</div>
            <h2>{explainedSkill.concept}</h2>
            <pre><code>{explainedSkill.code}</code></pre>
            <p>{explainedSkill.explanation}</p>
            <div className="explain-switcher">
              {availableSkills.map((skill) => (
                <button key={skill.id} onClick={() => setExplainedSkill(skill)}>{skill.name}</button>
              ))}
            </div>
          </section>
        </div>
      )}

      {phase === 'battle' && (
        <button
          className="floating-help pixel-button"
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
