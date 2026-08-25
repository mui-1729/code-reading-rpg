import { describe, expect, it } from 'vitest'
import { createSeededRandom } from './random'

describe('createSeededRandom', () => {
  it('同じseedから同じ乱数列を再現する', () => {
    const first = createSeededRandom('run-42')
    const second = createSeededRandom('run-42')

    expect([first.next(), first.next(), first.next()]).toEqual([
      second.next(),
      second.next(),
      second.next(),
    ])
  })

  it('異なるseedでは異なる乱数列を生成する', () => {
    const first = createSeededRandom('run-1')
    const second = createSeededRandom('run-2')

    expect([first.next(), first.next(), first.next()]).not.toEqual([
      second.next(),
      second.next(),
      second.next(),
    ])
  })

  it('intは指定した整数範囲内の値だけを返す', () => {
    const random = createSeededRandom(1234)
    const values = Array.from({ length: 100 }, () => random.int(3, 7))

    expect(values.every((value) => Number.isInteger(value) && value >= 3 && value <= 7)).toBe(
      true,
    )
  })

  it('intは不正な範囲を拒否する', () => {
    const random = createSeededRandom(1234)

    expect(() => random.int(5, 4)).toThrow(RangeError)
    expect(() => random.int(1.5, 4)).toThrow(RangeError)
  })

  it('shuffleは同じseedなら同じ順序になり元配列を変更しない', () => {
    const source = ['trace', 'pulse', 'nova', 'viper', 'moon-edge']
    const first = createSeededRandom('shuffle-seed').shuffle(source)
    const second = createSeededRandom('shuffle-seed').shuffle(source)

    expect(first).toEqual(second)
    expect(first).toHaveLength(source.length)
    expect([...first].sort()).toEqual([...source].sort())
    expect(source).toEqual(['trace', 'pulse', 'nova', 'viper', 'moon-edge'])
  })
})
