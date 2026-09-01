# WORLD GAME FEEL

Issue #265 Priority A のうち、CODE WORLD探索の移動・scene transition・field BGMに関するpresentation contractを定義する。

## North Star

CODE WORLDは「教材の画面をキャラクターが移動する」のではなく、fantasy RPGの世界を歩き、その世界のruleとしてcodeを読む体験を優先する。

ただし、game feelのためにWorld domain authorityを曖昧にしない。

- collision / portal / encounter / save座標はWorld domainがauthority
- facing / walk frame / interpolation / area title / BGMはpresentation authority
- animation完了を待ってsaveしない
- map teleportを1 tile walkとして補間しない
- reduced-motionでも方向・scene identityなど意味情報は維持する

## Walking presentation

Player / followerはWorld座標そのものではなく、座標変更を観測してpresentation stateを導出する。

- facing: up / down / left / right
- adjacent 1 tile movementだけをwalkingとして扱う
- 1 tileは約150msで補間
- step frameは2状態を交互に使う
- left / rightはside spriteをmirror
- upはback-facing sprite
- map変更や長距離teleportはwalking animationを開始しない

save上の`worldPosition`は入力時点で確定する。見た目の補間中にreloadしても、保存位置が旧tileへ戻ることはない。

## Scene identity

探索mapは`worldPresentation.ts`を唯一のpresentation registryとして扱う。

| Map | Scene | Field BGM |
| --- | --- | --- |
| Overworld | JAVASCRIPT GRASSLAND | `field` |
| Village | GREENFIELD VILLAGE | `fieldVillage` |
| Forest | JAVASCRIPT FOREST | `fieldForest` |
| Deep Forest | JAVASCRIPT DEEP FOREST | `fieldDeepForest` |
| TypeScript | TYPESCRIPT FRONTIER | `fieldTypeScript` |

`WorldViewport`はscene id / BGM trackをdata attributeとして公開し、scene変更eventを発行する。既存pageが`useBgm('field')`を使っていても、hook側が現在sceneのfield trackへ追従する。

## Area transition

mapへ入ったときは短いAREA titleをWorld viewport上へ出す。

- gameplay stateは既に新mapへ切り替わっている
- overlayはpointer eventを奪わない
- transitionはpresentationだけで、portal処理を遅延しない
- reduced-motionではwipeを止め、静的なAREA titleだけ短時間表示する

## Battle entry

Battle画面のmount時に短いRPG entry wipeを表示する。

- field: `ENCOUNTER`
- incident: `INCIDENT`
- training: `TRAINING`
- boss: `BOSS APPROACH`

Battle transactionのSTART snapshotやroute遷移はanimation待ちにしない。overlayはpointer eventを持たず、battle semanticsに影響しない。

## BGM phrase length

field / battleのregion identityがあっても、8音程度の極端に短いloopではsceneの空気が均一になるため、主要patternは16 note phraseを基準にする。

Villageは明るく安定、Forestは少し陰る、Deep Forestは低域中心、TypeScriptは幾何学的な跳躍を持たせる。Battle / Bossも同様に16 note以上を維持し、JS FinalとTS Finalは異なるpattern / oscillator identityを保つ。

## Validation

最低限以下を固定する。

- facing / step frame / interpolation
- teleportがwalk扱いされないこと
- reduced-motionでinterpolationが無効になること
- mapごとにscene id / field BGMが変わること
- AREA transitionがmap identityを表示すること
- Battle entryがarena identityを持つこと
- field / battle BGMが短い8音loopへ退行しないこと
- Desktop / Mobile / WebKitを含む既存full E2Eを壊さないこと
