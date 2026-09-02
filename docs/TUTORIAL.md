# CODE//READ RPG Tutorial

## 目的

初回Playerが**現在のOpen World UIとBattle UIを実際に操作しながら**最低限の操作を理解できるようにする。

Tutorialは構文学習そのものを担当しない。JavaScript / TypeScriptの概念はコード図鑑 / コード解説 / コードデータへ任せる。

## 原則

- 初回だけ自動表示
- overlayで操作を止めない
- 「次へ」を読むだけのTutorialにしない
- 実操作成功を完了条件にする
- target / 正解Skillを教えない
- Tutorial stateをPlayerProgress / RpgState / Battle Domainへ混ぜない
- Desktop / Mobileの既存操作を使う
- スキップ後は自動再表示しない
- メニュー > 設定 > チュートリアルをやり直す からいつでも再開できる
- 進行リセットでTutorialも初期状態へ戻す

## Flow

```text
Open World
↓
移動
↓ World実座標が変化
アクション
↓ interaction object隣接時に操作
Battle
↓
選択
↓ Skill cardを1回押す
実行
↓ selected Skillをもう1回押す
完了
```

Battle URLへdirect entryした場合はWorld stepを飛ばしてBattle Tutorialへ進める。

## 移動

Desktop:

```text
移動
WASD / Arrowで歩いてみよう
```

Mobile:

```text
移動
D-Padで歩いてみよう
```

camera追従でPlayerがviewport中央に見え続けても、Tutorialはvisible tile indexではなく`data-world-x / data-world-y`の**実World座標変化**を観測する。

blocked terrainへ入力し座標が変わらなければ完了しない。

## アクション

現在のWorldでinteraction対象になりうるもの:

- BYTE NPC
- Hubのショップ
- JavaScript Boss
- TypeScript Boss

隣接した状態でのみcontextual actionを表示する。

World characterはtileの子要素ではなく専用overlay layerにいるため、隣接判定はPlayerと各World tileの`data-world-x / data-world-y`を比較して行う。

Desktop:

```text
アクション
Enter / Spaceで調べる
```

Mobile:

```text
アクション
画面のcontextual actionを押して調べる
```

特定objectを「正解」として強調しない。

## Battle Tutorial

Tutorial側で`battle-select` / `battle-execute`を永続化しない。

BattleRuntimeのReact snapshotからselected Skillと実行状態を判定する。表示文言やCSS classは進行判定のsource of truthにしない。

```text
snapshot.selectedSkillId なし
→ 選択

snapshot.selectedSkillId あり
→ 実行
```

### 選択

```text
選択
コードを読んで、Skillを1枚選ぼう
```

正解SkillやEnemyはhighlightしない。

### 実行

```text
実行
選んだSkillをもう一度押して実行
```

最初のSkill実行開始でTutorial完了。target有無 / damage / victoryは条件にしない。

## コード解説

Battle Tutorial中に必要なら短く:

```text
困ったら右下の ? からコード解説
```

コード解説の使用は必須にしない。

## Replay

Tutorialをスキップ / 完了した後でも、Pauseメニューの設定から`チュートリアルをやり直す`を選べる。

- World / Battleのどちらで実行しても、Overworld開始地点へ移動し`field-move`から再開する
- Battleで実行: 未完sessionのHP / Item等を開始snapshotへrollbackしてから、World位置とEncounter歩数を再設定する
- PlayerProgress / Equipment / Party等の確定済み進行は維持する。Battleの仮回復・仮消費だけはABORT policyに従って両方戻す

## Persistence

PlayerProgress / RpgStateとは別key。

```text
code-reading-rpg:tutorial
```

schema v1:

```ts
type TutorialStatus = 'active' | 'completed' | 'skipped'
type TutorialPhase = 'field-move' | 'field-interact' | 'battle'
```

`field-*`という内部phase名は旧実装由来。current UIは`/world`を対象にする。schema migrationの必要が生じるまで名前だけを理由に変更しない。

invalid JSON / unknown version / unknown status / phaseはinitialへfallbackする。

## Architecture

```text
src/tutorial/
├── tutorial.ts
├── storage.ts
├── TutorialContext.ts
├── TutorialProvider.tsx
├── TutorialPrompt.tsx
├── useTutorial.ts
└── *.test.ts
```

TutorialPromptはWorldの実座標DOMを観測する。Battleでは`BattleRuntimeProvider`のselected Skill / phase / resolving / modal状態を購読し、DOM参照はhighlight配置だけに使う。route判定はArea registryから導出し、Tutorial専用分岐をBattleのtarget / damage domainへ入れない。

RESETはProgressionの共通reset eventを受けてTutorialProvider自身が行う。

## Accessibility / Motion

- `aria-live="polite"`
- keyboard操作を塞がない
- Mobile D-Pad / contextual action / Skill cardを覆わない
- highlightはoutlineも使う
- reduced motionではpulseを停止する

## Test

Unit:

- phase transition
- direct Battle entry
- skip / completed後の停止
- serialize / restore
- broken storage fallback

Manual / E2E:

- `/world` Desktop移動
- `/world` Mobile移動
- BYTE / SHOP / Boss隣接action
- camera端での移動
- Battle選択 / 実行
- Skill選び直し
- direct Battle entry
- スキップ
- 設定からTutorial replay
- reset後の再表示
- reduced motion
