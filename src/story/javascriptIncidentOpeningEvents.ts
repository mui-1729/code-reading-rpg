import type { BattleStoryEvent } from './types'

const preBattleEvents: Record<number, BattleStoryEvent> = {
  1: {
    id: 'js-before-first-incident-field-observation',
    label: 'LIVE INCIDENT',
    title: 'まず、異常そのものを見る',
    lines: [
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'これがOpeningで見たtarget異常だ。訓練用じゃない、今動いているBattle stateそのものだよ。',
      },
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'まだ全部読めなくていい。EnemyのHPや名前と、Skillに表示されたcodeを見比べながら「codeは実際に誰を選ぶのか」を一度体験しよう。',
      },
      {
        speakerId: 'lead-ada',
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: '今は原因を当てるより症状の再現が先だ。分からない記号や処理があれば、それも持ち帰る情報になる。',
      },
    ],
  },
}

const postBattleEvents: Record<number, BattleStoryEvent> = {
  1: {
    id: 'js-after-first-incident-needs-basics',
    label: 'INCIDENT REPRODUCED',
    title: '異常は見えた。次は読める材料を増やす',
    lines: [
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '症状は再現できた。偶然外れたんじゃなく、表示されたcodeのruleでtargetが決まっていることも確認できた。',
      },
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'ただ、HPの比較、nameの条件、enemiesを前から見るfind()が一度に出てきた。原因を追うには、ここを自分で確定できるようにしたい。',
      },
      {
        speakerId: 'lead-ada',
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: '近くのVillageにMIOがいる。全部を勉強する必要はない。このincidentのselectorを読むのに必要な部分だけ確認して、同じtraceを西へ追え。',
      },
    ],
  },
  9: {
    id: 'js-training-complete-return-to-trace',
    label: 'TRACE READY',
    title: 'さっき見た異常を、今度は読んで追える',
    lines: [
      {
        speakerId: 'trainer-mio',
        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: 'HPやnameの値、比較、find()の「前から最初の一体」まで追えたね。最初のBattleで読みにくかった部分は、もう一行ずつ分けて確かめられるはず。',
      },
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '草原で再現したtraceは西のForestへ続いている。もう同じ場所へ戻って同じBattleをやり直す必要はない。そのcodeがどこから来たのか追いに行こう。',
      },
    ],
  },
}

export function getJavaScriptIncidentOpeningEvent(
  battleId: number,
  phase: 'pre' | 'post',
): BattleStoryEvent | undefined {
  return phase === 'pre' ? preBattleEvents[battleId] : postBattleEvents[battleId]
}
