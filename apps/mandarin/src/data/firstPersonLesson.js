// 原文只存位置與雜湊；由既有 classroomKey 在學生端解密後取句。
// 新課沿用此資料形狀，不需複製頁面或場景引擎。
export const FIRST_PERSON_LESSON = {
  lessonId: '115AG3H04', version: 2,
  title: '食堂裡的閱讀線索',
  source: {
    text: '翰林115三上官方課文Word，第4課〈水滾了〉，王宗仁',
    questions: '官方15閱讀理解提問：第1、3、4、6、7題',
    strategy: '郭富華老師文本分析提問單（教用）：事件背景、經過與解決、結果與啟示',
    checked: '2026-10-22',
  },
  scenes: [
    {
      id: 'welcome', title: '食堂的早晨', place: '門口 → 工作角',
      goal: '找風鈴和木柴，讀讀師徒怎麼分工。',
      view: 'entrance', alternateView: 'work', viewLabel: '看工作角',
      experience: { mood: '日常', caption: '食堂裡，師徒各自忙著自己的工作。', action: '環顧食堂', reflection: '先認識這個平常的早晨。' },
      clues: [
        { id: 'bell', label: '門前風鈴', object: 'bell', note: '先認識故事發生的地方。', refs: [{ para: 1, sentences: [2, 3, 4, 5], sha: ['6233f9bb', '47a06f75', 'fd92befa', 'f9fb8a47'] }] },
        { id: 'wood', label: '工作角木柴', object: 'wood', note: '木柴讓我們回到師徒分工的文字。', questionEvidence: true },
      ],
      question: {
        id: 'division', kind: '找出訊息', basis: ['reading_question:04:01'],
        stem: '按照課文，師徒原本怎麼分工？',
        options: ['師傅撿柴，康康燒水做菜', '師傅燒水做菜，康康撿柴', '師傅做菜撿柴，康康燒水'], answer: 1,
        why: ['再讀年長的師傅與年輕的徒弟各負責哪件事。', '你找到了兩人的工作，沒有把分工交換。', '康康原本只負責一種工作，再找找「只負責」後面的詞。'],
        hints: ['先找介紹兩位人物工作的那一句。', '把「師傅」和「徒弟康康」分開看，各找一個動作。', '重看標記的分工句，逐項核對選項中的人物與動作。'],
        explanation: '第1段清楚交代兩人的工作；這也幫助我們理解後來康康為什麼要自己想辦法。',
      },
    },
    {
      id: 'ladle', title: '鍋旁的嘗試', place: '鍋邊 → 舀水處',
      goal: '觀察鍋子和長柄勺，找出康康做了什麼。',
      view: 'pot', alternateView: 'ladle', viewLabel: '看長柄勺',
      experience: { mood: '慌張', caption: '水不停冒泡，師傅還在接待客人……', action: '觀察康康舀水', reflection: '注意康康反覆舀水後，鍋裡有沒有改變。' },
      clues: [
        { id: 'pot', label: '冒泡的鍋子', object: 'pot', note: '讀讀康康看到的情況。', refs: [{ para: 2, sentences: [0, 1, 2, 3, 4, 5], sha: ['c667349f', '4e11e7ab', '50b80674', '04ccac9e', '5e3c1a28', '6979bde3'] }] },
        { id: 'ladle', label: '鍋旁長柄勺', object: 'ladle', note: '勺子的造型是示意，動作請以原文為準。', questionEvidence: true },
      ],
      question: {
        id: 'action', kind: '理解心情', basis: ['reading_question:04:02'],
        stem: '水不停沸騰，師傅又正在忙。從原文和動作看，康康當時怎麼了？',
        options: ['十分慌張，急著想讓水停下來', '覺得好奇，悠閒地看水冒泡泡', '覺得放心，等師傅自己來處理'], answer: 0,
        why: ['你把「十分慌張」和跑到鍋邊、反覆舀水的動作連起來了。', '原文說他跑到鍋旁，又反覆舀水；這不像悠閒觀察。', '康康沒有站著等，他已經急著自己想辦法了。'],
        hints: ['找第2段直接描寫心情的詞。', '把「師傅在接待客人」和康康接下來的動作連起來看。', '比較「跑到鍋旁、舀了好多次」與三個選項中的心情是否一致。'],
        explanation: '原文明說康康「十分慌張」。他把水舀起來再倒回去，急著處理眼前的情況；水仍在沸騰。',
        extraEvidence: [{ para: 2, sentences: [4, 5], sha: ['5e3c1a28', '6979bde3'] }],
      },
    },
    {
      id: 'cause', title: '往鍋底找原因', place: '水面 → 爐口',
      goal: '比較水面和鍋下的柴火，找出舀水無效的原因。',
      view: 'pot', alternateView: 'fire', viewLabel: '看爐口柴火',
      experience: { mood: '找原因', caption: '舀了好多次，水還是在滾。原因在哪裡？', action: '觀察舀水後的結果', reflection: '試著把視線從水面移到鍋子底下。' },
      clues: [
        { id: 'water', label: '仍在沸騰的水', object: 'pot', note: '這是康康多次舀水後的結果。', refs: [{ para: 2, sentences: [10, 11], sha: ['0f2390f2', '28206697'] }] },
        { id: 'fire', label: '鍋下柴火', object: 'fire', note: '把結果和鍋子下面的情況連起來想。', refs: [
          { para: 2, sentences: [10, 11], sha: ['0f2390f2', '28206697'] },
          // 保留完整引語上下文，避免只顯示第7短句開頭的下引號。
          { para: 3, sentences: [3, 4, 5, 6, 7, 8], sha: ['f3c2eb87', '6620976f', '3869c3b1', '8c66f4e0', '6bfb1d3a', 'aba0dc99'] },
        ] },
      ],
      question: {
        id: 'cause', kind: '推論原因', basis: ['reading_question:04:03'],
        stem: '舀了好多次，水為什麼還在沸騰？',
        options: ['因為木柴背回來的數量太少', '因為師傅在門口接待著客人', '因為鍋底的柴火還繼續燃燒'], answer: 2,
        why: ['課文沒有把原因歸在背回的木柴數量；再看當時鍋下的情況。', '師傅接待客人是當時的情況；什麼在持續讓鍋子受熱呢？', '你把水面的結果和鍋底持續燃燒的柴火連起來了。'],
        hints: ['除了水面，再往鍋子下面找。', '想一想：舀水後，有沒有改變讓水受熱的東西？', '合讀第2段的結果與第3段鍋下的描述，找出仍在作用的原因。'],
        explanation: '第2段說水仍沸騰，第3段說鍋下的木柴燒得火紅。舀水沒有改變持續加熱的原因。',
      },
    },
    {
      id: 'root', title: '找出解決的關鍵', place: '工具旁 → 閱讀筆記',
      goal: '看師傅的方法，再用一句話整理這次學到的道理。',
      view: 'tool', alternateView: 'notes', viewLabel: '看閱讀筆記',
      experience: { mood: '用心理解', caption: '師傅不慌不忙地抽出一些柴火。火漸漸小了。', action: '觀察師傅的方法', reflection: '康康用心記住了什麼？把前後兩種方法放在一起想。' },
      clues: [
        { id: 'tool', label: '抽柴的工具', object: 'tool', note: '原文只說「工具」；畫面外形為示意。留意「一些」與「漸漸」。', questionEvidence: true },
        { id: 'notes', label: '閱讀筆記', object: 'notes', note: '筆記是導讀工具，並非課文中的物件。', refs: [{ para: 4, sentences: [1, 2, 3, 4, 5], sha: ['a3d24398', '16d6282e', 'c9418dd2', 'cbf41dca', 'c72efd44'] }] },
      ],
      question: {
        id: 'meaning', kind: '比較與統整', basis: ['reading_question:04:04'],
        stem: '比較兩人的方法，這篇課文最想提醒我們什麼？',
        options: ['多次重複同個動作，就能解決問題', '先找產生問題的根本，再處理問題', '先處理眼前看到的現象，就能解決'], answer: 1,
        why: ['康康重複舀水仍無效，想一想師傅改變了哪個原因。', '你結合了師傅的方法和最後的提醒，整理出課文的道理。', '康康已經試過處理水面，最後一段提醒還要往哪裡找呢？'],
        hints: ['先比較：康康改變水面，師傅改變什麼？', '找出師傅抽出一些柴火後，火與水各有什麼變化。', '重讀第4段師傅的提醒，選出能同時解釋方法和結果的一句話。'],
        explanation: '師傅用工具抽出一些柴火，火漸漸變小，水不再沸騰；最後一段把這個方法連到「找到問題的根本」。',
      },
    },
  ],
};

export function getFirstPersonLesson(lessonId) {
  return lessonId === FIRST_PERSON_LESSON.lessonId ? FIRST_PERSON_LESSON : null;
}

export function clueRefs(clue, scene, lesson) {
  if (!clue.questionEvidence) return clue.refs;
  return [...(scene.question.extraEvidence || []), ...scene.question.basis.flatMap((id) => lesson.reading_questions.find((q) => q.id === id)?.evidence || [])];
}
