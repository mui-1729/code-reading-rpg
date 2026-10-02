import { renderDatabaseQuery, type DatabaseQuery } from './databaseQueries'
import type { SkillDefinition } from './skillDefinitions'

import type { SemanticSkillVariant } from './semanticSkillVariants'

function queryCodeVariants(query:DatabaseQuery):SkillDefinition['codeVariants'] {
  const code=renderDatabaseQuery(query)
  const single=code.replaceAll('\n',' ')
  return [
    {id:'query',code,lineMode:'multi',codeHelpLines:[
      'SELECT id: 取得した行のid列を返す。idと敵の対応はCODE DATAで確認できる。',
      'FROM enemies: 読み取り元の表。行は一体の敵、列はその情報。',
      'WHERE: 各行に条件を当てはめ、条件を満たす行を残す。hp > 0は撃破済みの行を除く。',
      'ORDER BY: ASCは小さい順、DESCは大きい順。同値なら次のid ASCで順番を決める。',
      'LIMIT: 並べた行の先頭から指定件数まで取得する。条件に合う行が少なければ件数も減る。',
    ]},
    {id:'compact',code:single,lineMode:'single'},
    {id:'compact-lowercase',code:single.replace(/SELECT|FROM|WHERE|AND|ORDER BY|ASC|DESC|LIMIT/g,(keyword)=>keyword.toLowerCase()),lineMode:'single'},
  ]
}

function querySkill(id: string, name: string, power: number, query: DatabaseQuery): SkillDefinition {
  return {
    id, name, power, rule: {kind: 'databaseQuery', query},
    concept: 'SELECT / WHERE / ORDER BY / LIMIT',
    explanation: 'enemiesテーブルを読み、WHEREで行を絞り、ORDER BYで並べ、LIMITで取得件数を制限する。SELECT idが返す識別子の敵へ術を届ける。',
    codeVariants: queryCodeVariants(query),
  }
}

export const databaseSkillDefinitions: readonly SkillDefinition[] = [
  querySkill('record-spark', 'RECORD SPARK', 40, {orderBy:'hp', direction:'ASC', limit:1}),
  querySkill('record-storm', 'RECORD STORM', 32, {where:{column:'attackDamage',minimum:8},orderBy:'attackDamage',direction:'DESC',limit:2}),
  querySkill('record-flare', 'RECORD FLARE', 48, {where:{column:'hp',minimum:60},orderBy:'hp',direction:'DESC',limit:1}),
]


const alternateQueries:Record<string,readonly DatabaseQuery[]> = {
  'record-spark':[
    {orderBy:'hp',direction:'DESC',limit:1},
    {orderBy:'hp',direction:'ASC',limit:2},
    {orderBy:'hp',direction:'DESC',limit:2},
  ],
  'record-storm':[
    {where:{column:'attackDamage',minimum:6},orderBy:'attackDamage',direction:'ASC',limit:1},
    {where:{column:'attackDamage',minimum:9},orderBy:'attackDamage',direction:'DESC',limit:1},
    {where:{column:'attackDamage',minimum:5},orderBy:'attackDamage',direction:'ASC',limit:2},
  ],
  'record-flare':[
    {where:{column:'hp',minimum:50},orderBy:'hp',direction:'ASC',limit:2},
    {where:{column:'hp',minimum:70},orderBy:'hp',direction:'DESC',limit:2},
    {where:{column:'hp',minimum:80},orderBy:'hp',direction:'ASC',limit:1},
  ],
}

export const databaseSemanticVariants:Readonly<Record<string,readonly SemanticSkillVariant[]>> = Object.fromEntries(
  databaseSkillDefinitions.map((definition)=>[definition.id,(alternateQueries[definition.id]??[]).map((query,index)=>({
    id:`query-${index+1}`,rule:{kind:'databaseQuery',query},concept:definition.concept,explanation:definition.explanation,
    codeVariants:queryCodeVariants(query),requiredSyntax:['sql-select','sql-where','sql-order-by','sql-limit'],
  }))]),
)
