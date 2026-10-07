// 頁尾連到的兩個說明頁：「教師操作指引」與「版權與資料來源」。
// 對象是大人（其他老師、家長、權利人），不是學生，所以不加朗讀鈕。
// 刻意不寫學校名稱與教室密碼（CF 指定）。
import { h } from '../utils/dom.js';
import { MODULE_REGISTRY } from '../activities/moduleRegistry.js';
import { SCAFFOLD_LEVELS } from '../utils/deviceSettings.js';

function section(title, children) {
  return h('section', { class: 'info-page__section' }, [h('h2', {}, title), ...children]);
}
const p = (text) => h('p', {}, text);
const list = (items) => h('ul', { class: 'info-page__list' }, items.map((x) => h('li', {}, x)));
const steps = (items) => h('ol', { class: 'info-page__list' }, items.map((x) => h('li', {}, x)));

function page(title, intro, sections) {
  return h('div', { class: 'container info-page' }, [
    h('nav', { class: 'breadcrumb', 'aria-label': '路徑' }, [h('a', { href: '#/' }, '首頁'), ' / ', title]),
    h('h1', {}, title),
    intro ? h('p', { class: 'info-page__intro' }, intro) : null,
    ...sections,
    h('p', {}, [h('a', { class: 'btn btn--secondary', href: '#/' }, '回首頁')]),
  ].filter(Boolean));
}

