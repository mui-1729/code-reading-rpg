export type RawResultItem = {
  label?: string
  value?: string
  text?: string
}

export type ResultSequenceTone = 'reward' | 'level' | 'unlock' | 'clear' | 'quest'

export type ResultSequenceItem = {
  id: string
  title: string
  detail?: string
  tone: ResultSequenceTone
}

const normalized = (value?: string) => value?.replace(/\s+/g, ' ').trim() ?? ''

export function buildResultSequence(rawItems: RawResultItem[]): ResultSequenceItem[] {
  const items: ResultSequenceItem[] = []

  for (let index = 0; index < rawItems.length; index += 1) {
    const raw = rawItems[index]
    const label = normalized(raw.label)
    const value = normalized(raw.value)
    const text = normalized(raw.text)

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
        detail: text.replace('SKILL UNLOCKED:', '').trim(),
        tone: 'unlock',
      })
      continue
    }

    if (text.startsWith('AREA CLEAR:')) {
      items.push({
        id: `area-${index}`,
        title: 'AREA CLEAR',
        detail: text.replace('AREA CLEAR:', '').trim(),
        tone: 'clear',
      })
      continue
    }

    if (text.startsWith('QUEST UPDATED:') || text.startsWith('MAIN QUEST COMPLETE:') || text.startsWith('SIDE QUEST COMPLETE:')) {
      const separator = text.indexOf(':')
      items.push({
        id: `quest-${index}`,
        title: text.slice(0, separator),
        detail: text.slice(separator + 1).trim(),
        tone: 'quest',
      })
      continue
    }

    if (text) {
      items.push({ id: `result-${index}`, title: text, tone: 'unlock' })
    }
  }

  return items
}
