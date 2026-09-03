import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { writeStoredAudioSettings } from '../audio/audioSettingsStorage'
import { gameAudio, type AudioSettings } from '../audio/gameAudio'
import { useBattleRuntime } from '../battle/BattleRuntimeContext'
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
  getPartyMemberGrowth,
  partyMemberById,
  useRpg,
  type EquipmentSlot,
} from '../rpg'
import { useTutorial } from '../tutorial/useTutorial'
import { getWorldObjectives } from '../world/worldObjective'
import { WorldAtlas } from './WorldAtlas'
import { useModalFocus } from './useModalFocus'

type PauseTab = 'status' | 'map' | 'items' | 'equipment' | 'party' | 'codex' | 'system'
type PauseTabDefinition = { id: PauseTab; label: string; icon: string }

const tabs: PauseTabDefinition[] = [
  { id: 'status', label: 'ステータス', icon: '/pixel-art/characters/code-knight-field.svg' },
  { id: 'map', label: 'マップ', icon: '/pixel-art/ui/map.svg' },
  { id: 'items', label: 'アイテム', icon: '/pixel-art/items/patch-kit.svg' },
  { id: 'equipment', label: '装備', icon: '/pixel-art/equipment/weapons/training-blade.svg' },
  { id: 'party', label: '仲間', icon: '/pixel-art/characters/byte-field.svg' },
  { id: 'codex', label: 'コード図鑑', icon: '/pixel-art/ui/codex.svg' },
  { id: 'system', label: '設定', icon: '/pixel-art/ui/system.svg' },
]

const equipmentSlotLabels: Record<EquipmentSlot, string> = {
  weapon: '武器',
  armor: '防具',
  accessory: 'アクセサリ',
}

const partyRoleLabels: Record<string, string> = {
  SCOUT: '斥候',
}

const toPercent = (value: number) => Math.round(value * 100)

