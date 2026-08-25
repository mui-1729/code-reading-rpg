# CODE//READ RPG テスト方針

## 1. この文書の役割

この文書は、現在どこまでを手動確認・CIで保証し、今後どの段階でunit / component / E2E testを追加するかを定義する。

目的はテスト数を増やすことではなく、**ゲームの学習ロジックと主要ユーザーフローを壊しにくくすること**。

---

## 2. 現在の確認方法

現時点では自動テストフレームワークは未導入。

現在の最低確認は以下。

### CI

GitHub Actionsで、

```bash
npm install
npm run build
```

を実行する。

これにより、

- TypeScript build
- Vite build
- import / syntax error

などを最低限検知する。

### Vercel Preview

PR / branch pushごとにPreview Deploymentを確認する。

主に、

- build成功
- 対象routeが開く
- UIが壊れていない
- 主要操作ができる

ことを見る。

### 自己レビュー

PRの実差分を読み、ゲームロジック・UI・学習意図への影響を確認する。

### Production smoke test

`main` merge後、Vercel Productionがsuccessになったことを確認し、必要に応じて今回触った機能を本番で軽く操作する。

---

## 3. テストの層

将来は次の3層で考える。

```text
Unit Test
↓
Component Test
↓
E2E Test
```

すべてを同時に導入しない。

壊れやすく、純粋に検証できる部分から追加する。

---

## 4. Unit Test

最初に導入する自動テスト。

候補はVitest。

主な対象:

- targeting logic
- Battle生成
- seed再現性
- solvability
- persistence migration

UIを立ち上げなくても検証できる純粋ロジックを中心にする。

---

## 5. 最初にVitestで保証するもの

### `getTargets()`

最低限、以下をテストする。

- `firstBelow` が最初の一致1体を返す
- `allBelow` が一致全員を返す
- `firstAbove` が最初の一致1体を返す
- `allAbove` が一致全員を返す
- `named` が名前一致の最初の1体を返す
- `lowestHp` が最小HPの1体を返す
- HP 0以下の敵を対象にしない
- 対象なしで空配列になる
- 同HP時の順序が意図どおり

### Battle定義

- Battle IDが重複しない
- skill IDが存在する
- unlock skill IDが存在する
- 後続Battleで解放済みSkillが保持される

これにより、過去に起きた「Battle 3で技が減る」ような回帰を検知できるようにする。

---

## 6. 問題生成を導入した後のUnit Test

制約付き生成を追加したら、固定ケースだけでなく複数seedでproperty的に検証する。

最低限見るもの:

- 同じseedで同じ盤面になる
- 想定敵数になる
- HPが許容範囲内
- 学習対象となる条件一致数が制約内
- 表示コードの閾値とruleの値が一致
- 不正なSkill IDを生成しない
- 必要な場合、対象が少なくとも1つ存在する

---

## 7. Solvability Test

可変Battleでは重要度が高い。

生成盤面に対して、少なくとも勝ち筋が存在することを自動検証する。

将来のイメージ:

```text
Generated Battle
↓
可能なSkill選択を探索
↓
勝利状態へ到達可能か確認
```

目的は「常に最適解が1つ」を保証することではない。

保証したいのは、

- 理不尽な詰み盤面を生成しない
- 学習用Battleとして成立する

こと。

探索コストが高くなった場合は、Battleごとに探索深さや制約を決める。

---

## 8. Component Test

React Testing Libraryは、UI上の状態遷移が増えてから導入する。

導入目安:

- Battle UIの変更頻度が上がる
- LocalStorage連携が入る
- Stage Selectが入る
- UI操作の回帰を手動確認し続けるのが重くなる

主な対象:

- 1回目のカード押下で選択される
- 同じカード2回目で発動する
- 別カード押下で選択が切り替わる
- `isResolving` 中は追加入力できない
- Skill発動後にHP表示が更新される
- 敵全滅でvictoryになる
- player HP 0でdefeatになる
- unlock画面が表示される
- 解説modalが開閉する

---

## 9. Timerを使うUIのテスト

現在Battle処理には`setTimeout`を使った演出・敵ターン待機がある。

Component Testを導入する場合は、実時間待機を避ける。

候補:

- fake timers
- timerを進めて状態遷移を確認

