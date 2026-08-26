import { useEffect, useMemo, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { getTotalExpForLevel, useProgress } from '../progression'
import {
  equipItem,
  equipmentDefinitions,
  getCombatStats,
  partyMemberById,
  useRpg,
  type EquipmentSlot,
} from '../rpg'

type PauseTab = 'status' | 'items' | 'equipment' | 'party' | 'system'

const tabs: Array<{ id: PauseTab; label: string }> = [
  { id: 'status', label: 'STATUS' },
  { id: 'items', label: 'ITEMS' },
  { id: 'equipment', label: 'EQUIPMENT' },
  { id: 'party', label: 'PARTY' },
  { id: 'system', label: 'SYSTEM' },
]

export function PauseMenu() {
  const location = useLocation()
  const { progress, stats, resetProgress } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<PauseTab>('status')
  const [resetArmed, setResetArmed] = useState(false)
  const combatStats = getCombatStats(stats, rpgState)
  const nextLevelExp = getTotalExpForLevel(stats.level + 1)

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

  useEffect(() => {
    setOpen(false)
    setResetArmed(false)
  }, [location.pathname])

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

  return (
    <>
      <button
        type="button"
        className="pause-trigger secondary-button"
        onClick={() => setOpen(true)}
        aria-label="Pause menuを開く"
      >
        MENU
      </button>

      {open && (
        <div className="pause-overlay" role="presentation" onClick={() => setOpen(false)}>
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
              <button className="close-button" type="button" onClick={() => setOpen(false)}>×</button>
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
                    <div><span>MAX HP</span><strong>{combatStats.maxHp}</strong></div>
                    <div><span>ATTACK</span><strong>{combatStats.attack}</strong></div>
                    <div><span>DEFENSE</span><strong>{combatStats.defense}</strong></div>
                  </div>
                </section>
              )}

              {tab === 'items' && (
                <section className="pause-section pause-list">
                  <article className="pixel-inner-window pause-list-row">
                    <div><strong>PATCH KIT</strong><p>Battle中にHPを24回復。1Battleにつき1回。</p></div>
                    <span>×{progress.inventory.patchKit}</span>
                  </article>
                </section>
              )}

              {tab === 'equipment' && (
                <section className="pause-section equipment-sections">
                  {(['weapon', 'armor', 'accessory'] as EquipmentSlot[]).map((slot) => {
                    const equippedId = rpgState.equipment[slot]
                    return (
                      <div className="equipment-slot pixel-inner-window" key={slot}>
                        <header>
                          <span>{slot.toUpperCase()}</span>
                          <strong>{equippedId ? ownedEquipment.find((item) => item.id === equippedId)?.name ?? equippedId : 'EMPTY'}</strong>
                        </header>
                        <div className="equipment-options">
                          {ownedEquipment.filter((item) => item.slot === slot).map((item) => (
                            <button
                              type="button"
                              key={item.id}
                              className={equippedId === item.id ? 'is-equipped' : ''}
                              onClick={() => equip(item.id)}
                            >
                              <strong>{item.name}</strong>
                              <small>
                                {item.bonuses.attack ? `ATK +${item.bonuses.attack} ` : ''}
                                {item.bonuses.defense ? `DEF +${item.bonuses.defense} ` : ''}
                                {item.bonuses.maxHp ? `HP +${item.bonuses.maxHp}` : ''}
                              </small>
                            </button>
                          ))}
                          <button type="button" onClick={() => unequip(slot)}>EMPTY</button>
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
                      <p>LV {combatStats.level} · HP {combatStats.maxHp} · ATK {combatStats.attack} · DEF {combatStats.defense}</p>
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

              {tab === 'system' && (
                <section className="pause-section system-section">
                  <p>音量設定は画面下部のSOUNDコントロールから変更できます。</p>
                  <button
                    type="button"
                    className={resetArmed ? 'danger-button' : 'secondary-button'}
                    onClick={() => {
                      if (!resetArmed) {
                        setResetArmed(true)
                        return
                      }
                      resetProgress()
                      setOpen(false)
                      setResetArmed(false)
                    }}
                  >
                    {resetArmed ? 'CONFIRM RESET PROGRESS' : 'RESET PROGRESS'}
                  </button>
                </section>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
