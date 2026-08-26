# CODE//READ RPG アーキテクチャ

## 1. 目的

この文書は、現在の責務分割と今後Areaを増やすときの境界を定義する。

原則は、**コード読解のGame Domain、RPG進行、Field / Dialogue、Audio / Motion、Routingを必要以上に密結合させない**こと。

---

## 2. 現在の全体構成

```text
Browser
  ↓
React 19 + TanStack Router
  ├── World / Route UI
  ├── Field / Dialogue UI
  ├── Battle UI
  └── Audio / Motion presentation
        ↓
Game Domain
  ├── Area metadata
  ├── Battle definitions
  ├── SkillDefinition / codeVariants
  ├── TargetRule
  ├── Seeded generator
  └── Solvability
        ↓
Progression
  ├── EXP / Level
  ├── Stage / Area CLEAR
  └── Skill unlock
        ↓
LocalStorage persistence
```

FrontendはVite SPAとしてCloudflare Workers Static Assetsへdeployする。

---

## 3. 主なディレクトリ

```text
src/
├── App.tsx                    # Battle runtime / UI
├── AppRouter.tsx
├── router.tsx                 # route tree
├── routeComponents.tsx        # Title / Stage Select / Complete
├── world/
│   └── WorldPage.tsx
├── field/
│   ├── JavaScriptFieldPage.tsx
│   ├── JavaScriptFieldRoute.tsx
│   └── field.ts               # movement / collision / interaction
├── dialogue/
│   ├── dialogue.ts
│   ├── npcs.ts
│   └── types.ts
├── game/
│   ├── areas.ts               # Area metadata / route metadata
│   ├── areaProgression.ts     # Area ↔ Battle lookup
│   ├── battles.ts
│   ├── generator.ts
│   ├── skillDefinitions.ts
│   ├── skills.ts
│   ├── targeting.ts
│   ├── random.ts
│   └── solvability.ts
├── progression/
│   ├── progression.ts
│   ├── storage.ts
│   ├── ProgressProvider.tsx
│   └── types.ts
├── audio/
│   ├── gameAudio.ts
│   ├── AudioControls.tsx
│   └── useBgm.ts
└── motion/
    └── battleMotion.ts
```

---

## 4. Routing

現在の公開route:

```text
/
/world
/javascript
/javascript/field
/javascript/battle/$battleId?seed=...&returnTo=...
/javascript/complete
```

JavaScript KingdomのURLは既存save / bookmark / deep link互換のため維持する。

### Area route metadata

Area固有の画面遷移先は`src/game/areas.ts`へ集約する。

```ts
AreaDefinition = {
  id,
  label,
  title,
  description,
  availability,
  routes: {
    stageSelect,
    field,
    complete,
  },
  bossBattleId,
}
```

`comingSoon` Areaはrouteを`null`にする。未実装Areaのために空のFieldや架空Battleを作らない。

次Areaを実装するときは、既存JavaScript routeを変更せず、そのAreaのrouteを追加する。

---

## 5. Area / Battle関係

Battleは`areaId`を持つ。UIが毎回独自に`filter()`やBoss検索をせず、`src/game/areaProgression.ts`を使う。

```text
getBattlesForArea(areaId)
getAreaForBattle(battleId)
getBossBattleForArea(areaId)
```

守る条件:

- すべてのBattleの`areaId`は実在Areaを参照する
- `bossBattleId`は同じAreaのBoss Battleを参照する
- COMING SOON AreaにはBattleを先に作らない
- JavaScript routeから別AreaのBattleを開かない

これらはUnit Testで検証する。

---

## 6. Game Domain

`src/game/`はUIから独立したゲーム定義と純粋ロジックを担当する。

### Battle

基準Enemy / Skill / reward / Area所属を持つ。

Player Levelに合わせてEnemyをruntimeで自動弱体化しない。

### SkillDefinition

```ts
SkillDefinition = {
  id,
  name,
  power,
  rule,
  concept,
  explanation,
  codeVariants,
}
```

同じSkillのcode variantはTargetRule・POWER・学習概念を変えない。

### Targeting

表示コード自体を`eval()`しない。安全な内部`TargetRule`を評価する。

### Seeded generator

Battle ID + seedから敵HP・敵順・Skill順・code variantを決定的に再現する。

生成時にvalid target / learning constraint / solvabilityを検証する。

---

