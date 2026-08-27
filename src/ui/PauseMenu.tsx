import { useEffect, useMemo, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { writeStoredAudioSettings } from '../audio/audioSettingsStorage'
import { gameAudio, type AudioSettings } from '../audio/gameAudio'
import {
  getItemCount,
  getItemEffectSummary,
  getItemUsageSummary,
  itemDefinitions,
} from '../economy'
import { CodeCodexContent } from '../learning/CodeCodex'
import { getTotalExpForLevel, useProgress } from '../progression'
import {
  equipItem,
  equipmentDefinitions,
  getCombatStats,
  getEquipmentPresentation,
  partyMemberById,
  useRpg,
  type EquipmentSlot,
} from '../rpg'
import { useTutorial } from '../tutorial/useTutorial'
import { getWorldObjectives } from '../world/worldObjective'

type PauseTab = 'status' | 'items' | 'equipment' | 'party' | 'codex' | 'system'

const tabs: Array<{ id: PauseTab; label: string }> = [
  { id: 'status', label: 'STATUS' },
  { id: 'items', label: 'ITEMS' },
  { id: 'equipment', label: 'EQUIPMENT' },
  { id: 'party', label: 'PARTY' },
  { id: 'codex', label: 'CODEX' },
  { id: 'system', label: 'SYSTEM' },
]

const toPercent = (value: number) => Math.round(value * 100)

export function PauseMenu() {
  const location = useLocation()
  const { progress, stats, resetProgress } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const { reset: resetTutorial } = useTutorial()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<PauseTab>('status')
  const [resetArmed, setResetArmed] = useState(false)
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => gameAudio.getSettings())
  const combatStats = getCombatStats(stats, rpgState)
  const nextLevelExp = getTotalExpForLevel(stats.level + 1)
  const worldObjectives = getWorldObjectives(progress)

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.dataset.rpgPaused = open ? 'true' : 'false'
    return () => {
      document.body.dataset.rpgPaused = 'false'
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setOpen(false)
      setResetArmed(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const ownedEquipment = useMemo(
    () => equipmentDefinitions.filter((item) => rpgState.ownedEquipmentIds.includes(item.id)),
    [rpgState.ownedEquipmentIds],
  )

  if (location.pathname === '/') return null

  const equip = (equipmentId: string) => {
    setRpgState((current) => ({
      ...current,
      equipment: equipItem(current.equipment, equipmentId),
    }))
  }

  const unequip = (slot: EquipmentSlot) => {
    setRpgState((current) => ({
      ...current,
      equipment: { ...current.equipment, [slot]: null },
    }))
  }

  const updateAudioSettings = (next: AudioSettings) => {
    const stored = writeStoredAudioSettings(next)
    const applied = gameAudio.setSettings(stored)
    setAudioSettings(applied)
    return applied
  }

  const toggleSound = () => {
    const next = updateAudioSettings({ ...audioSettings, muted: !audioSettings.muted })
    if (!next.muted) gameAudio.playSe('confirm')
  }

  const closeMenu = () => {
    setOpen(false)
    setResetArmed(false)
  }

  return (
    <>
      <button
        type="button"
        className="pause-trigger secondary-button"
        onClick={() => {
          setAudioSettings(gameAudio.getSettings())
          setOpen(true)
        }}
        aria-label="Pause menuを開く"
      >
        MENU
      </button>

      {open && (
        <div className="pause-overlay" role="presentation" onClick={closeMenu}>
          <section
            className="pause-menu pixel-window"
            role="dialog"
            aria-modal="true"
            aria-label="Pause menu"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="pause-header">
              <div>
                <span className="eyebrow">PAUSE</span>
                <h2>CODE KNIGHT</h2>
              </div>
              <button className="close-button" type="button" onClick={closeMenu}>×</button>
            </header>

            <nav className="pause-tabs" aria-label="Pause menu sections">
              {tabs.map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  className={tab === entry.id ? 'is-active' : ''}
                  onClick={() => {
                    setTab(entry.id)
                    setResetArmed(false)
                  }}
                >
                  {entry.label}
                </button>
              ))}
            </nav>

            <div className="pause-content">
              {tab === 'status' && (
                <section className="pause-section">
                  <div className="pause-stat-grid">
                    <div><span>LEVEL</span><strong>{combatStats.level}</strong></div>
                    <div><span>EXP</span><strong>{progress.exp} / {nextLevelExp}</strong></div>
                    <div><span>GOLD</span><strong>{progress.gold} G</strong></div>
                    <div><span>HP</span><strong>{rpgState.currentHp} / {combatStats.maxHp}</strong></div>
                    <div><span>ATTACK</span><strong>{combatStats.attack}</strong></div>
                    <div><span>DEFENSE</span><strong>{combatStats.defense}</strong></div>
                  </div>

                  <div className="world-objective-list" aria-label="World objectives">
                    {worldObjectives.map((objective) => (
                      <article
                        className={`world-objective-row pixel-inner-window is-${objective.status}`}
                        key={objective.region}
                      >
                        <header>
                          <span>{objective.label}</span>
                          <strong>{objective.clearedBattles} / {objective.totalBattles}</strong>
                        </header>
                        <p>{objective.status === 'clear' ? 'AREA CLEAR' : `NEXT → ${objective.next}`}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {tab === 'items' && (
                <section className="pause-section item-inventory-grid" aria-label="Item inventory">
                  {itemDefinitions.map((item) => {
                    const count = getItemCount(progress, item.id)
                    return (
                      <article
                        className={`item-inventory-card pixel-inner-window ${count > 0 ? 'has-stock' : 'no-stock'}`}
                        key={item.id}
                        data-item-id={item.id}
                        data-item-count={count}
                      >
                        <header>
                          <span className="item-inventory-main">
                            <img className="item-pixel-icon item-pause-icon" src={item.visual} alt="" aria-hidden="true" />
                            <span>
                              <small>{item.categoryLabel}</small>
                              <strong>{item.name}</strong>
                            </span>
                          </span>
                          <em>×{count}</em>
                        </header>
                        <div className="item-inventory-rules">
                          <strong>{getItemEffectSummary(item)}</strong>
                          <span>{getItemUsageSummary(item)}</span>
                        </div>
                        <p>{item.description}</p>
                        <div className={`item-stock-state ${count > 0 ? 'has-stock' : 'no-stock'}`}>
                          {count > 0 ? 'READY IN BATTLE' : 'NO STOCK'}
                        </div>
                      </article>
                    )
                  })}
                </section>
              )}

              {tab === 'equipment' && (
                <section className="pause-section equipment-sections">
                  {(['weapon', 'armor', 'accessory'] as EquipmentSlot[]).map((slot) => {
                    const equippedId = rpgState.equipment[slot]
                    return (
                      <div
                        className="equipment-slot pixel-inner-window"
                        key={slot}
                        data-equipment-slot={slot}
                      >
                        <header>
                          <span>{slot.toUpperCase()}</span>
                          <strong>
                            {equippedId
                              ? ownedEquipment.find((item) => item.id === equippedId)?.name ?? equippedId
                              : 'EMPTY'}
                          </strong>
                        </header>
                        <div className="equipment-options">
                          {ownedEquipment.filter((item) => item.slot === slot).map((item) => {
                            const presentation = getEquipmentPresentation(item.id, rpgState.equipment)
                            if (!presentation) return null
                            const equipped = equippedId === item.id
                            return (
                              <button
                                type="button"
                                key={item.id}
                                className={equipped ? 'is-equipped' : ''}
                                onClick={() => equip(item.id)}
                                disabled={equipped}
                                data-equipment-id={item.id}
                                data-equipment-state={equipped ? 'equipped' : 'owned'}
                                aria-label={`${item.name}${equipped ? ' equipped' : ' を装備'}`}
                              >
                                <span className="equipment-option-main">
                                  {presentation.visual && (
                                    <img
                                      className="equipment-pixel-icon equipment-pause-icon"
                                      src={presentation.visual}
                                      alt=""
                                      aria-hidden="true"
                                    />
                                  )}
                                  <span className="equipment-option-title">
                                    <strong>{item.name}</strong>
                                    <em className={`equipment-state-badge is-${equipped ? 'equipped' : 'owned'}`}>
                                      {equipped ? 'EQUIPPED' : 'OWNED'}
                                    </em>
                                  </span>
                                </span>
                                <small>{presentation.statSummary}</small>
                                <span className="equipment-comparison">
                                  {equipped
                                    ? 'CURRENT LOADOUT'
                                    : `VS ${presentation.currentEquipmentName} · ${presentation.deltaSummary}`}
                                </span>
                                <span className="equipment-description">{item.description}</span>
                              </button>
                            )
                          })}
                          <button
                            type="button"
                            className="equipment-empty-option"
                            onClick={() => unequip(slot)}
                            disabled={!equippedId}
                          >
                            EMPTY
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </section>
              )}

              {tab === 'party' && (
                <section className="pause-section pause-list">
                  <article className="pixel-inner-window pause-list-row party-row">
                    <div>
                      <strong>CODE KNIGHT</strong>
                      <p>LV {combatStats.level} · HP {rpgState.currentHp}/{combatStats.maxHp} · ATK {combatStats.attack} · DEF {combatStats.defense}</p>
                    </div>
                    <span>LEADER</span>
                  </article>
                  {rpgState.partyMemberIds.length === 0 ? (
                    <p className="pause-empty">仲間はいない。HubにいるBYTEに話しかけると加入する。</p>
                  ) : (
                    rpgState.partyMemberIds.map((memberId) => {
                      const member = partyMemberById[memberId]
                      if (!member) return null
                      return (
                        <article className="pixel-inner-window pause-list-row party-row" key={member.id}>
                          <div>
                            <strong>{member.name} · {member.role}</strong>
                            <p>HP {member.maxHp} · ATK {member.attack} · DEF {member.defense}</p>
                          </div>
                          <span>ALLY</span>
                        </article>
                      )
                    })
                  )}
                </section>
              )}

              {tab === 'codex' && (
                <section className="pause-section">
                  <CodeCodexContent />
                </section>
              )}

              {tab === 'system' && (
                <section className="pause-section system-section">
                  <div className="pause-audio-panel pixel-inner-window">
                    <header className="pause-audio-header">
                      <div>
                        <span>SOUND</span>
                        <p>BGMとSEはここだけで設定します。</p>
                      </div>
                      <strong>{audioSettings.muted ? 'OFF' : 'ON'}</strong>
                    </header>

                    <button
                      type="button"
                      className={`audio-toggle ${audioSettings.muted ? 'muted' : ''}`}
                      onClick={toggleSound}
                      aria-pressed={audioSettings.muted}
                    >
                      {audioSettings.muted ? 'SOUND OFF' : 'SOUND ON'}
                    </button>

                    <label className="audio-slider">
                      <span>SE {toPercent(audioSettings.seVolume)}</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={toPercent(audioSettings.seVolume)}
                        onChange={(event) =>
                          updateAudioSettings({
                            ...audioSettings,
                            seVolume: Number(event.target.value) / 100,
                          })
                        }
                        aria-label="Sound effect volume"
                      />
                    </label>

                    <label className="audio-slider">
                      <span>BGM {toPercent(audioSettings.bgmVolume)}</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={toPercent(audioSettings.bgmVolume)}
                        onChange={(event) =>
                          updateAudioSettings({
                            ...audioSettings,
                            bgmVolume: Number(event.target.value) / 100,
                          })
                        }
                        aria-label="Background music volume"
                      />
                    </label>
                  </div>

                  <div className="pause-reset-panel pixel-inner-window">
                    <p>操作チュートリアルだけを最初からやり直します。進行・装備・仲間はそのままです。</p>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        resetTutorial()
                        closeMenu()
                      }}
                    >
                      REPLAY TUTORIAL
                    </button>
                  </div>

                  <div className="pause-reset-panel pixel-inner-window">
                    <p>進行・装備・仲間・World位置を最初からやり直します。Sound設定は保持します。</p>
                    <button
                      type="button"
                      className={resetArmed ? 'danger-button' : 'secondary-button'}
                      onClick={() => {
                        if (!resetArmed) {
                          setResetArmed(true)
                          return
                        }
                        resetProgress()
                        closeMenu()
                      }}
                    >
                      {resetArmed ? 'CONFIRM RESET PROGRESS' : 'RESET PROGRESS'}
                    </button>
                  </div>
                </section>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
