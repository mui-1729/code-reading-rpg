import type { SkillDefinition } from './skillDefinitions'

export const forestSkillDefinitions: readonly SkillDefinition[] = [
  {
    id: 'link',
    name: 'LINK',
    power: 44,
    rule: { kind: 'firstAboveAndNamed', hp: 50, name: 'Goblin' },
    concept: 'find() + &&',
    explanation:
      '&& は左右の条件が両方trueのときだけtrueになります。この技は「HPが50より大きい」かつ「名前がGoblin」の最初の敵をfind()で探します。',
    codeVariants: [
      {
        id: 'short',
        code: 'enemies.find(e => e.hp > 50 && e.name === "Goblin")',
        lineMode: 'single',
      },
      {
        id: 'enemy',
        code: 'enemies.find(enemy => enemy.hp > 50 && enemy.name === "Goblin")',
        lineMode: 'single',
      },
      {
        id: 'target',
        code: 'enemies.find(target => target.hp > 50 && target.name === "Goblin")',
        lineMode: 'single',
      },
      {
        id: 'foe',
        code: 'enemies.find(foe => foe.hp > 50 && foe.name === "Goblin")',
        lineMode: 'single',
      },
    ],
  },
  {
    id: 'fork',
    name: 'FORK',
    power: 46,
    rule: { kind: 'firstBelowOrAbove', below: 40, above: 80 },
    concept: 'find() + ||',
    explanation:
      '|| は左右のどちらか一方でもtrueならtrueになります。この技は生存中で、HPが40未満または80より大きい最初の敵をfind()で探します。',
    codeVariants: [
      {
        id: 'short',
        code: 'enemies.find(e => e.hp > 0 && (e.hp < 40 || e.hp > 80))',
        lineMode: 'single',
      },
      {
        id: 'enemy',
        code: 'enemies.find(enemy => enemy.hp > 0 && (enemy.hp < 40 || enemy.hp > 80))',
        lineMode: 'single',
      },
      {
        id: 'target',
        code: 'enemies.find(target => target.hp > 0 && (target.hp < 40 || target.hp > 80))',
        lineMode: 'single',
      },
      {
        id: 'foe',
        code: 'enemies.find(foe => foe.hp > 0 && (foe.hp < 40 || foe.hp > 80))',
        lineMode: 'single',
      },
    ],
  },
]