export function GuidePage() {
  const modules = MODULE_REGISTRY.filter((m) => m.implemented !== false);
  const levels = Object.values(SCAFFOLD_LEVELS);
  return page('教師操作指引', '給想在課堂或補救教學使用本站的老師。不需要帳號、不需要安裝，用瀏覽器開啟即可（建議 iPad 或筆電）。', [
    section('一、這個網站是什麼', [
      p('依翰林、康軒國語課本課次設計的練習網站，適合特殊教育資源班與補救教學。每一課有十多個「關卡」，從生字、語詞、句子到讀懂課文，學生自己操作、自己聽題目。'),
      p('設計重點：一個畫面只做一件事；所有題目都能點喇叭聽；答錯先給提示、第二次才公布答案；提示分三層，學生需要時自己按「看提示」。'),
    ]),
    section('二、學生怎麼用', [
      steps([
        '首頁選冊別（例如翰林三上）→ 選課次。',
        '課次頁上標「下一步」的關卡就是建議的下一站，依序完成「認識生字、學會語詞、練習句子、讀懂課文」等核心關卡。',
        '每題可以按喇叭聽題目和選項；卡住時按「看提示」，提示會一層一層變具體。',
        '做完核心關卡後，可以展開「加練挑戰」（字感訓練、一字多音、形似字……）與「單課小考」（小考沒有提示）。',
        '星星：自己答對最多星；用了提示或看了答案也能完成，但星星較少。',
      ]),
    ]),
    section('三、各關卡在練什麼', [
      list(modules.map((m) => `${m.label}：${m.description}`)),
    ]),
    section('四、老師設定（每台載具各自設定）', [
      p('點每一頁右上角的齒輪，答一題乘法進入（用來擋學生順手亂點，不是密碼）。可以設定：'),
      list([
        '支持程度：先填學生代碼，再為這個個案選「支持／標準／挑戰」，設定一次即可。下方會列出所有細項（選項數、每輪題數、自動念題目、造句預填、朗讀單位、範讀、閃現限時），平常跟著組別走，個案有需要時再單獨調整某一項。系統會依這位學生最近的獨立答對率建議升或降組。',
        '目前使用的學生代碼：共用平板換人時先改代碼（只能填英數，例如 S03；請勿填姓名，代碼對照表由老師自行保管）。',
        '載具標記：例如「三年級 1 號機」，匯出成績時用來分辨是哪一台。',
        '「本課先完成」按鈕：預設不顯示，開啟後學生可以中途離開關卡。',
        '作答紀錄：看每位代碼、每一課的獨立答對／看提示後答對／看答案的次數，可複製成表格或同步到 Google 試算表。',
      ]),
      h('div', { class: 'info-page__table-wrap' }, h('table', { class: 'teacher-table' }, [
        h('thead', {}, h('tr', {}, ['組別', '說明'].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, levels.map((l) => h('tr', {}, [h('td', {}, l.label), h('td', {}, l.note)]))),
      ])),
    ]),
    section('五、課文需要「教室密碼」', [
      p('為了保護出版社的課文版權，課文全文經過加密，必須輸入教室密碼才看得到。需要課文的功能有：課文點讀、朗讀挑戰、聽聽看，以及讀懂課文的第三層提示（直接帶出課文段落並畫重點）。'),
      list([
        '沒有輸入密碼時，其他關卡都能正常使用；需要課文的地方，請搭配課本對照教學。',
      ]),
    ]),
    section('六、作答紀錄與個資', [
      list([
        '本站沒有帳號，不收集學生姓名。作答紀錄只存在那一台載具的瀏覽器裡。',
        '清除瀏覽器資料、使用無痕視窗或換一台裝置，紀錄就會不見，請定期匯出或同步。',
        '學生代碼請用老師自訂的編號，不要使用學號或姓名。即使不含姓名，代碼仍能被老師或學校對回學生，作答紀錄應視為可連結到個人的教育紀錄，依學校規定保管與刪除。',
        '星星是給學生的鼓勵（用了提示也能完成）；教師頁的「獨立答對率」只是調整練習難度的參考。兩者都會受題目難度、讀題語音、選項數影響，不能直接當作 IEP 目標的進展證據，請搭配課堂觀察與作品判斷。',
        '升降級建議只算「目前這位學生代碼、目前這個程度」的作答；共用平板時請先換好代碼。',
        '若設定同步到 Google 試算表：部署時「誰可以存取」選「任何人」代表知道網址的人都能寫入，請勿公開網址，並由學校決定資料的存取人員與保存期限。',
      ]),
    ]),
    section('七、常見問題', [
      list([
        '沒有聲音：確認平板沒有靜音；iPad 請到「設定 → 輔助使用 → 朗讀內容 → 聲音」下載「中文（台灣）」語音。',
        '看不到新的內容：重新整理頁面一次。',
        '某個關卡顯示「教材審核中」：那一課的該項內容還沒經老師審核開放，請先做其他關卡。',
        '提示會不會直接給答案？不會。第一、二層只給方法和範圍，第三層才帶出課文或示範，答錯兩次才公布答案。',
      ]),
    ]),
  ]);
}

export function CreditsPage() {
  return page('版權與資料來源', '本站為特殊教育輔助教材，非出版社官方產品；不收費、不作商業用途，僅供教學使用。', [
    section('教材內容', [
      list([
        '課次、生字、語詞與課文依據翰林出版、康軒文教 115 學年度上學期國語課本與教師資源，著作權屬原出版社。',
        '例句、閱讀理解選擇題、段落大意等，由本站依官方教材重新改寫，供學生練習使用。',
        '課文全文不公開提供：網站上只有加密後的資料，須由老師輸入教室密碼才能於課堂中使用。',
      ]),
    ]),
    section('字音、字形與詞語', [
      list([
        '注音查核參考教育部《國語辭典簡編本》、《重編國語辭典修訂本》與教育部教育雲「教育百科」。本站未轉載辭典釋義原文。',
        '常用造詞參考「大腦與語言實驗室」生字表。',
        [
          '字形、部件與筆順動畫資料來自 Make Me a Hanzi（Shaunak Kishore）：字典資料採 LGPL-3.0，筆畫資料採 Arphic Public License（源自文鼎 Arphic PL 楷體字型）。字形為楷體，部分寫法可能與教育部標準字體略有不同。授權全文：',
          h('a', { href: 'data/_index/hanzi/LICENSES/COPYING.txt', target: '_blank', rel: 'noopener noreferrer' }, '說明'),
          '、',
          h('a', { href: 'data/_index/hanzi/LICENSES/LGPL-3.0.txt', target: '_blank', rel: 'noopener noreferrer' }, 'LGPL-3.0'),
          '、',
          h('a', { href: 'data/_index/hanzi/LICENSES/ARPHICPL.txt', target: '_blank', rel: 'noopener noreferrer' }, 'Arphic Public License'),
          '。',
        ],
      ]),
    ]),
    section('插圖與聲音', [
      list([
        '語詞、成語插圖與大項圖示為本站自製（含 AI 輔助繪製），僅供本站教學使用。',
        '朗讀使用裝置內建的語音合成，不錄音。念讀語詞、朗讀挑戰的語音辨識使用裝置內建服務（iPad 為 Apple、Chrome 為 Google，聲音會傳到該服務辨識）；本站不錄音、不保存聲音，只在這台載具記下辨識出的文字。',
      ]),
    ]),
    section('外部連結', [
      p('雄老師（筆順練習、部件拼字、HTML5 FUN）、教育部《異體字字典》《成語典》、教育雲「教育百科」、中華語文知識庫「漢字說故事」、Wordwall、YouTube 等資源皆以另開新視窗連結，不嵌入本站；內容著作權屬各原網站。'),
    ]),
    // CF 2026-10-06：感謝靈感來源（連結去掉追蹤參數）
    section('感謝靈感來源', [
      p('本站許多設計受到以下老師與社群的啟發，謹此致謝：'),
      h('ul', {}, [
        ['花蓮胡志翔老師', 'https://xiulin-mandarin-2026.web.app/'],
        ['雄老師', 'https://gsyan888.github.io/html5_fun/'],
        ['米克師', 'https://spedmix.pages.dev/'],
        ['特工365', 'https://www.facebook.com/share/1CFCnVnori/'],
        ['特教老師的好點子', 'https://www.facebook.com/share/1CSoxLQ7Yg/'],
        ['特殊教育多媒體教材交流社團', 'https://facebook.com/groups/1494494560599892/'],
        ['國語五上學習樂園', 'https://sped-teacher.github.io/Teaching-Materials/mandarin/'],
      ].map(([name, url]) => h('li', {}, [
        h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, name),
        h('span', { class: 'visually-hidden' }, '（另開新視窗）'),
      ]))),
    ]),
    section('隱私', [
      p('本站不需帳號、不收集姓名。作答紀錄只存在使用的載具上；學生代碼由老師自訂。老師若自行設定同步到 Google 試算表，資料會送到該老師自己的試算表。'),
    ]),
  ]);
}