テストが420msなどの実時間に依存しないようにする。

---

## 10. E2E Test

Playwrightは、画面をまたぐ主要フローが増えた段階で導入する。

導入目安:

- Stage Selectがある
- LocalStorage保存がある
- Chapter進行がある
- route数が増える
- component testだけでは全体フローの回帰を検知しづらい

主な対象:

```text
Title
↓
Battle
↓
Victory
↓
Skill Unlock
↓
Next Battle
↓
Chapter Complete
```

将来は、

```text
Stage Select
↓
Battle
↓
Clear
↓
Reload
↓
Clear状態が保持
```

なども対象にする。

---

## 11. E2Eでやりすぎない

細かいtargeting ruleを全部E2Eで確認しない。

例:

- `find()` の境界値 → Unit
- 2回押し発動 → Component
- Stage SelectからBattle完了まで → E2E

各層で役割を分ける。

---

## 12. Visual / UI確認

現時点では専用visual regression toolは導入しない。

UI変更時はPreviewで最低限次を見る。

- Desktop
- Mobile幅
- HP / NEXTが隠れない
- Skill codeが読める
- 5枚以上のSkillが崩れない
- modalが画面外へ出ない
- focusが見える

UI規模がさらに大きくなった場合のみvisual regressionを検討する。

---

## 13. Accessibility確認

UI変更時は以下を確認する。

- buttonとして操作できるものがbuttonになっている
- keyboard focusが確認できる
- aria-labelが必要な場所にある
- 装飾画像・spriteに不要な読み上げをさせない
- 色だけで重要状態を伝えない
- reduced motion設定を壊さない

Component / E2E導入後に、自動チェック可能な範囲を増やす。

---

## 14. Content Test

Battle追加時は、プログラムが動くだけでなくコンテンツとして検証する。

確認項目:

- 表示コードが正しいJavaScriptか
- ruleと意味が一致するか
- 学習テーマが明確か
- 想定勝ち筋があるか
- 未習構文を混ぜていないか
- POWERだけで選択が決まらないか
- NEXTを見る意味があるか

詳細は [`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md) を参照する。

---

## 15. Regression Testの考え方

バグを修正したら、同種のバグを自動テストで防げるか検討する。

例:

### Battle 3で技が減った

→ BattleごとのSkill累積をunit testする。

### GolemがHP表示を隠した

→ 現時点ではPreviewでvisual確認。将来component / visual testの必要性を検討。

「修正したから終わり」ではなく、再発防止できるロジックバグはテストへ残す。

---

## 16. CIの段階的な拡張

### 現在

```bash
npm install
npm run build
```

### package-lock導入後

```bash
npm ci
npm run build
```

### Vitest導入後

```bash
npm ci
npm test
npm run build
```

### lint導入後

```bash
npm ci
npm run lint
npm test
npm run build
```

Component / E2Eは実行時間を見ながらCI構成を分けてもよい。

---

## 17. PRで最低限確認すること

ロジック変更:

- [ ] 必要なunit testがある
- [ ] 既存testが成功
- [ ] build成功

UI変更:

- [ ] Previewで対象画面を確認
- [ ] Desktop / Mobileを確認
- [ ] 既存操作を壊していない

Battle追加:

- [ ] codeとruleが一致
- [ ] 勝ち筋確認
- [ ] 学習テーマ確認
- [ ] 必要なcontent / unit test追加

すべてのPR:

- [ ] 自己レビュー
- [ ] CI success
- [ ] Vercel Preview success
- [ ] merge後Production success

---

## 18. Production smoke test

Production smoke testは自動テストの代わりではない。

役割は、

- merge後の本番deployが正しい
- routeが開く
- 今回変更した主要機能が最低限動く

ことの最終確認。

毎回全Battleを手動で完全攻略する必要はない。

変更範囲に応じて確認量を変える。

---

## 19. テスト追加の優先順位

当面は次の順。

1. package-lockを追加しCIを`npm ci`へ
2. Vitest導入
3. targeting test
4. Battle定義の整合性test
5. generator導入時にseed / constraint test
6. solvability test
7. UI状態遷移が増えたらReact Testing Library
8. 画面横断フローが増えたらPlaywright

テストツールを先に揃えるのではなく、守るべき挙動が増えた段階で追加する。
