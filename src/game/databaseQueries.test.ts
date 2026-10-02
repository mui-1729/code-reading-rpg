// @ts-expect-error Browser tsconfig excludes Node types; unit tests use the required Node.js 24 SQLite runtime.
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { getTargets } from './targeting'
import { allSkillDefinitionById, getSkillCardsForBattle } from './skills'
import { generateBattle } from './generator'
import type { Enemy } from './types'

const row=(id:string,hp:number,attackDamage:number):Enemy=>({id,hp,attackDamage,maxHp:100,name:id,role:'standard',visualId:'slime',glyph:'●',attackName:'Test'})
const boards=[
  [row('a',40,8),row('b',40,8),row('c',80,12),row('dead',0,99)],
  [row('c',80,12),row('b',40,8),row('a',40,8)],
  [row('dead',0,99)],
  [row('a',1,1),row('b',49,6)],
]

describe('Database query semantics',()=>{
  it('全SQL variantがSQLiteの実SELECTと同じid列を返し、元のrow順を変更しない',()=>{
    const db=new DatabaseSync(':memory:')
    try {
      db.exec('CREATE TABLE enemies(id TEXT PRIMARY KEY, hp INTEGER, attackDamage INTEGER)')
      const insert=db.prepare('INSERT INTO enemies VALUES(?,?,?)')
      const cards=Array.from({length:24},(_,ordinal)=>getSkillCardsForBattle(generateBattle(23,`encounter:${ordinal}:sql:oracle`)!,`encounter:${ordinal}:sql:oracle`)).flat()
      for(const board of boards) {
        db.exec('DELETE FROM enemies')
        for(const enemy of board) insert.run(enemy.id,enemy.hp,enemy.attackDamage)
        const unchanged=structuredClone(board)
        for(const card of cards) {
          const expected=db.prepare(card.code).all().map((result:Record<string,string|number>)=>result.id)
          expect(getTargets(board,card.rule).map((enemy)=>enemy.id)).toEqual(expected)
        }
        expect(board).toEqual(unchanged)
      }
      for(const id of ['record-spark','record-storm','record-flare']) {
        const definition=allSkillDefinitionById[id]
        for(const variant of definition.codeVariants) expect(getTargets(boards[3],definition.rule).map((enemy)=>enemy.id)).toEqual(db.prepare(variant.code).all().map((result:Record<string,string|number>)=>result.id))
      }
    } finally {db.close()}
  })

  it('seedは同名Skillの条件・順序・件数を変え、reloadで完全に再現する',()=>{
    const battle=generateBattle(23,'sql-repeat')!
    const cards=Array.from({length:12},(_,ordinal)=>getSkillCardsForBattle(battle,`encounter:${ordinal}:sql:variants`))
    for(const id of battle.skillIds) expect(new Set(cards.flat().filter((card)=>card.id===id).map((card)=>JSON.stringify(card.rule))).size).toBe(4)
    expect(getSkillCardsForBattle(battle,'sql-repeat')).toEqual(getSkillCardsForBattle(battle,'sql-repeat'))
  })
})
