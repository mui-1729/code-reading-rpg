import type { BattleStoryEvent } from './types'

type StoryPhase = 'pre' | 'post'

const javascriptCharacterEvents: Readonly<Record<string, BattleStoryEvent>> = {
  '9:post': {
    id: 'js-training-complete-character',
    label: 'FIELD CHECK READY',
    title: 'MIOから森へ送り出される',
    lines: [
      {
        speakerId: 'trainer-mio',
        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: '必要な読み方は揃ったね。もうTRAINへ戻らなくていい。ここからは森で、自分の読み方を使う番だよ。',
      },
      {
        speakerId: 'trainer-mio',
        speaker: 'TRAINER MIO',
        role: 'VILLAGE GUIDE',
        layer: 'code-world',
        text: 'BYTE、先に答えを言わないこと。昔みたいに一人で走って木にぶつからない。',
      },
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'それ今言う？ ……でも分かった。次は僕が説明する前に、君がどこを見たか聞くよ。二人でForestへ行こう。',
      },
    ],
  },
  '10:pre': {
    id: 'js-forest-and-character',
    label: 'FOLLOW THE TRACE',
    title: 'Forestで自分の読み順を決める',
    lines: [
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '最初の症状から伸びたtraceが、ここで二つの条件に分かれてる。村で見た材料だけで追えそうだ。',
      },
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '僕なら左から見たくなる。でも今度は先に言わない。どこから読む？ 君が決めた順で、僕はtraceを見失わないようにする。',
      },
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '必要ならCODE HELPを開こう。ここで大事なのは記号を暗記することより、現在のstateを自分の順番で確かめることだ。',
      },
    ],
  },
  '12:post': {
    id: 'js-forest-combined-character',
    label: 'TRACE CONVERGED',
    title: 'BYTEが一歩後ろへ下がる',
    lines: [
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '長い条件でも、自分で小さく分けて最後まで追えたね。僕が順番を決めなくても大丈夫だった。',
      },
      {
        speakerId: 'lead-ada',
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: 'こちらでもtraceの合流を確認した。BYTE、答えを急がずに待てたな。',
      },
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '……そこ褒められるんだ。守り人の向こうまで続いてる。次も先頭は君に任せるよ。',
      },
    ],
  },
  '3:pre': {
    id: 'js-before-final-character',
    label: 'ROOT CAUSE',
    title: 'Code Coreへ',
    lines: [
      {
        speakerId: 'lead-ada',
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: 'REAL WORLDのtraceもここで終端した。症状だけを塞いで終わらせたくない。今回は、ここまで君が確かめてきた経路を信じる。',
      },
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '僕は横でログを見てる。読めない場所が出たら一緒に止まる。でも、どこから読むかも最後に何を選ぶかも、もう僕が先に言う必要はない。',
      },
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '……任せた。行こう、Code Knight。',
      },
    ],
  },
  '3:post': {
    id: 'js-ending-character',
    label: 'SYSTEM RESTORED',
    title: '最初のincidentを、チームで終える',
    lines: [
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'Code Coreが安定した。最初は僕が全部説明しないとって思ってたけど、最後は隣で見てるだけでよかったね。',
      },
      {
        speakerId: 'system',
        speaker: 'SYSTEM',
        role: 'CONNECTOR',
        layer: 'return',
        text: 'CODE WORLDの状態をREAL WORLDへ同期。sessionを切り離して、エンジニアをRETURNする。',
      },
      {
        speakerId: 'lead-ada',
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'real-world',
        text: '戻ったな。現実側も正常だ。以前の私は目の前の症状を早く閉じることを優先して、別の場所へ問題を押し出した。今回は同じことをしなかった。',
      },
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'real-world',
        text: 'ADAが新人を選んだ理由、やっと分かったかも。止まって確かめる人がいると、僕も走り過ぎずに済む。',
      },
      {
        speakerId: 'lead-ada',
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'real-world',
        text: 'そういうことだ。二人とも初仕事はclose。次も、分からないまま進まないことだけは忘れないで。',
      },
    ],
  },
}

const typescriptCharacterEvents: Readonly<Record<string, BattleStoryEvent>> = {
  '6:pre': {
    id: 'ts-before-final-character',
    label: 'FRONTIER COMPILER',
    title: 'WARDENではなく、古い機構を止める',
    lines: [
      {
        speakerId: 'type-warden',
        speaker: 'TYPE WARDEN',
        role: 'FRONTIER WARDEN',
        layer: 'code-world',
        text: '東で暴れているFrontier Compilerは私ではない。この土地のShared Contractを解釈する古い機構だ。私は境界を支え、君たちの帰り道を守る。',
      },
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '最初に会ったころの僕なら、ここでtype predicateもgenericも全部説明してたと思う。',
      },
      {
        speakerId: 'type-warden',
        speaker: 'TYPE WARDEN',
        role: 'FRONTIER WARDEN',
        layer: 'code-world',
        text: '珍しく静かだな、BYTE。',
      },
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '必要ならCODE HELPがあるし、ここまで一緒に読んできたからね。僕はtraceを見る。判断は任せる。',
      },
    ],
  },
  '6:post': {
    id: 'ts-ending-character',
    label: 'CONTRACT RESTORED',
    title: 'Frontierに役目が戻る',
    lines: [
      {
        speakerId: 'type-warden',
        speaker: 'TYPE WARDEN',
        role: 'FRONTIER WARDEN',
        layer: 'code-world',
        text: 'Frontier Compilerは静まった。私はまた、君たちを止める壁ではなく、この境界を守る者へ戻れる。',
      },
      {
        speakerId: 'byte',
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'WARDENが敵じゃないって、これではっきりしたね。次に来るときは調査じゃなくて、この石の街をゆっくり歩きたいな。',
      },
      {
        speakerId: 'type-warden',
        speaker: 'TYPE WARDEN',
        role: 'FRONTIER WARDEN',
        layer: 'code-world',
        text: 'そのときは茶くらい出そう。騒がしくしなければな。',
      },
    ],
  },
}

export function getJavaScriptCharacterStoryEvent(
  battleId: number,
  phase: StoryPhase,
): BattleStoryEvent | undefined {
  return javascriptCharacterEvents[`${battleId}:${phase}`]
}

export function getTypeScriptCharacterStoryEvent(
  battleId: number,
  phase: StoryPhase,
): BattleStoryEvent | undefined {
  return typescriptCharacterEvents[`${battleId}:${phase}`]
}
