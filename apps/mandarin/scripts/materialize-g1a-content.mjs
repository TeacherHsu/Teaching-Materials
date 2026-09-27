/**
 * Materialize the reviewed 115 G1A extension content into the public lesson
 * JSON files.
 *
 * Publisher files stay in the private worksheet-batches tree.  This adapter
 * only writes derived summaries, questions, and normalized activity data to
 * public/data/115AG1H.  It also checks that the requested official source
 * folders still contain the expected lesson files before publishing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../../..');
const WORKSPACE_ROOT = path.resolve(REPO_ROOT, '..');
const PRIVATE_ROOT = path.join(WORKSPACE_ROOT, 'worksheet-batches', '115', '115G1A_國語 翰');
const OFFICIAL_ROOT = path.join(PRIVATE_ROOT, '01_本學年官方教材');
const DRAFT_ROOT = path.join(PRIVATE_ROOT, '04_內容資料與草案');
const PUBLIC_ROOT = path.join(REPO_ROOT, 'apps', 'mandarin', 'public', 'data', '115AG1H');
const PUBLIC_ASSET_ROOT = path.join(REPO_ROOT, 'apps', 'mandarin', 'public', 'assets', '115AG1H');

const SOURCE_LABEL = '115G1A／翰林一年上官方教材';
const source = (section, detail = '') => `${SOURCE_LABEL}（${section}${detail ? `；${detail}` : ''}）`;

const lessonText = {
  1: {
    title: '一起走',
    map: [
      ['起：用一二一和左右位置，帶出一起走的畫面。', '開端'],
      ['承：用重複節奏呈現大家同時行走。', '發展'],
      ['合：你和我一起向前走，表現合作前進。', '收束'],
    ],
    gist: '課文用一二一的節奏和左右位置，描寫你和我一起向前走。',
    questions: [
      ['仔細觀察課文插圖，圖中有幾個人？分別是誰？他們正在哪裡？', '課文插圖裡有七個人，分別是一個老師和六個小朋友，他們正在操場上。', '提取訊息'],
      ['根據這篇課文，走路的人分別是誰？', '「你」和「我」。因為你和我一起向前走。', '提取訊息'],
      ['根據課文，「你在左，我在右」，為什麼他們不分開走，一定要緊緊靠在一起前進？', '因為他們的腳被綁在一起了，如果不一起走，腳會被拉扯，就沒辦法前進。', '推論訊息'],
      ['課文最後說「你和我，一起向前走」。你認為要做到「一起向前走」，最重要的是什麼？', '最重要的是「默契」，因為腳步要一樣、動作要同步。', '詮釋整合'],
      ['你覺得「兩個人綁在一起走」和「一個人自己走」，哪一個走法比較有趣？為什麼？', '答案示例一：我覺得兩個人綁在一起比較有趣，雖然比較難，但是可以和好朋友一起合作，成功了會很開心！答案示例二：我覺得一個人自己走比較有趣，因為一個人可以自由自在的控制速度，想快就快，想慢就慢，不用等別人，也不怕兩個人絆倒。', '比較評估'],
      ['閱讀課文，你覺得「兩人三腳」這個遊戲，要獲得勝利的方法是什麼？', '需要兩個人互相合作，步伐要相同，一起向前走。', '詮釋整合'],
    ],
    patterns: [
      ['一起走', '描述共同進行某個動作或事情。', '一起＋動詞（做什麼事）', ['一起吃飯', '一起爬山', '一起唱歌']],
      ['向前走', '用「向」來描述某個動作往何處進行。', '向＋方向＋動詞（動作）', ['向上爬', '向右轉', '向後跳']],
      ['你和我一起向前走。', '用「和」可以把 A 和 B 連起來，再加上「一起」，可以表達共同做了什麼事。', null, ['姐姐和妹妹一起看書。', '小狗和小貓一起睡覺。', '小魚和青蛙一起游泳。']],
    ],
    polysemy: [
      ['和', '跟、與。', '妹妹和我一起畫畫。'],
      ['和', '溫順、安詳。', '微風吹來，天氣很和暖。'],
      ['和', '各數相加的總數。', '二加三的和是五。'],
    ],
  },
  2: {
    title: '大風吹',
    map: [
      ['起：反覆說大風吹，營造遊戲開始的節奏。', '開端'],
      ['承：大家一起玩大風吹，寫出共同遊戲的情景。', '發展'],
      ['合：不停跑、風不停吹，呈現遊戲的熱鬧與動感。', '收束'],
    ],
    gist: '課文寫大家一起玩大風吹，在不停跑和不停吹的節奏中感受遊戲的熱鬧。',
    questions: [
      ['仔細觀察課文插圖中，有幾個人？有幾張椅子？他們正在哪裡？', '課文插圖中總共有五個小朋友、四張椅子。他們正在教室裡。', '提取訊息'],
      ['這些小朋友正在教室裡做什麼？你是怎麼知道的？', '他們正在玩遊戲。從插畫及課文中可以看得出來。', '提取訊息'],
      ['圖片裡有四張椅子和五個小朋友，最後會剩下幾個小朋友沒有椅子坐？', '會剩下一個小朋友沒有椅子坐。', '推論訊息'],
      ['第23頁課文插圖中，畫家用什麼方式來表現風很大的樣子？', '畫家畫窗邊有一朵雲，正在用力的吹氣；他用力的把嘴巴嘟起來，而且窗簾也被風吹起來。', '提取訊息'],
      ['根據課文和插圖，「我們不停的跑」，插圖裡的小朋友看起來很緊張、跑得很快，他們是為了要做什麼事？', '為了要找椅子坐下來，或是為了搶位子。', '推論訊息'],
      ['你覺得為什麼這個遊戲要叫大風吹？', '這個遊戲就像大風吹過一樣，只要有人喊口令，大家就要趕快離開座位、換一個新位置，風一吹過，東西都可能會換位子，所以才叫大風吹。', '詮釋整合'],
      ['這一課玩「大風吹」和第一課玩「兩人三腳」，這兩種遊戲有什麼不同的地方？', '兩人三腳一定要兩個人一組，團結合作才能走得快；大風吹是很多小朋友一起玩，每個人都要自己跑，不用跟別人綁在一起。', '比較評估'],
    ],
    patterns: [
      ['大風吹', '描述誰做了什麼動作。', '名詞（人或物）＋動詞（做什麼動作）', ['小鳥叫', '白雲飄', '樹枝搖']],
      ['不停的跑', '用「不停的」來表示某個動作持續進行著。', '不停的＋動詞（做什麼動作）', ['不停的說', '不停的笑', '不停的揮手']],
      ['我們來玩大風吹。', '用「來」可以描述大家要做什麼事。', '名詞（人或物）＋來＋動詞（做什麼事）', ['姐姐來看書。', '爸爸來開門。', '小狗來喝水。']],
      ['我們不停的跑。', '用「不停的」來表示某個動作持續進行著。', '名詞（人或物）＋不停的＋動詞（做什麼事）', ['哥哥不停的拍球。', '姐姐不停的打嗝。', '毛毛蟲不停的吃樹葉。']],
    ],
    polysemy: [
      ['大', '與「小」相對。', '今天下了大雨。'],
      ['大', '最年長或排行第一。', '哥哥是家裡的大哥。'],
      ['大', '不平常、重要。', '今天有一件大事。'],
      ['大', '約略、差不多。', '走到車站大約要五分鐘。'],
    ],
  },
  3: {
    title: '火車過山洞',
    map: [
      ['起：同學輪流加入，一起玩火車遊戲。', '開端'],
      ['承：一個又一個做出小火車。', '發展'],
      ['承：一個又一個堆出大山洞。', '發展'],
      ['合：火車穿過山洞，大家開心一起玩。', '收束'],
    ],
    gist: '課文描寫同學一個接一個合作做出小火車和大山洞，開心玩遊戲。',
    questions: [
      ['仔細觀察課文插圖，小朋友們正在玩什麼？', '玩積木。', '提取訊息'],
      ['他們用積木堆出了什麼？', '小火車和山洞。', '提取訊息'],
      ['仔細觀察課文插圖中的男孩和女孩，和第二課裡畫的人物有什麼不同？為什麼畫家要這樣畫呢？', '這一課所畫的小朋友，頭、手都是正方形的，像是積木。因為這一課介紹「積木」遊戲，所以把課文裡的人物都畫成積木人。', '比較評估'],
      ['課文中的「來來來」，代表什麼意思？', '邀請別的小朋友一起來玩。', '推論訊息'],
      ['課文中的「你一個，我一個」，「一個」是指什麼東西？', '一個個積木。', '推論訊息'],
      ['課文中的「ㄨㄨㄨ」，是指什麼意思？', '是形容火車行進間所發出的聲音。', '推論訊息'],
      ['為什麼課文中要一直強調「一起玩」呢？', '因為玩遊戲就是要大家一起來玩，才會比較好玩。', '詮釋整合'],
      ['第壹單元「一起玩」，介紹了三種不同的遊戲。這一課「火車過山洞」和前面兩課有什麼不同和相同的地方？', '不同的地方：這一課是比較安靜、需要想像力的遊戲；前面兩課都是需要跑步或活動的遊戲。相同的地方：這些遊戲都很好玩、有趣，而且是希望大家一起玩。', '比較評估'],
    ],
    patterns: [
      ['一個又一個', '用重複的「一」和「又」來表達數量眾多的意思。', '一＋量詞＋又＋一＋量詞', ['一件又一件', '一片又一片', '一包又一包']],
      ['做出小火車', '描述做什麼動作後出現什麼事物。', '動詞（什麼動作）＋出＋名詞（什麼事物）', ['寫出國字', '畫出大老虎', '摺出紙飛機']],
      ['開開心心', '形容動作的狀態。', '疊字副詞（怎麼樣）', ['快快樂樂', '安安靜靜', '平平安安']],
      ['我們開開心心一起玩。', '用疊字副詞來形容做某件事時的狀態。', '名詞（人或物）＋疊字副詞（怎麼樣）＋動詞（做什麼）', ['姐姐安安靜靜看書。', '哥哥快快樂樂上學去。', '小狗平平安安過馬路。']],
    ],
    polysemy: [
      ['個', '用來計算人或物的量詞。', '我有一個蘋果。'],
      ['個', '指人或物的外型、大小。', '弟弟的個子長高了。'],
      ['個', '指自己或個人。', '我個人喜歡紅色。'],
    ],
  },
  4: {
    title: '請問',
    map: [
      ['起：先向小草提問，問天有多大、山有多高、星星有多少。', '開端'],
      ['承：問題由天空、山、星星逐步擴展，表現好奇探索。', '發展'],
      ['轉：太陽出來，帶出小水珠的變化。', '轉折'],
      ['合：追問小水珠去了哪裡，留下觀察自然的問題。', '收束'],
    ],
    gist: '課文連續向小草提問天空、山、星星和水珠，表現孩子對自然的好奇。',
    questions: [
      ['觀察課文插圖，問問題的人是誰？', '右邊的小女孩，左邊的小男孩。', '提取訊息'],
      ['小男孩和小女孩向誰問問題？', '小草。', '提取訊息'],
      ['小女孩問了幾個問題？', '小女孩問了三個問題。', '提取訊息'],
      ['小女孩問了哪些問題？', '天有多大？山有多高？星星有多少？', '提取訊息'],
      ['小男孩的問題是什麼呢？', '太陽出來了，小水珠跑哪去？', '提取訊息'],
      ['想一想，小男孩的問題：「太陽出來了，小水珠跑哪去？」小水珠一開始可能會是在哪裡呢？後來跑去哪裡呢？', '我覺得小水珠一開始可能在小草上，所以小男孩才會問這個問題。後來小水珠被太陽蒸發了。', '推論訊息'],
      ['小男孩和小女孩問的問題有什麼相同處？', '學生自由回答。如：都和大自然有關係。', '比較評估'],
      ['說一說，你對大自然的事物，有什麼問題想問呢？', '學生自由回答。如：為什麼會下雨呢？為什麼冬天這麼冷呢？', '詮釋整合'],
      ['想一想，對於小男孩的問題：「太陽出來了，小水珠跑哪去？」你也想知道答案的時候，該怎麼辦？', '學生自由回答。如：我可以先觀察，找答案；或者是問老師、家人；也可以到圖書館找書，解決我的疑問。', '詮釋整合'],
    ],
    patterns: [
      ['跑哪去', '引導學生思考哪些動作後面能接上「哪去」兩個字。', '動詞（什麼動作）＋哪去', ['丟哪去', '往哪去', '放哪去']],
      ['天有多大？', '用「有多」來詢問某件事物的狀態。', '名詞（人或物）＋有多＋形容詞（怎麼樣）？', ['姐姐有多高？', '螞蟻有多小？', '這條路有多長？']],
      ['小水珠跑哪去？', '透過問句確認事物的狀態。', '名詞（人或物）＋動詞（什麼動作）＋哪去？', ['鉛筆盒放哪去？', '小偷往哪去？', '球丟哪去？']],
      ['小草，請問你，天有多大？', '用「請問」有禮貌的向人發問問題。', null, ['哥哥，請問你，這個字怎麼念？', '小光，請問你可以借我鉛筆嗎？', '警衛伯伯，請問您，有人撿到我的便當袋嗎？']],
    ],
    polysemy: [
      ['少', '數量不多。', '今天下的雨很少。'],
      ['少', '年紀小或年輕。', '少年的笑聲很響亮。'],
      ['少', '丟失或不見。', '我的鉛筆少了一枝。'],
    ],
  },
  5: {
    title: '七彩的滑梯',
    map: [
      ['起：先描寫七彩滑梯高高在天上。', '開端'],
      ['承：想爬上去，找找有沒有棉花糖。', '發展'],
      ['合：想滑下去，找找有沒有泡泡池。', '收束'],
    ],
    gist: '課文想像天上的七彩滑梯，想爬上去找棉花糖，也想滑下去找泡泡池。',
    questions: [
      ['仔細觀察第44頁課文插圖，小朋友們正在哪裡？做什麼事情？', '有兩個小孩，正站在七彩滑梯上，女孩手上拿著一團團粉紅色的東西，正張開嘴巴要吃；小男孩則是左手拿著一根棒子，踮起腳尖，好像要拿什麼東西。另外還有一個小女孩正扶著樓梯往上爬。', '提取訊息'],
      ['仔細觀察第45頁課文插圖，小朋友們正在哪裡？做什麼事情？', '有一個小男孩滑進一個很大的泡泡池裡，和一隻小狗一起很開心的樣子；另外小女孩正順著七彩滑梯，就要滑下來。', '提取訊息'],
      ['課文中「七彩的滑梯」是指什麼東西？', '彩虹。', '推論訊息'],
      ['「七彩的滑梯」會出現在哪裡呢？', '高高的天上。', '提取訊息'],
      ['作者看到「七彩的滑梯」後，想要問的問題是什麼？', '好想爬上去，看一看有沒有棉花糖？好想滑下去，看一看有沒有泡泡池？', '提取訊息'],
      ['課文中的「棉花糖」是指什麼東西？', '雲朵。', '推論訊息'],
      ['畫家用什麼方式來表現「高高在天上」這句話呢？', '畫家畫出臺北一○一大樓和雲朵，展現「七彩的滑梯」在很高的地方。', '推論訊息'],
      ['為什麼會將彩虹形容成「七彩的滑梯」？', '因為彩虹有七種顏色，出現在天空時，我們看到彎彎的形狀，就像一個很大的滑梯，可以從天空滑到地面。', '詮釋整合'],
      ['如果是你，你會把彩虹想像成什麼？', '學生自由回答。如：彩色的橋、彩色的緞帶……', '比較評估'],
      ['你還會把什麼自然現象，想像成什麼呢？', '學生自由回答。如：把下雨想像成蓮蓬頭灑水，把颱風想像成發脾氣的小孩……', '比較評估'],
    ],
    patterns: [
      ['七彩的滑梯', '運用形容詞來形容事物會更加生動。', '形容詞（怎麼樣）＋的＋名詞（什麼事物）', ['可愛的小鳥', '美麗的花朵', '溫柔的老師']],
      ['看一看', '描述動作的狀態。', '動詞（什麼動作）＋一＋動詞（什麼動作）', ['走一走', '跑一跑', '泡一泡']],
      ['桌子上有沒有棉花糖？', '用「有沒有」來詢問某件事物是否存在。', null, ['公園裡有沒有秋千？', '教室裡有沒有電腦？', '校門口有沒有導護老師？']],
    ],
    polysemy: [
      ['好', '良好、不壞。', '今天天氣很好。'],
      ['好', '美、好看。', '這朵花真好看。'],
      ['好', '喜愛或熱衷。', '妹妹好學，常常讀書。'],
      ['看', '注視或觀賞。', '我在看圖畫。'],
      ['看', '表示試著做一下。', '你看一看這本書。'],
      ['看', '對人事物的看法。', '我想聽聽你的看法。'],
    ],
  },
  6: {
    title: '秋千',
    map: [
      ['起：秋千升高，和天空說早。', '開端'],
      ['承：秋千降低，向小草問好。', '發展'],
      ['轉：到花田、天上尋找答案。', '轉折'],
      ['合：問是誰陪秋千上下擺動。', '收束'],
    ],
    gist: '課文描寫秋千上下擺動，和天空、小草問候，並想找出陪伴它的人。',
    questions: [
      ['仔細觀察課文插圖，是誰在盪秋千？', '小女孩和小男孩。', '提取訊息'],
      ['觀察課文插圖，是誰陪著秋千，向天空說早？', '小女孩和小鳥。', '提取訊息'],
      ['觀察課文插圖，是誰陪著秋千，向小草問好？', '小男孩和風。', '提取訊息'],
      ['為什麼秋千可以「一下子高，和天空說早」、「一下子低，向小草問好」？', '因為秋千擺盪到最高的地方，看起來和天空最靠近，所以可以和天空說早；擺盪到低的地方，微風輕動，可以向小草問好。', '推論訊息'],
      ['為什麼秋千會一下子高，一下子低呢？', '因為小朋友盪秋千時會推動秋千，或是風吹動秋千。', '推論訊息'],
      ['秋千的問題是什麼？', '想知道是誰陪他上上下下？', '推論訊息'],
      ['秋千解決問題的方式是什麼？', '秋千自己去花田問、去天上找，來得到答案。', '詮釋整合'],
      ['課文最後一句「是誰陪他上上下下」，句中的「他」是指誰？', '秋千。', '推論訊息'],
      ['觀察課文插圖，小女孩和小男孩盪秋千有什麼不同？', '小女孩盪得比較高，和小鳥及雲朵在一起；小男孩盪得比較低，靠近花田，還有風在他背後幫忙推呢！', '比較評估'],
    ],
    patterns: [
      ['上上下下', '用疊詞動詞來描述動作，會有重複的效果。', '疊字動詞（什麼動作）', ['來來去去', '進進出出', '跑跑跳跳']],
      ['秋千一下子高，一下子低，向小草問好。', '句子裡用了兩個「一下子」，可以表達在很短的時間裡，有不同的變化。', null, ['哥哥一下子跑步，一下子打球，流了好多汗。', '小狗一下子搖尾巴，一下子大叫，看起來好開心。', '爸爸一下子打掃，一下子煮飯，真是辛苦。']],
    ],
    polysemy: [
      ['空', '天空或空間。', '白雲在天空飄。'],
      ['空', '裡面沒有東西。', '房間裡是空的。'],
      ['空', '閒餘的時間。', '我有空就來找你。'],
    ],
  },
  7: {
    title: '回音',
    map: [
      ['起：爬上高山、來到山谷，交代回音出現的地方。', '開端'],
      ['承：我先大叫你好，山谷有人回應同樣的話。', '發展'],
      ['承：我問你開心嗎，對方也問相同問題。', '發展'],
      ['轉：我的笑聲得到回應。', '轉折'],
      ['合：大家一起哈哈大笑，呈現回音互相呼應。', '收束'],
    ],
    gist: '課文在山谷中描寫呼喊與回音的互相呼應，最後用笑聲表現分享的快樂。',
    questions: [
      ['仔細觀察課文插圖，主角和家人一起做什麼事情？', '和家人一起爬山。', '提取訊息'],
      ['主角爬山爬到哪裡，才開始大喊呢？', '山谷。', '提取訊息'],
      ['當主角大叫：「你好！」發生了什麼事？', '聽到有人也回應他：「你好！」', '提取訊息'],
      ['「我大叫：『你好！』有人回：『你好！』」課文中的「有人」是指誰？', '我看課本第57頁插圖，覺得是山谷，因為山谷上有一張張的笑臉；我覺得因為課文是在講「回音」，所以「有人」就是主角自己傳回來的聲音。', '推論訊息'],
      ['為什麼主角會再大叫一聲：「你開心嗎？」', '因為想再確定是否還會有回音。', '推論訊息'],
      ['你覺得課文中「有人」和「他」是同一人嗎？為什麼？', '我覺得是同一人，都是指山谷的回音。', '比較評估'],
      ['為什麼「我笑，他也笑」呢？', '因為在山谷，當主角笑的時候，就會傳回笑聲。', '推論訊息'],
      ['最後主角為什麼會笑了？', '因為不論他喊什麼，都會傳回同樣的聲音，好像有人和他互動一樣，令人感覺驚喜。', '詮釋整合'],
      ['根據課文和插圖，再請你說說看什麼是「回音」？', '「回音」就是當人的聲音碰到山或牆壁，會再傳回來。', '詮釋整合'],
      ['想一想，生活中哪些地方也容易產生回音？和課本中產生回音的原因有什麼相同之處？', '生活中容易產生回音的地方有教室、禮堂、山洞等，都是空曠但是有圍起來的牆壁或山壁的地方。', '比較評估'],
    ],
    patterns: [
      ['爬上高山', '描述用什麼動作經過或到達什麼地方。', '動詞＋上／下／進／入／到＋名詞（什麼地方）', ['來到山谷', '走下樓梯', '跑進教室']],
      ['你開心嗎？', '透過問句來詢問人或物的狀態。', '名詞（人或物）＋形容詞（怎麼樣）嗎？', ['叔叔生氣嗎？', '作業困難嗎？', '遊戲有趣嗎？']],
      ['我笑，他也笑。', '用「也」來連接兩個相同的動作或事件。', null, ['姐姐哭了，妹妹也哭了。', '媽媽在上班，爸爸也在上班。', '小狗來喝水，小貓也來喝水。']],
    ],
    polysemy: [],
  },
};

const polyphoneData = {
  2: [
    ['大', [['ㄉㄚˋ', '大的、重要的或約略的意思。', ['大人', '大雨', '大事', '大約']], ['ㄉㄞˋ', '醫生。', ['大夫']]]],
  ],
  4: [
    ['少', [['ㄕㄠˇ', '數量不多。', ['少量', '少數']], ['ㄕㄠˋ', '年輕的人。', ['少年', '少爺']]]],
    ['了', [['ㄌㄜ˙', '表示動作完成或情況改變。', ['下雨了']], ['ㄌㄧㄠˇ', '明白、結束。', ['了解', '了結']]]],
  ],
  5: [
    ['好', [['ㄏㄠˇ', '美好、友善或效果好。', ['很好', '好朋友', '好看']], ['ㄏㄠˋ', '喜愛、熱衷。', ['好學', '嗜好']]]],
    ['看', [['ㄎㄢˋ', '注視、觀賞或看法。', ['觀看', '看法']], ['ㄎㄢ', '守護。', ['看門', '看護']]]],
  ],
  6: [
    ['子', [['ㄗ˙', '附在名詞後的語助成分。', ['桌子', '杯子']], ['ㄗˇ', '孩子、時辰或種子等意思。', ['子時', '父子', '瓜子']]]],
    ['空', [['ㄎㄨㄥ', '天空或沒有東西。', ['天空', '空屋']], ['ㄎㄨㄥˋ', '閒餘或可使用的位置。', ['空閒', '抽空', '空位']]]],
  ],
};

const idiomData = {
  1: [
    ['聞雞起舞', '起', '聽到雞叫就起床舞劍，形容及時努力。', '姐姐每天早起練琴，真有聞雞起舞的精神。'],
    ['走馬看花', '走', '比喻粗略、匆忙地觀察。', '參觀博物館不能走馬看花，要仔細欣賞。'],
    ['箭在弦上', '在', '事情已到眼前，不能不做。', '比賽就要開始，大家已經箭在弦上。'],
    ['左顧右盼', '左', '向左向右張望。', '小貓在門口左顧右盼，好像在找主人。'],
    ['名列前茅', '前', '名次排在前面。', '小芸認真準備考試，這次名列前茅。'],
  ],
  2: [
    ['粗枝大葉', '大', '比喻做事粗心大意。', '如果做事粗枝大葉，就容易漏掉重要細節。'],
    ['大驚小怪', '大', '對不足為奇的事情過分驚訝。', '只是下了一點小雨，不必大驚小怪。'],
    ['呼風喚雨', '風', '比喻能夠支配或影響很大的力量。', '故事裡的神仙好像能呼風喚雨。'],
    ['心血來潮', '心', '突然興起某種念頭。', '我心血來潮，想畫一張送給媽媽的卡片。'],
    ['不可思議', '不', '難以想像、難以理解。', '魔術師讓硬幣消失，真是不可思議。'],
  ],
  3: [
    ['人山人海', '山', '形容聚集的人很多。', '假日的遊樂園人山人海。'],
    ['大同小異', '小', '大致相同，只有小地方不同。', '這兩幅圖大同小異，只有顏色不同。'],
    ['眉開眼笑', '開', '形容非常開心。', '弟弟收到生日禮物，立刻眉開眼笑。'],
    ['開卷有益', '開', '讀書能得到好處。', '老師提醒我們開卷有益，要多讀好書。'],
    ['心平氣和', '心', '心情平靜，態度溫和。', '遇到問題時，我們要心平氣和地討論。'],
    ['一心一意', '心', '專心一致。', '小安一心一意完成手上的拼圖。'],
  ],
  4: [
    ['風吹草動', '風', '比喻輕微的變動或消息。', '小狗一聽到風吹草動，就豎起耳朵。'],
    ['歡天喜地', '天', '形容非常歡喜。', '孩子們歡天喜地地迎接校外教學。'],
    ['津津有味', '有', '吃得很有味道或談得很有興趣。', '弟弟津津有味地讀著故事書。'],
    ['多多益善', '多', '越多越好。', '圖書館的好書多多益善。'],
    ['興高采烈', '高', '興致高，情緒熱烈。', '同學們興高采烈地準備園遊會。'],
    ['急如星火', '星', '情勢非常急迫。', '接到通知後，大家急如星火地出發。'],
    ['水滴石穿', '水', '持續努力就能完成困難的事。', '只要每天練習，就能水滴石穿。'],
  ],
  5: [
    ['七上八下', '上', '心情忐忑不安。', '等待比賽結果時，我的心七上八下。'],
    ['力爭上游', '上', '努力求進步，不落人後。', '我們要力爭上游，天天進步。'],
    ['胡思亂想', '想', '沒有根據地任意亂想。', '事情還沒弄清楚，不要先胡思亂想。'],
    ['刮目相看', '看', '用新的眼光看待他人。', '妹妹進步很多，讓大家刮目相看。'],
    ['五花八門', '五', '種類繁多、變化多樣。', '市集裡有五花八門的玩具。'],
  ],
  6: [
    ['平分秋色', '秋', '雙方實力相當，不分上下。', '這兩隊表現都很好，真是平分秋色。'],
    ['千鈞一髮', '千', '情勢非常危急。', '消防員在千鈞一髮之際救出小狗。'],
    ['海闊天空', '海', '形容開闊、自由的境界。', '走出山谷後，眼前一片海闊天空。'],
    ['空穴來風', '空', '事情傳出並非完全沒有原因。', '這個消息不是空穴來風，已有人看見相關資料。'],
    ['低聲下氣', '低', '形容說話恭順小心。', '他低聲下氣地向同學道歉。'],
    ['口是心非', '是', '嘴上說的和心裡想的不一樣。', '答應幫忙就要做到，不要口是心非。'],
  ],
  7: [
    ['回心轉意', '回', '改變原來的想法。', '聽完大家的說明，他終於回心轉意。'],
    ['面面俱到', '到', '各方面都照顧得很周全。', '班長準備活動時面面俱到。'],
    ['大呼小叫', '叫', '大聲喊叫，吵吵鬧鬧。', '在圖書館裡不能大呼小叫。'],
    ['平易近人', '人', '態度謙遜，使人容易親近。', '新老師平易近人，同學都喜歡他。'],
    ['有說有笑', '笑', '又說又笑，氣氛愉快。', '大家一路有說有笑地回家。'],
  ],
};

function jsonRead(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function jsonWrite(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function requireSourceFile(directory, lessonNo, requiredText, extension) {
  const prefix = `1上L${String(lessonNo).padStart(2, '0')}`;
  const match = fs.readdirSync(directory).find((name) => name.startsWith(prefix) && name.includes(requiredText) && name.endsWith(extension));
  if (!match) throw new Error(`找不到官方來源：${directory}／${prefix}＊${requiredText}${extension}`);
  return path.join(directory, match);
}

function verifySources(lessonNo) {
  requireSourceFile(path.join(OFFICIAL_ROOT, '04形音輕鬆學(含語詞解釋)', 'PDF'), lessonNo, '形音輕鬆學', '.pdf');
  requireSourceFile(path.join(OFFICIAL_ROOT, '05生字延伸成語', 'PDF'), lessonNo, '生字延伸成語', '.pdf');
  requireSourceFile(path.join(OFFICIAL_ROOT, '06各課短語句型練習'), lessonNo, '短語句型造句', '.doc');
  requireSourceFile(path.join(OFFICIAL_ROOT, '08課文結構表', 'PDF'), lessonNo, '課文結構表', '.pdf');
  requireSourceFile(path.join(OFFICIAL_ROOT, '09閱讀理解提問'), lessonNo, '閱讀理解提問', '.doc');
}

function buildSentencePatterns(lessonNo, lessonId) {
  return (lessonText[lessonNo].patterns || []).map(([head, description, structure, examples], index) => ({
    category: '短語句型練習',
    pattern: head,
    head,
    description,
    structure,
    examples,
    examples_status: 'approved',
    id: `sentence-pattern:${lessonId}:${String(index + 1).padStart(2, '0')}`,
    status: 'ready',
    source: source('06各課短語句型練習', '使用者貼上之 L01-L07 教材內容；公開衍生資料'),
  }));
}

function buildParagraphs(lessonNo, lessonId) {
  return lessonText[lessonNo].map.map(([summary, role], index) => ({
    id: `paragraph_summary:${lessonId}:${String(index + 1).padStart(2, '0')}`,
    para_no: index + 1,
    paragraph_no: index + 1,
    summary,
    structure_role: role,
    status: 'approved',
    source: source('08課文結構表', '公開版課文地圖摘要'),
  }));
}

function buildReadingQuestions(lessonNo, lessonId) {
  return lessonText[lessonNo].questions.map(([stem, answer_hint, strategy_tag], index) => ({
    id: `reading-question:${lessonId}:${String(index + 1).padStart(2, '0')}`,
    stem,
    answer_hint,
    strategy_tag: strategy_tag || (index === 0 ? '提取訊息' : '理解訊息'),
    status: 'approved',
    source: source('09閱讀理解提問', '使用者貼上之 L01-L07 教材內容；公開衍生資料'),
  }));
}

function buildPolysemy(lessonNo, lessonId) {
  const entries = lessonText[lessonNo].polysemy || [];
  const options = [...new Set(entries.map(([, definition]) => definition))];
  return entries.map(([char, definition, sentence], index) => ({
    id: `polysemy:${lessonId}:${char}:${String(index + 1).padStart(2, '0')}`,
    char,
    sentence,
    definition,
    options,
    status: 'approved',
    source: source('04形音輕鬆學（含語詞解釋）', '一字多義'),
  }));
}

function buildPolyphones(lessonNo, lessonId) {
  return (polyphoneData[lessonNo] || []).map(([char, readingData]) => ({
    id: `polyphone:${lessonId}:${char}`,
    char,
    readings: readingData.map(([zhuyin, definition, examples]) => ({ zhuyin, definition, examples })),
    status: 'ready',
    source: source('04形音輕鬆學（含語詞解釋）', '認識多音字；注音依官方標示'),
  }));
}

function idiomImage(lessonNo, index, idiom) {
  const image = `idioms/${String(index + 1).padStart(2, '0')}_${idiom}.webp`;
  const imageFile = path.join(PUBLIC_ASSET_ROOT, `lesson${String(lessonNo).padStart(2, '0')}`, image);
  const safeReframe = lessonNo === 1 && index === 0;
  return fs.existsSync(imageFile)
    ? {
        image,
        image_origin: safeReframe ? 'generated:imagegen-safe-reframe' : 'generated:imagegen-contact-sheet-crop',
        image_layout: 'square-native',
      }
    : { image: null, image_origin: null, image_layout: null };
}

function buildIdioms(lessonNo, lessonId) {
  return (idiomData[lessonNo] || []).map(([idiom, related_char, definition], index) => ({
    ...idiomImage(lessonNo, index, idiom),
    id: `idiom:${lessonId}:${String(index + 1).padStart(2, '0')}`,
    idiom,
    definition,
    related_char,
    status: 'ready',
    source: source('05生字延伸成語', '成語與字義整理'),
  }));
}

function buildIdiomSentences(lessonNo, lessonId) {
  return (idiomData[lessonNo] || []).map(([idiom, , , rewritten], index) => ({
    id: `idiom-sentence:${lessonId}:${String(index + 1).padStart(2, '0')}`,
    idiom_id: `idiom:${lessonId}:${String(index + 1).padStart(2, '0')}`,
    rewritten,
    status: 'approved',
    source: source('05生字延伸成語', '生活化例句改寫；成語逐句回核'),
  }));
}

function buildLookalikes(lessonNo, lessonId) {
  const directory = path.join(DRAFT_ROOT, 'wordwall', '形似字辨別_quiz_Video_Game');
  const file = path.join(directory, `L${String(lessonNo).padStart(2, '0')}_形似字辨別_quiz.json`);
  const quiz = jsonRead(file);
  return (quiz.items || []).map((item, index) => {
    const answer = item.answers[item.correct];
    const example = String(item.question).replace(/[＿_]+/u, answer);
    return {
      id: `lookalike:${lessonId}:${String(index + 1).padStart(2, '0')}`,
      group_no: String(index + 1),
      question: item.question,
      answer,
      chars: item.answers.map((char) => ({ char, zhuyin: null, example: char === answer ? example : '' })),
      status: 'ready',
      source: source('04形音輕鬆學（含語詞解釋）', '形似字辨別；私有題庫逐題核對'),
    };
  });
}

function setModule(lesson, key, available, note) {
  const entry = lesson.modules[key] || {};
  entry.status = available ? 'available' : 'missing';
  if (available) delete entry.note;
  else if (note) entry.note = note;
  lesson.modules[key] = entry;
}

function materialize(lessonNo) {
  verifySources(lessonNo);
  const lessonFile = path.join(PUBLIC_ROOT, `lesson${String(lessonNo).padStart(2, '0')}.json`);
  const lesson = jsonRead(lessonFile);
  const lessonId = lesson.lesson_id;

  lesson.sentence_patterns = buildSentencePatterns(lessonNo, lessonId);
  lesson.paragraph_summary = buildParagraphs(lessonNo, lessonId);
  lesson.main_idea = {
    gist: lessonText[lessonNo].gist,
    theme: '課文理解',
    status: 'approved',
    source: source('08課文結構表', '公開版課文地圖摘要'),
  };
  lesson.reading_questions = buildReadingQuestions(lessonNo, lessonId);
  lesson.polysemy = buildPolysemy(lessonNo, lessonId);
  lesson.polyphones = buildPolyphones(lessonNo, lessonId);
  lesson.lookalikes = buildLookalikes(lessonNo, lessonId);
  lesson.idioms = buildIdioms(lessonNo, lessonId);
  lesson.idiom_sentences = buildIdiomSentences(lessonNo, lessonId);

  const sentenceMinimum = lessonNo === 6 ? 2 : 3;
  setModule(lesson, 'sentence_practice', lesson.sentence_patterns.length >= sentenceMinimum, '06各課短語句型練習來源已存在，但可用句型不足。');
  setModule(lesson, 'reading', lesson.paragraph_summary.length >= 3 || lesson.reading_questions.length >= 1, '08／09 閱讀來源已存在，但公開摘要或提問不足。');
  setModule(lesson, 'structure_map', lesson.paragraph_summary.length >= 3, '08課文結構表來源已存在，但公開地圖摘要不足。');
  setModule(lesson, 'idiom_builder', lesson.idioms.length >= 3, '05生字延伸成語來源已存在，但成語不足 3 筆。');
  setModule(lesson, 'polysemy', lesson.polysemy.length >= 3, '04形音輕鬆學來源未提供至少 3 筆可核對的一字多義資料。');
  setModule(
    lesson,
    'polyphones',
    lesson.polyphones.some((entry) => new Set(entry.readings.map((reading) => reading.zhuyin)).size >= 2),
    '04形音輕鬆學本課未提供至少兩種可核對的不同注音，保留未開放。',
  );
  setModule(lesson, 'lookalikes', lesson.lookalikes.length >= 3, '形似字私有題庫來源不足 3 題。');
  jsonWrite(lessonFile, lesson);
  return {
    lessonNo,
    title: lesson.title,
    patterns: lesson.sentence_patterns.length,
    paragraphs: lesson.paragraph_summary.length,
    readingQuestions: lesson.reading_questions.length,
    idioms: lesson.idioms.length,
    polysemy: lesson.polysemy.length,
    polyphones: lesson.polyphones.length,
    lookalikes: lesson.lookalikes.length,
    modules: Object.fromEntries(Object.entries(lesson.modules).filter(([key]) => ['sentence_practice', 'reading', 'structure_map', 'idiom_builder', 'polysemy', 'polyphones', 'lookalikes'].includes(key)).map(([key, value]) => [key, value.status])),
  };
}

const results = [1, 2, 3, 4, 5, 6, 7].map(materialize);
console.log(JSON.stringify({ publicRoot: PUBLIC_ROOT, results }, null, 2));