export function PauseMenu() {
  const location = useLocation()
  const { snapshot: battleRuntime } = useBattleRuntime()
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
  const isBattleRoute = location.pathname.includes('/battle/')
  const battleMenuAvailable = !isBattleRoute || Boolean(
    battleRuntime &&
    battleRuntime.phase === 'battle' &&
    !battleRuntime.isResolving &&
    !battleRuntime.isModalOpen,
  )
  const equipmentLocked = isBattleRoute && battleRuntime !== null

  const closeMenu = useCallback(() => {
    setOpen(false)
    setResetArmed(false)
  }, [])

  const dialogRef = useModalFocus<HTMLElement>({
    open,
    onEscape: closeMenu,
  })

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return
    document.body.dataset.rpgPaused = open ? 'true' : 'false'
    return () => {
      document.body.dataset.rpgPaused = 'false'
    }
  }, [open])

  useEffect(() => {
    if (open && isBattleRoute && !battleMenuAvailable) queueMicrotask(closeMenu)
  }, [battleMenuAvailable, closeMenu, isBattleRoute, open])

  const ownedEquipment = useMemo(
    () => equipmentDefinitions.filter((item) => rpgState.ownedEquipmentIds.includes(item.id)),
    [rpgState.ownedEquipmentIds],
  )

  if (location.pathname === '/') return null

  const toggleEquipment = (equipmentId: string, slot: EquipmentSlot) => {
    if (equipmentLocked) return
    setRpgState((current) => ({
      ...current,
      equipment:
        current.equipment[slot] === equipmentId
          ? { ...current.equipment, [slot]: null }
          : equipItem(current.equipment, equipmentId),
    }))
  }

  const unequip = (slot: EquipmentSlot) => {
    if (equipmentLocked) return
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

  return (
    <>
      {battleMenuAvailable && (
        <button
          type="button"
          className="pause-trigger secondary-button"
          onClick={(event) => {
            if (!battleMenuAvailable) return
            event.currentTarget.focus()
            setAudioSettings(gameAudio.getSettings())
            setOpen(true)
          }}
          aria-label="メニューを開く"
        >
          メニュー
        </button>
      )}

      {open && (
        <div className="pause-overlay" role="presentation" onClick={closeMenu}>
          <section
            ref={dialogRef}
            className="pause-menu pixel-window"
            role="dialog"
            aria-modal="true"
            aria-label="メニュー"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="pause-header pause-header-actions">
              <button
                className="close-button"
                type="button"
                onClick={closeMenu}
                aria-label="メニューを閉じる"
              >
                ×
              </button>
            </header>

            <nav className="pause-tabs" aria-label="メニュー項目">
              {tabs.map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  data-pause-tab={entry.id}
                  className={tab === entry.id ? 'is-active' : ''}
                  aria-pressed={tab === entry.id}
                  onClick={() => {
                    setTab(entry.id)
                    setResetArmed(false)
                  }}
                >
                  <img
                    className="pause-tab-icon"
                    data-pause-tab-icon={entry.id}
                    src={entry.icon}
                    alt=""
                    aria-hidden="true"
                  />
                  <span>{entry.label}</span>
                </button>
              ))}
            </nav>

            <div className="pause-content" tabIndex={-1}>
              {tab === 'status' && (
                <section className="pause-section">
                  <div className="pause-stat-grid">
                    <div><span>LV</span><strong>{combatStats.level}</strong></div>
                    <div><span>EXP</span><strong>{progress.exp} / {nextLevelExp}</strong></div>
                    <div><span>所持金</span><strong>{progress.gold} G</strong></div>
                    <div><span>HP</span><strong>{rpgState.currentHp} / {combatStats.maxHp}</strong></div>
                    <div><span>攻撃</span><strong>{combatStats.attack}</strong></div>
                    <div><span>防御</span><strong>{combatStats.defense}</strong></div>
                  </div>

                  <div className="world-objective-list" aria-label="地域ごとの目的">
                    {worldObjectives.map((objective) => (
                      <article
                        className={`world-objective-row pixel-inner-window is-${objective.status}`}
                        key={objective.region}
                      >
                        <header>
                          <span>{objective.label}</span>
                          <strong>{objective.clearedBattles} / {objective.totalBattles}</strong>
                        </header>
                        <p>{objective.status === 'clear' ? 'エリアクリア' : `次 → ${objective.next}`}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {tab === 'map' && <WorldAtlas progress={progress} rpgState={rpgState} />}

              {tab === 'items' && (
                <section className="pause-section item-inventory-grid" aria-label="アイテム一覧">
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
                          {count > 0 ? '戦闘で使用可能' : '所持なし'}
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
                          <span>{equipmentSlotLabels[slot]}</span>
                          <strong>
                            {equippedId
                              ? ownedEquipment.find((item) => item.id === equippedId)?.name ?? equippedId
                              : '未装備'}
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
                                onClick={() => toggleEquipment(item.id, slot)}
                                disabled={equipmentLocked}
                                data-equipment-id={item.id}
                                data-equipment-state={equipped ? 'equipped' : 'owned'}
                                aria-label={`${item.name}${equipped ? ' 装備中・押すと外す' : ' を装備'}`}
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
                                      {equipped ? '装備中' : '所持'}
                                    </em>
                                  </span>
                                </span>
                                <small>{presentation.statSummary}</small>
                                <span className="equipment-comparison">
                                  {equipped
                                    ? '現在の装備 · 押すと外す'
                                    : `比較: ${presentation.currentEquipmentName} · ${presentation.deltaSummary}`}
                                </span>
                                <span className="equipment-description">{item.description}</span>
                              </button>
                            )
                          })}
                          <button
                            type="button"
                            className="equipment-empty-option"
                            onClick={() => unequip(slot)}
                            disabled={!equippedId || equipmentLocked}
                          >
                            装備を外す
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {equipmentLocked && (
                    <p className="equipment-battle-lock" role="status">
                      バトル中は装備を変更できません
                    </p>
                  )}
                </section>
              )}

              {tab === 'party' && (
                <section className="pause-section pause-list">
                  <article className="pixel-inner-window pause-list-row party-row">
                    <div>
                      <strong>CODE KNIGHT</strong>
                      <p>LV {combatStats.level} · HP {rpgState.currentHp}/{combatStats.maxHp} · 攻撃 {combatStats.attack} · 防御 {combatStats.defense}</p>
                    </div>
                    <span>リーダー</span>
                  </article>
                  {rpgState.partyMemberIds.length === 0 ? (
                    <p className="pause-empty">仲間はいない。HubにいるBYTEに話しかけると加入する。</p>
                  ) : (
                    rpgState.partyMemberIds.map((memberId) => {
                      const member = partyMemberById[memberId]
                      const growth = getPartyMemberGrowth(memberId, combatStats.level)
                      if (!member || !growth) return null
                      return (
                        <article className="pixel-inner-window pause-list-row party-row" key={member.id}>
                          <div>
                            <strong>
                              {member.name} · {partyRoleLabels[member.role] ?? member.role} · ランク {growth.rank}
                            </strong>
                            <p>追撃 {growth.followUpDamage} · 1行動につき選択中の1体へ</p>
                            <p className="party-growth-note">
                              {growth.nextRankAtPlayerLevel === null
                                ? `最大ランク · ランクごとに追撃 +${member.followUpDamagePerRank}`
                                : `次のランク → プレイヤーLV ${growth.nextRankAtPlayerLevel} · ランクごとに追撃 +${member.followUpDamagePerRank}`}
                            </p>
                          </div>
                          <span>仲間</span>
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
                        <span>サウンド</span>
                        <p>BGMとSEはここで設定します。</p>
                      </div>
                      <strong>{audioSettings.muted ? 'OFF' : 'ON'}</strong>
                    </header>

                    <button
                      type="button"
                      className={`audio-toggle ${audioSettings.muted ? 'muted' : ''}`}
                      onClick={toggleSound}
                      aria-pressed={audioSettings.muted}
                    >
                      {audioSettings.muted ? 'サウンド OFF' : 'サウンド ON'}
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
                        aria-label="SE音量"
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
                        aria-label="BGM音量"
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
                      チュートリアルをやり直す
                    </button>
                  </div>

                  <div className="pause-reset-panel pixel-inner-window">
                    <p>進行・装備・仲間・World位置を最初からやり直します。サウンド設定は保持します。</p>
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
                      {resetArmed ? '本当に進行をリセットする' : '進行をリセット'}
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
