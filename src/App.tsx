import { useMemo, useState } from 'react'
import { battles, getTargets, skills, type Enemy, type SkillCard } from './game'

type Phase = 'intro' | 'battle' | 'unlock' | 'victory' | 'defeat' | 'complete'

type LogEntry = {
  id: number
  tone: 'player' | 'enemy' | 'system'
  text: string
}

const cloneEnemies = (enemies: Enemy[]) => enemies.map((enemy) => ({ ...enemy }))

function App() {
  const [battleIndex, setBattleIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('intro')
  const [playerHp, setPlayerHp] = useState(100)
  const [enemies, setEnemies] = useState<Enemy[]>(cloneEnemies(battles[0].enemies))
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)
  const [explainedSkill, setExplainedSkill] = useState<SkillCard | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [turn, setTurn] = useState(1)
  const [animatingIds, setAnimatingIds] = useState<string[]>([])
  const [isResolving, setIsResolving] = useState(false)

  const battle = battles[battleIndex]
  const availableSkills = useMemo(
    () => battle.skillIds.map((id) => skills[id]),
    [battle],
  )

  const addLog = (tone: LogEntry['tone'], text: string) => {
    setLogs((current) => [...current.slice(-4), { id: Date.now() + Math.random(), tone, text }])
  }

  const resetBattle = (index = battleIndex) => {
    const nextBattle = battles[index]
    setBattleIndex(index)
    setPlayerHp(100)
    setEnemies(cloneEnemies(nextBattle.enemies))
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
    } else {
      setPhase('complete')
    }
  }

  const goNextBattle = () => {
    const nextIndex = battleIndex + 1
    if (nextIndex >= battles.length) {
      setPhase('complete')
      return
    }
    resetBattle(nextIndex)
  }

  if (phase === 'intro') {
    return (
      <main className="app-shell intro-shell">
        <section className="hero-panel">
          <div className="eyebrow">JAVASCRIPT // CHAPTER 01</div>
          <h1>CODE<span>//</span>READ RPG</h1>
          <p className="hero-copy">
            技の説明はない。コードを読めば、誰に当たるかが分かる。
          </p>
          <div className="rule-grid">
            <div><strong>01</strong><span>敵とNEXT行動を見る</span></div>
            <div><strong>02</strong><span>コードから対象を読む</span></div>
            <div><strong>03</strong><span>同じカードを2回押して発動</span></div>
          </div>
          <button className="primary-button" onClick={() => resetBattle(0)}>START RUN</button>
        </section>
      </main>
    )
  }

  if (phase === 'unlock') {
    const unlocked = battle.unlockSkillId ? skills[battle.unlockSkillId] : null
    if (!unlocked) return null

    return (
      <main className="app-shell center-shell">
        <section className="result-card unlock-card">
          <div className="eyebrow">SKILL UNLOCKED</div>
          <div className="unlock-icon">＋</div>
          <h2>{unlocked.name}</h2>
          <pre><code>{unlocked.code}</code></pre>
          <div className="power-line"><span>POWER</span><strong>{unlocked.power}</strong></div>
          <p>{unlocked.explanation}</p>
          <button className="primary-button" onClick={goNextBattle}>NEXT BATTLE</button>
        </section>
      </main>
    )
  }

  if (phase === 'complete') {
    return (
      <main className="app-shell center-shell">
        <section className="result-card complete-card">
          <div className="eyebrow">CHAPTER CLEAR</div>
          <h2>JavaScript // MVP COMPLETE</h2>
          <p>3つの戦闘をクリアした。次はカード、敵、そして読むコード自体を増やせる。</p>
          <button className="primary-button" onClick={() => {
            setBattleIndex(0)
            setPhase('intro')
          }}>PLAY AGAIN</button>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">JAVASCRIPT // {battle.label}</div>
          <h1>{battle.title}</h1>
          <p>{battle.subtitle}</p>
        </div>
        <div className="turn-pill">TURN {String(turn).padStart(2, '0')}</div>
      </header>

      <section className="status-strip">
        <div className="status-title">PLAYER</div>
        <div className="hp-track player-track">
          <div className="hp-fill" style={{ width: `${playerHp}%` }} />
        </div>
        <strong>{playerHp}<span>/100 HP</span></strong>
      </section>

      <section className="enemy-grid" aria-label="Enemies">
        {enemies.map((enemy) => {
          const hpPercent = (enemy.hp / enemy.maxHp) * 100
          const defeated = enemy.hp <= 0
          return (
            <article
              className={`enemy-card ${defeated ? 'defeated' : ''} ${animatingIds.includes(enemy.id) ? 'hit' : ''}`}
              key={enemy.id}
            >
              <div className="enemy-glyph">{enemy.glyph}</div>
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
                <em>{defeated ? 'DEFEATED' : `${enemy.attackDamage} DMG`}</em>
              </div>
            </article>
          )
        })}
      </section>

      <section className="battle-console">
        <div className="console-head">
          <div>
            <div className="eyebrow">CHOOSE CODE</div>
            <h2>読む → 選ぶ → もう一度押して発動</h2>
          </div>
          <span className="no-preview">NO TARGET PREVIEW</span>
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
                <pre><code>{skill.code}</code></pre>
                <div className="skill-card-foot">
                  <span>{selected ? 'PRESS AGAIN TO EXECUTE' : 'SELECT'}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="log-panel">
          <div className="log-title">BATTLE LOG</div>
          <div className="log-list">
            {logs.length === 0 ? (
              <span className="log-empty">No action yet.</span>
            ) : logs.map((log) => (
              <span key={log.id} className={`log-${log.tone}`}>{log.text}</span>
            ))}
          </div>
        </div>
      </section>

      {phase === 'victory' && (
        <div className="overlay">
          <section className="result-card">
            <div className="eyebrow">VICTORY</div>
            <h2>{battle.title} cleared.</h2>
            <p>評価はなし。倒せたらクリア。</p>
            <button className="primary-button" onClick={continueAfterVictory}>CONTINUE</button>
          </section>
        </div>
      )}

      {phase === 'defeat' && (
        <div className="overlay">
          <section className="result-card defeat-card">
            <div className="eyebrow">DEFEAT</div>
            <h2>コードを読み直して再戦</h2>
            <p>必要ならカードの解説を確認してからリトライできる。</p>
            <div className="defeat-actions">
              <button className="primary-button" onClick={() => resetBattle()}>RETRY</button>
              <button className="secondary-button" onClick={() => setExplainedSkill(availableSkills[0])}>コード解説</button>
            </div>
          </section>
        </div>
      )}

      {explainedSkill && (
        <div className="overlay modal-overlay" onClick={() => setExplainedSkill(null)}>
          <section className="explain-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setExplainedSkill(null)}>×</button>
            <div className="eyebrow">CODE EXPLANATION</div>
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
