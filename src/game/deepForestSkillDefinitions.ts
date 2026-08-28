import type { SkillDefinition } from './skillDefinitions'

export const deepForestSkillDefinitions: readonly SkillDefinition[] = [
  {
    id: 'project',
    name: 'PROJECT',
    power: 40,
    rule: { kind: 'firstAbove', hp: 0 },
    concept: 'map() + find()',
    explanation:
      'map() は配列の各要素を別の形へ変換し、新しい配列を作ります。この技は各Enemyを { enemy, hp } へ変換してから、既習のfind()で最初の生存Enemyを取り出します。',
    codeVariants: [
      {
        id: 'short',
        code: 'enemies.map(e => ({ enemy: e, hp: e.hp })).find(entry => entry.hp > 0).enemy',
        lineMode: 'single',
      },
      {
        id: 'enemy',
        code: 'enemies.map(enemy => ({ enemy, hp: enemy.hp })).find(entry => entry.hp > 0).enemy',
        lineMode: 'single',
      },
      {
        id: 'target',
        code: 'enemies.map(target => ({ enemy: target, hp: target.hp })).find(entry => entry.hp > 0).enemy',
        lineMode: 'single',
      },
    ],
  },
  {
    id: 'signal',
    name: 'SIGNAL',
    power: 20,
    rule: { kind: 'allIfAnyBelow', hp: 50 },
    concept: 'filter() + some()',
    explanation:
      'some() は「一つでも条件に合うものがあるか」をtrue / falseで返します。この技は生存EnemyにHP50未満が一体でもいれば、生存Enemy全員を対象にします。',
    codeVariants: [
      {
        id: 'short',
        code: 'enemies.filter(target => target.hp > 0 && enemies.some(e => e.hp > 0 && e.hp < 50))',
        lineMode: 'single',
      },
      {
        id: 'enemy',
        code: 'enemies.filter(target => target.hp > 0 && enemies.some(enemy => enemy.hp > 0 && enemy.hp < 50))',
        lineMode: 'single',
      },
      {
        id: 'foe',
        code: 'enemies.filter(target => target.hp > 0 && enemies.some(foe => foe.hp > 0 && foe.hp < 50))',
        lineMode: 'single',
      },
    ],
  },
  {
    id: 'sync',
    name: 'SYNC',
    power: 22,
    rule: { kind: 'allIfEveryBelow', hp: 100 },
    concept: 'filter() + every()',
    explanation:
      'every() は「全部が条件に合うか」をtrue / falseで返します。この技は生存Enemy全員がHP100未満のとき、生存Enemy全員を対象にします。',
    codeVariants: [
      {
        id: 'short',
        code: 'enemies.filter(target => target.hp > 0 && enemies.filter(e => e.hp > 0).every(e => e.hp < 100))',
        lineMode: 'single',
      },
      {
        id: 'enemy',
        code: 'enemies.filter(target => target.hp > 0 && enemies.filter(enemy => enemy.hp > 0).every(enemy => enemy.hp < 100))',
        lineMode: 'single',
      },
      {
        id: 'foe',
        code: 'enemies.filter(target => target.hp > 0 && enemies.filter(foe => foe.hp > 0).every(foe => foe.hp < 100))',
        lineMode: 'single',
      },
    ],
  },
  {
    id: 'order',
    name: 'ORDER',
    power: 58,
    rule: { kind: 'lowestHp' },
    concept: 'filter() + sort() + [0]',
    explanation:
      'sort() は配列の順番を並べ替えます。HPの小さい順に並べたあと[0]で先頭を取ると、現在HPが最も低いEnemyを選べます。',
    codeVariants: [
      {
        id: 'ordered-short',
        code: 'const alive = enemies.filter(e => e.hp > 0)\nconst ordered = [...alive].sort((a, b) => a.hp - b.hp)\nordered[0]',
        lineMode: 'multi',
        codeHelpLines: [
          'まずfilter()で生存Enemyだけをaliveへ集める。',
          'sort()のa.hp - b.hpでHPの小さい順へ並べ、orderedへ入れる。',
          '[0]は配列の先頭。ordered[0]が現在HPの最も低いEnemy。',
        ],
      },
      {
        id: 'ordered-named',
        code: 'const alive = enemies.filter(enemy => enemy.hp > 0)\nconst ordered = [...alive].sort((left, right) => left.hp - right.hp)\nordered[0]',
        lineMode: 'multi',
        codeHelpLines: [
          'filter()で撃破済みEnemyを除き、aliveを作る。',
          'left.hp - right.hpが負ならleftを前へ置くので、HP昇順になる。',
          '並べ替えた配列の[0]、つまり先頭を選ぶ。',
        ],
      },
    ],
  },
  {
    id: 'safe-path',
    name: 'SAFE PATH',
    power: 60,
    rule: { kind: 'lowestHp' },
    concept: 'optional chaining ?. + nullish coalescing ??',
    explanation:
      '?. は左側がnull / undefinedならそこで止まり、?? は左側がnull / undefinedのときだけ右側を使います。この技ではHPが読めない場合をInfinityとして扱い、安全に昇順へ並べます。',
    codeVariants: [
      {
        id: 'safe-short',
        code: 'const alive = enemies.filter(e => e.hp > 0)\nconst ordered = [...alive].sort((a, b) => (a?.hp ?? Infinity) - (b?.hp ?? Infinity))\nordered[0]',
        lineMode: 'multi',
        codeHelpLines: [
          '生存Enemyだけをaliveへ残す。',
          'a?.hpで安全にhpを読み、値がないときだけ?? Infinityを使って後ろへ送る。',
          '最後にordered[0]を取り、HPが最も低いEnemyを選ぶ。',
        ],
      },
      {
        id: 'safe-named',
        code: 'const alive = enemies.filter(enemy => enemy.hp > 0)\nconst ordered = [...alive].sort((left, right) => (left?.hp ?? Infinity) - (right?.hp ?? Infinity))\nordered[0]',
        lineMode: 'multi',
        codeHelpLines: [
          'まずaliveへ生存Enemyを集める。',
          '?.は値がなければundefinedで止まり、??はその場合だけInfinityへ置き換える。',
          'sort()後の先頭を[0]で取る。',
        ],
      },
    ],
  },
  {
    id: 'reduce-focus',
    name: 'REDUCE FOCUS',
    power: 54,
    rule: { kind: 'highestAttack' },
    concept: 'filter() + reduce()',
    explanation:
      'reduce() は配列を左から順に見ながら、途中結果を一つにまとめていきます。この技はbestへ攻撃力が高い方を残し続け、最後に最も攻撃力が高いEnemyを一体だけ返します。',
    codeVariants: [
      {
        id: 'reduce-short',
        code: 'const alive = enemies.filter(e => e.hp > 0)\nalive.reduce((best, e) => e.attackDamage > best.attackDamage ? e : best)',
        lineMode: 'multi',
        codeHelpLines: [
          'filter()で生存Enemyだけをaliveへ残す。',
          'reduce()はbestと次のeを比べ、攻撃力が高い方を次のbestとして残す。? : はtrueなら左、falseなら右を返す。',
          '最後まで比べ終わったbestが、攻撃力最大のEnemy。',
        ],
      },
      {
        id: 'reduce-named',
        code: 'const alive = enemies.filter(enemy => enemy.hp > 0)\nalive.reduce((best, enemy) => enemy.attackDamage > best.attackDamage ? enemy : best)',
        lineMode: 'multi',
        codeHelpLines: [
          'まず生存Enemyだけのaliveを作る。',
          'reduce()でbestとenemyを一体ずつ比較し、attackDamageが大きい方を残す。',
          '最後に残った一体がtargetになる。',
        ],
      },
    ],
  },
]
