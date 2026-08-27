export type RawResultItem = {
  label?: string
  value?: string
  text?: string
  equipmentId?: string
  equipmentName?: string
}

export type ResultSequenceTone = 'reward' | 'level' | 'unlock' | 'clear' | 'progress'

export type ResultSequenceItem = {
  id: string
  title: string
  detail?: string
  tone: ResultSequenceTone
  equipmentId?: string
}

const normalized = (value?: string) => value?.replace(/\s+/g, ' ').trim() ?? ''
const detailAfterColon = (text: string) => text.slice(text.indexOf(':') + 1).trim()
const isWorldProgressText = (text: string) =>
  text.startsWith('WORLD PROGRESS:') ||
  text.startsWith('BOSS UNLOCKED:') ||
  text.startsWith('WORLD COMPLETE:')

export function buildResultSequence(rawItems: RawResultItem[]): ResultSequenceItem[] {
  const items: ResultSequenceItem[] = []
  const hasWorldProgress = rawItems.some((item) => isWorldProgressText(normalized(item.text)))

  for (let index = 0; index < rawItems.length; index += 1) {
    const raw = rawItems[index]
    const label = normalized(raw.label)
    const value = normalized(raw.value)
    const text = normalized(raw.text)

    if (raw.equipmentId) {
      items.push({
        id: `equipment-${index}`,
        title: 'EQUIPMENT ACQUIRED',
        detail: normalized(raw.equipmentName) || raw.equipmentId,
        tone: 'unlock',
        equipmentId: raw.equipmentId,
      })
      continue
    }

    if (label === 'EXP GAINED') {
      items.push({ id: `exp-${index}`, title: 'EXP GAINED', detail: value, tone: 'reward' })
      continue
    }

    if (label === 'GOLD GAINED') {
      items.push({ id: `gold-${index}`, title: 'GOLD GAINED', detail: value, tone: 'reward' })
      continue
    }

    if (label === 'LEVEL') {
      const nextText = normalized(rawItems[index + 1]?.text)
      if (nextText.includes('LEVEL UP')) {
        items.push({ id: `level-${index}`, title: 'LEVEL UP!', detail: value, tone: 'level' })
        index += 1
      }
      continue
    }

    if (text === 'STAGE CLEAR RECORDED') {
      const nextText = normalized(rawItems[index + 1]?.text)
      const unlocked = /^STAGE \d+ UNLOCKED$/.test(nextText) ? nextText : ''

      if (hasWorldProgress) {
        if (unlocked) index += 1
        continue
      }

      items.push({
        id: `stage-clear-${index}`,
        title: 'STAGE CLEAR',
        detail: unlocked || undefined,
        tone: 'clear',
      })
      if (unlocked) index += 1
      continue
    }

    if (text.startsWith('SKILL UNLOCKED:')) {
      items.push({
        id: `skill-${index}`,
        title: 'SKILL UNLOCKED',
        detail: detailAfterColon(text),
        tone: 'unlock',
      })
      continue
    }

    if (text.startsWith('AREA CLEAR:')) {
      const nextText = normalized(rawItems[index + 1]?.text)
      const worldComplete = nextText.startsWith('WORLD COMPLETE:') ? nextText : ''
      const detail = worldComplete
        ? `${detailAfterColon(text)} · ${detailAfterColon(worldComplete)}`
        : detailAfterColon(text)

      items.push({ id: `area-${index}`, title: 'AREA CLEAR', detail, tone: 'clear' })
      if (worldComplete) index += 1
      continue
    }

    if (text.startsWith('WORLD PROGRESS:')) {
      items.push({
        id: `world-progress-${index}`,
        title: 'WORLD PROGRESS',
        detail: detailAfterColon(text),
        tone: 'progress',
      })
      continue
    }

    if (text.startsWith('BOSS UNLOCKED:')) {
      items.push({
        id: `boss-unlocked-${index}`,
        title: 'BOSS UNLOCKED',
        detail: detailAfterColon(text),
        tone: 'progress',
      })
      continue
    }

    if (text.startsWith('WORLD COMPLETE:')) {
      items.push({
        id: `world-complete-${index}`,
        title: 'WORLD COMPLETE',
        detail: detailAfterColon(text),
        tone: 'clear',
      })
      continue
    }

    if (text) {
      items.push({ id: `result-${index}`, title: text, tone: 'unlock' })
    }
  }

  return items
}
