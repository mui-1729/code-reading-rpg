export type Seed = string | number

export type SeededRandom = {
  next: () => number
  int: (min: number, max: number) => number
  shuffle: <T>(items: readonly T[]) => T[]
}

function hashSeed(seed: Seed): number {
  const text = String(seed)
  let hash = 2166136261

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export function createSeededRandom(seed: Seed): SeededRandom {
  let state = hashSeed(seed)

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }

  const int = (min: number, max: number) => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError('int() requires integer bounds with min <= max')
    }

    return Math.floor(next() * (max - min + 1)) + min
  }

  const shuffle = <T>(items: readonly T[]): T[] => {
    const result = [...items]

    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = int(0, index)
      ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
    }

    return result
  }

  return { next, int, shuffle }
}
