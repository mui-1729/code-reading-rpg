const enemyVisualIdByName: Readonly<Record<string, string>> = {
  Slime: 'slime',
  Goblin: 'goblin',
  Golem: 'golem',
  Boss: 'boss',
  Sprout: 'sprout',
  Boar: 'boar',
  Guardian: 'guardian',
  'Root Guardian': 'root-guardian',
}

export const ENEMY_VISUAL_FALLBACK_ID = 'enemy-fallback'

export function getEnemyVisualId(name: string): string {
  return enemyVisualIdByName[name] ?? ENEMY_VISUAL_FALLBACK_ID
}
