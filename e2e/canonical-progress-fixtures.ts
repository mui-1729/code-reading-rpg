export const JS_LESSON_CLEARS = [
  7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
] as const

export const JS_BATTLE_1_PREREQS = [7, 8, 9] as const

export const JS_MIDBOSS_PREREQS = [7, 8, 9, 1, 10, 11, 12] as const

export const JS_BOSS_PREREQS = [
  7, 8, 9, 1, 10, 11, 12, 13, 14, 2, 15, 16, 17, 18, 19, 20, 21, 22,
] as const

export const JS_COMPLETE = [...JS_BOSS_PREREQS, 3] as const

export const TS_BOSS_PREREQS = [...JS_COMPLETE, 4, 5] as const
