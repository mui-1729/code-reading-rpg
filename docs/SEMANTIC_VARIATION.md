# Semantic Skill Variation

Battleで表示するcodeは、単なる文字列の言い換えではなく、学習済み範囲の中でTargetRule自体が変わる場合があります。

## Invariants

- 同じSkill名だけからtargetを決められないようにする。
- 表示codeとruntime TargetRuleは常に同じ意味を持つ。
- semantic variantはBattleごとの`allowedSyntax`を満たすものだけを候補にする。
- 現在のlessonで導入していない表現をpresentation transformで追加しない。
- CODE HELP / concept / explanationは選択されたsemantic variantに追従する。
- semantic variantを含む実際のSkillCard構成で初期targetとbattle solvabilityを検証する。

## Battle learning policy

`src/game/battleLearningPolicy.ts`がBattleごとの許可構文とpresentation transformを管理します。

現在の自動presentation variationは、意味を変えず新しい構文知識も要求しない次の2つだけです。

- comparison全体へ括弧を付ける
- 単純なarrow parameterへ括弧を付ける

従来の「比較operandの左右反転」と「dot propertyからbracket propertyへの変換」は、lesson順を越えて未学習表現を出し得るため自動生成しません。

## Semantic variants

`src/game/semanticSkillVariants.ts`に、base SkillDefinitionとは異なるTargetRuleを持つvariantを定義します。

各variantは少なくとも次を持ちます。

- `rule`
- `concept`
- `explanation`
- `codeVariants`
- `requiredSyntax`

必要なら`pedagogyTags`で、特定Battleでは必ずその教育要件を満たすvariantだけを選ばせます。

### PULSE

PULSEはseedによりGoblinまたはSlimeを探すsemantic variantを持ちます。Skill名だけでは対象名を確定できず、表示された`===`の右辺を読む必要があります。Slimeが存在しないBattleではSlime variantを候補から外します。

### UNION CUT

TypeScript Stage 5 / 6では`type-relevant`なsemantic variantだけを許可します。

`Limit`の候補が`60 | 100`であるだけでは現在値は決まりません。`const readLimit: () => 60 = getLimit`または`const readLimit: () => 100 = getLimit`という、代入時にTypeScriptが適合性を検査する戻り値型注釈まで読んで初めて現在のthresholdを確定できます。runtime expressionだけを追って型情報を無視すると、どちらのTargetRuleか判断できません。

## Solvability

`generateBattle()`はtemplateの固定Skillではなく、そのBattle IDとseedで実際に選択されたSkillCardを使って次を検証します。

1. 初手に有効targetがあること
2. templateで有効だった学習Skillが生成盤面でもtargetを持つこと
3. battle全体に勝ち筋があること

semantic variationを追加するときは、固定SkillDefinitionだけのsolvability testでは不十分です。
