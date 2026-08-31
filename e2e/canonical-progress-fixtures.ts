export const JS_LESSON_CLEARS = [
  7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
] as const

// Legacy numeric Battle 1 is the first semantic Story beat and has no Battle
// prerequisite. World gameplay still requires meeting BYTE before it triggers.
export const JS_BATTLE_1_PREREQS = [] as const
export const JS_FIRST_INCIDENT = [1] as const
export const JS_TRAINING_COMPLETE = [1, 7, 8, 9] as const

export const JS_MIDBOSS_PREREQS = [...JS_TRAINING_COMPLETE, 10, 11, 12] as const

export const JS_SECOND_INCIDENT_PREREQS = [...JS_MIDBOSS_PREREQS, 13, 14] as const

export const JS_BOSS_PREREQS = [
  ...JS_SECOND_INCIDENT_PREREQS,
  2,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
] as const

export const JS_COMPLETE = [...JS_BOSS_PREREQS, 3] as const

export const TS_BOSS_PREREQS = [...JS_COMPLETE, 4, 5] as const