## 7. Battle Runtime

Battle中だけ必要な状態は`App.tsx`のlocal stateを中心に扱う。

例:

- phase
- playerHp
- enemies
- selectedSkillId
- logs
- turn
- animation state

これらをPlayerProgressやLocalStorageへ保存しない。

Battle勝利時だけProgressionへrewardを渡す。

---

## 8. Progression

`src/progression/`はBattleをまたぐ長期進行を担当する。

```ts
PlayerProgress = {
  exp,
  clearedStageIds,
  clearedAreaIds,
  unlockedStageIds,
  unlockedSkillIds,
}
```

Level / maxHP / POWER倍率はEXPから導出し、二重保存しない。

```text
Battle Victory
↓
applyBattleVictory()
↓
EXP / CLEAR / unlock
↓
ProgressProvider
↓
LocalStorage
```

Stage IDは現在globalなnumberとして扱う。次Area追加時に既存IDを再採番しない。

---

## 9. Persistence

LocalStorageはversion付きschemaを使う。

保存対象:

- EXP
- Stage CLEAR / unlock
- Area CLEAR
- Skill unlock

保存しない:

- Battle中HP
- turn
- selected Skill
- animation state
- BGMの再生位置

壊れたJSONや未知versionは安全に初期状態へfallbackする。

---

## 10. Field / Dialogue

Fieldのmovement / collision / interaction判定は純粋ロジックへ分離する。

DialogueはPlayerProgressの必要な一部だけを読み、Battle targetingやdamage計算を知らない。

```text
Field UI
├── movement
├── interaction
├── NPC dialogue
└── Battle Gate
       ↓
Battle route
```

次Areaでも同じ境界を維持し、JavaScript Fieldコンポーネントを巨大なArea分岐へ変えない。

---

## 11. Audio / Motion

AudioとMotionはpresentation layer。

### Audio

- `menu` / `field` / `battle` BGM
- SE channel
- BGM / SE別GainNode
- Mute / volume
- 最初のpointer / touch / key操作でAudioContextをunlock
- `useBgm()`で画面ごとのBGM lifecycleを管理

BGMやSEの有無でGame Domainの勝敗を変えない。

### Motion

- Skill windup
- hit flash / shake
- damage number
- defeat
- victory / defeat
- reward animation
- `prefers-reduced-motion`

Animation timerをTargetRuleやdamage式のsource of truthにしない。

---

## 12. World Mapと複数Area

World MapはArea metadataとPlayerProgressのArea CLEARだけを参照する。

```text
World Map
↓
AreaDefinition.availability
├── available → routes.fieldへ進入
└── comingSoon → disabled
```

World MapはBattle生成、Enemy stats、Skill targetingを知らない。

Areaを追加するときの基本手順:

1. Area metadataを追加
2. そのAreaのrouteをRouterへ追加
3. Battleを一意なStage IDで追加
4. `areaId` / Boss整合性testを通す
5. Field / Stage Select / Completeを必要な範囲で実装
6. Progression / save migrationが必要か判断する

---

## 13. Backend

現在は不要。

導入トリガー:

- Login
- Cloud Save
- 複数端末同期
- Ranking
- Shared Challenge
- 管理者機能

候補はCloudflare D1等やSupabaseを要件で比較する。FrontendがCloudflareだからという理由だけでbackendを固定しない。

---

## 14. 品質保証

PR作成前に必ず:

```text
npm ci
npm run lint
npm test
npm run build
```

PR後:

```text
GitHub Actions CI
Cloudflare Preview
Self Review
Squash Merge
main CI
Cloudflare Production
```

Unit Testの主対象:

- targeting
- seeded random
- generator / solvability
- SkillDefinition / code variants
- progression / persistence
- Field movement / interaction
- Dialogue条件
- Area metadata / Area-Battle整合性
- Audio settings / BGM lifecycle helper

---

## 15. 設計原則

1. 表示コードを`eval()`しない
2. Player成長でコード読解を不要にしない
3. Enemyをcurrent Levelへ自動追従させない
4. Battle transient stateをsaveへ混ぜない
5. World / Field / Dialogue / AudioをBattle Domainへ混ぜない
6. COMING SOONの機能を架空実装しない
7. 既存route / save互換を壊す変更は明示的migrationなしに行わない
8. コンテンツ追加時もUnit Test可能なdata-driven構造を優先する
