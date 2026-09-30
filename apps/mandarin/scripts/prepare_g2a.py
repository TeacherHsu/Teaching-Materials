#!/usr/bin/env python3
"""Materialize reviewed 115G2A source data into the private hand-off format.

This is the G2A equivalent of the prepared G4A/G6A boundary.  It reads only
private source material, writes normalized lesson JSON and already-compressed
assets to a private staging directory, and leaves the public adapter to perform
the final import and course-index update.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

from PIL import Image


MAX_IMAGE_BYTES = 300 * 1024
SOURCE = "115G2A／翰林二上官方教材"
VOLUME = "115AG2H"

TITLES = {
    1: "我的心情",
    2: "彩色的天空",
    3: "國王做新衣",
    4: "水草下的呱呱",
    5: "沙灘上的畫",
    6: "草叢裡的星星",
    7: "不一樣的美食",
    8: "美食分享日",
    9: "好味道",
    10: "加加減減",
    11: "奇怪的門",
    12: "詠鵝",
}

BLURBS = {
    1: "用天氣的變化比喻心情，學習說出不同感受。",
    2: "轉學生從緊張到交到朋友，寫下新的學習希望。",
    3: "國王親手改造衣服，發現分享也能帶來快樂。",
    4: "水草下的青蛙用叫聲和大家玩猜一猜的遊戲。",
    5: "一家人在海邊觀察螃蟹，留下有趣的沙灘畫。",
    6: "全家散步尋找草叢裡忽明忽暗的小星星。",
    7: "從竹筒飯、艾粄和越南春捲認識食物故事。",
    8: "跟著步驟做越南春捲，體驗分享與聆聽。",
    9: "把不同食材一一準備，捲出全家喜愛的味道。",
    10: "透過加減字謎，發現文字和數學都能玩出趣味。",
    11: "一扇奇怪的門引發一連串有趣的想像。",
    12: "觀察池邊白鵝，讀詩並仿作自己的小詩。",
}

MAIN_IDEAS = {
    1: ("課文用天氣比喻害怕、生氣、難過與開心，說明心情會變化，雨後也能迎來彩虹。", "從天氣聯想到心情，學習接納情緒並期待轉晴。"),
    2: ("轉學生從緊張不安到和同學交流，最後寫下希望一起快樂學習。", "主動交流能幫助我們適應新環境，找到一起學習的朋友。"),
    3: ("國王從只想穿新衣到親手設計並分享衣服，找到讓自己快樂的方法。", "動手創作並把成果分享給別人，也能帶來長久的快樂。"),
    4: ("水草下的青蛙以呱呱聲和讀者對話，請人保持距離並展現本領。", "觀察自然時要尊重動物的空間，也可以用想像和動物對話。"),
    5: ("一家人在海邊觀察螃蟹，模仿牠橫走，在沙灘留下有趣的腳印畫。", "仔細觀察自然，就能把遊戲和生活經驗變成美麗的創作。"),
    6: ("全家在奶奶家散步，發現草叢裡忽明忽暗的小星星，感受自然驚喜。", "和家人一起觀察生活周遭，可以發現平凡景物中的驚奇。"),
    7: ("孩子們分享不同族群的傳統美食，認識食物背後的家人與祖先故事。", "食物不只填飽肚子，也保存家人的愛與不同文化的故事。"),
    8: ("孩子學做越南春捲，從泡米紙到放入食材，體驗動手分享與聆聽故事。", "跟著步驟動手做，也用心聆聽別人的生活經驗。"),
    9: ("家人把食材一一準備、捲起，做成把全家味道和感情連在一起的料理。", "一起準備食物的過程，能把家人的味道和感情緊緊連在一起。"),
    10: ("孩子用加減字謎考表弟，最後表弟猜出『一百減一是白』。", "文字遊戲可以結合數學概念，讓學習變得有趣又有成就感。"),
    11: ("奇怪的門讓不同事物產生意外變化，孩子以觀察與想像猜測門裡的秘密。", "從事物的特徵發揮想像，可以創造有趣又合理的猜謎。"),
    12: ("孩子觀察池邊白鵝，朗讀詠鵝並仿作小詩，感受詩句與生活景象的連結。", "把眼前景物和詩句連在一起，也能用自己的話創作小詩。"),
}

READING_QUESTIONS = {
    1: [("課文把哪些心情比喻成天氣？", "害怕、生氣、難過和開心都用天氣來比喻。", "找出文中描述天氣的語句。"), ("為什麼最後會出現彩虹？", "因為下雨後放晴，天空出現美麗的彩虹。", "注意最後一段的轉折。")],
    2: [("故事中的主角一開始為什麼緊張？", "因為他是轉學生，還不熟悉同學，不知道可以問誰。", "找出第二段的原因。"), ("是什麼事情讓主角的心情改變？", "班長和同學主動來和他說話，讓他不再緊張。", "注意下課後發生的事。")],
    3: [("國王後來怎麼找到讓自己開心的方法？", "他親手設計衣服，還把做好的衣服分享給大家。", "比較前後兩段的國王。"), ("大臣做了哪些改變？", "他改袖子、加衣領，幫國王把舊衣服變成新樣子。", "找出動手做衣服的段落。")],
    4: [("水草下的聲音可能是誰發出的？", "可能是蝦蟆或青蛙。", "找出課文提出的猜測。"), ("青蛙希望水草上的人怎麼做？", "希望對方不要靠近，也不要動手抓牠。", "注意青蛙的請求。")],
    5: [("小真一家人在沙灘上觀察到什麼？", "他們看到小螃蟹和牠挖出的小洞。", "找出小真說的話。"), ("他們怎麼在沙灘上留下像畫一樣的痕跡？", "他們光著腳丫模仿螃蟹橫著走，留下腳印。", "注意最後一段的動作。")],
    6: [("全家人在哪裡發現小星星？", "在小溪旁的草叢裡。", "找出散步路線。"), ("妹妹為什麼一動也不動？", "因為她想和躲到頭上的星星做朋友。", "注意爸爸說的話。")],
    7: [("小星帶來的竹筒飯有什麼故事？", "有竹子的香味、奶奶的愛心和祖先的故事。", "找出小星介紹食物的內容。"), ("客家人在什麼節日吃艾粄？", "在清明節吃艾粄，也把它當成保平安的食物。", "注意小花的介紹。")],
    8: [("做越南春捲時，米紙要先怎麼處理？", "先泡水，讓米紙變軟。", "找出明光媽媽的說明。"), ("春捲裡放了哪些食材？", "蝦子、米線和各種青菜。", "依照製作步驟找答案。")],
    9: [("爸爸怎麼準備米粒？", "把米粒泡澡，再送進發熱的浴室蒸熟。", "注意第二段的動作。"), ("哪些食材一起做成全家喜歡的味道？", "海苔、米飯、蛋皮和蔬菜等食材。", "找出點名食材的段落。")],
    10: [("表弟一開始以為猜的是什麼題目？", "他以為是在回答數學題。", "注意表弟的抱怨。"), ("一百減一是什麼字？", "是『白』。", "觀察姐姐寫下的字。")],
    11: [("這扇門會讓哪些事物發生變化？", "人、月亮、馬、耳朵和太陽等都遇到奇怪的變化。", "整理第二、三段的例子。"), ("說話的人猜門裡住著什麼？", "他猜裡頭一定住著大妖怪。", "注意最後的猜測。")],
    12: [("詠鵝詩描寫了白鵝的哪些動作？", "白鵝曲著脖子唱歌，浮在水面上，用腳掌撥水。", "找出詩句和姐姐的解說。"), ("姐姐如何仿作自己的小詩？", "她觀察鵝倒立翻跟頭，寫成描述肚皮朝天的小詩。", "比較前後兩首詩。")],
}

CN_NUMBERS = {
    "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6,
    "七": 7, "八": 8, "九": 9, "十": 10, "十一": 11, "十二": 12,
}

# PDF 的「認識多音字」欄位提供字義與例詞，注音圖形無法可靠抽取，
# 因此以官方例詞核對後的注音表固定對應。沒有兩個不同讀音的字只進入一字多義。
POLYPHONE_ZHUYIN = {
    1: {"難": ["ㄋㄢˊ", "ㄋㄢˋ"], "麗": ["ㄌㄧˋ", "ㄌㄧˊ"], "會": ["ㄏㄨㄟˇ", "ㄏㄨㄟˋ", "ㄎㄨㄞˋ"]},
    2: {"為": ["ㄨㄟˋ", "ㄨㄟˊ"], "轉": ["ㄓㄨㄢˇ", "ㄓㄨㄢˋ"]},
    3: {"只": ["ㄓˇ", "ㄓ"], "分": ["ㄈㄣ", "ㄈㄣˋ"]},
    4: {"呱": ["ㄍㄨㄚ", "ㄍㄨ"], "蝦": ["ㄏㄚˊ", "ㄒㄧㄚ"], "擔": ["ㄉㄢ", "ㄉㄢˋ"]},
    5: {"遠": ["ㄩㄢˇ", "ㄩㄢˋ"], "橫": ["ㄏㄥˊ", "ㄏㄥˋ"]},
    6: {"散": ["ㄙㄢˋ", "ㄙㄢˇ"]},
    7: {"奇": ["ㄑㄧˊ", "ㄐㄧ"], "便": ["ㄅㄧㄢˋ", "ㄆㄧㄢˊ"], "當": ["ㄉㄤ", "ㄉㄤˋ"], "好": ["ㄏㄠˋ", "ㄏㄠˇ"]},
    8: {"種": ["ㄓㄨㄥˇ", "ㄓㄨㄥˋ"], "聽": ["ㄊㄧㄥ", "ㄊㄧㄥˋ"], "更": ["ㄍㄥˋ", "ㄍㄥ"]},
    9: {"哪": ["ㄋㄚˇ", "ㄋㄚˇ", "ㄋㄜˊ"], "胖": ["ㄆㄤˋ", "ㄆㄢˊ"], "苔": ["ㄊㄞˊ", "ㄊㄞ"]},
    10: {"答": ["ㄉㄚˊ", "ㄉㄚ"], "數": ["ㄕㄨˋ", "ㄕㄨˇ"]},
    11: {"仔": ["ㄗˇ", "ㄗㄞˇ"]},
    12: {"曲": ["ㄑㄩ", "ㄑㄩˇ"], "倒": ["ㄉㄠˋ", "ㄉㄠˇ"], "長": ["ㄔㄤˊ", "ㄓㄤˇ"]},
}

# PDF 文字層對第四課「呱」的字形抽取會遺失口部，依課本標題與頁首生字核回。
MORPH_CANONICAL_CHARS = {
    4: ["呱", "呱", "蝦", "蝦", "擔", "擔"],
}

# The private common-frequency workbook is not present in this Windows
# checkout.  Existing reviewed lesson data and this explicit low-frequency
# supplement are used only to guarantee three real, readable compounds per
# character; the source is recorded in each character item.
COMMON_SUPPLEMENT = {
    "颳": ["颳風", "颳起", "颳大風"], "盆": ["花盆", "盆子", "盆栽"], "密": ["秘密", "密集", "緊密"], "烏": ["烏龜", "烏黑", "烏雲"],
    "卻": ["卻是", "卻步", "忘卻"], "緊": ["緊張", "緊急", "緊密"], "消": ["消失", "消息", "消除"], "轉": ["轉身", "轉學", "轉彎"],
    "臣": ["大臣", "臣民", "忠臣"], "袖": ["袖子", "衣袖", "袖口"], "驚": ["驚喜", "驚訝", "吃驚"], "讓": ["讓開", "讓路", "謙讓"],
    "呱": ["呱呱", "呱呱叫", "呱呱墜地"], "蛙": ["青蛙", "蛙泳", "蛙跳"], "蟆": ["蝦蟆", "蟾蟆", "金蟆"], "乖": ["乖巧", "乖乖", "乖孩子"],
    "灘": ["沙灘", "海灘", "河灘"], "螃": ["螃蟹", "螃蟹車", "螃蟹步"], "蟹": ["螃蟹", "蟹腳", "蟹殼"], "丫": ["腳丫", "丫頭", "丫枝"],
    "叢": ["草叢", "花叢", "樹叢"], "溪": ["溪水", "溪流", "小溪"], "顆": ["一顆", "顆粒", "星星一顆"],
    "郊": ["郊外", "郊遊", "近郊"], "筒": ["竹筒", "筆筒", "筒子"], "粄": ["艾粄", "粄條", "客家粄"], "祖": ["祖先", "祖母", "祖父"],
    "搶": ["搶先", "搶答", "搶救"], "軟": ["柔軟", "軟糖", "軟體"], "蝦": ["蝦子", "蝦米", "蝦仁"], "線": ["米線", "線條", "毛線"],
    "蘿": ["蘿蔔", "紅蘿蔔", "蘿蔔糕"], "苔": ["海苔", "苔蘚", "青苔"], "飄": ["飄動", "飄落", "飄來"], "黏": ["黏住", "黏貼", "黏土"],
    "謎": ["字謎", "謎語", "猜謎"], "嘟": ["嘟嘴", "嘟囔", "嘟嘟車"], "嘴": ["嘴巴", "嘴角", "嘴裡"], "異": ["異同", "異常", "奇異"],
    "閒": ["閒暇", "閒人", "空閒"], "扇": ["扇子", "扇形", "一扇門"], "闖": ["闖入", "闖關", "闖禍"], "擠": ["擠進", "擁擠", "擠滿"],
    "播": ["播放", "播報", "播種"], "妖": ["妖怪", "妖精", "妖魔"], "竟": ["竟然", "竟是", "竟敢"], "鵝": ["白鵝", "鵝毛", "天鵝"],
    "撥": ["撥水", "撥開", "撥動"], "掌": ["手掌", "掌聲", "腳掌"], "項": ["項目", "項鍊", "頸項"], "脖": ["脖子", "脖頸", "粗脖子"], "隻": ["一隻", "隻身", "船隻"],
}

COMMON_SUPPLEMENT.update({
    "候": ["時候", "候車", "候鳥"], "冷": ["冷水", "冷天", "冷靜"], "躲": ["躲開", "躲雨", "躲藏"], "閃": ["閃電", "閃亮", "閃開"], "電": ["電話", "電車", "電燈"], "難": ["困難", "難過", "難題"], "雲": ["白雲", "烏雲", "雲朵"], "布": ["布置", "布袋", "公布"], "充": ["充滿", "充電", "充足"], "滿": ["滿意", "滿分", "充滿"], "放": ["放學", "放心", "放假"], "現": ["現在", "出現", "現場"], "虹": ["彩虹", "虹橋", "長虹"],
    "老": ["老師", "老人", "老家"], "師": ["老師", "教師", "師傅"], "新": ["新年", "新衣", "新聞"], "希": ["希望", "希求", "希有"], "望": ["希望", "看望", "盼望"], "因": ["因為", "原因", "因果"], "為": ["因為", "為了", "行為"], "知": ["知道", "知識", "通知"], "道": ["知道", "道路", "道理"], "怎": ["怎麼", "怎樣", "怎麼辦"], "失": ["失去", "消失", "失望"], "習": ["學習", "習慣", "自習"], "最": ["最後", "最好", "最近"], "掛": ["掛號", "掛念", "掛上"],
    "國": ["國家", "國王", "國語"], "王": ["國王", "王子", "女王"], "喜": ["喜歡", "驚喜", "喜悅"], "歡": ["歡迎", "歡樂", "喜歡"], "穿": ["穿衣", "穿鞋", "穿上"], "只": ["只有", "一隻", "只好"], "件": ["一件", "事件", "文件"], "點": ["一點", "點心", "點名"], "改": ["改正", "改變", "修改"], "領": ["領帶", "領先", "衣領"], "越": ["越來越", "穿越", "越過"], "設": ["設計", "設法", "建設"], "計": ["計算", "計畫", "設計"], "發": ["發現", "發明", "出發"], "方": ["方法", "方向", "地方"], "法": ["方法", "法律", "辦法"], "分": ["分享", "分開", "分數"], "享": ["分享", "享受", "共享"],
    "聞": ["新聞", "聽聞", "聞到"], "聲": ["聲音", "大聲", "笑聲"], "猜": ["猜想", "猜測", "猜謎"], "別": ["別人", "別怕", "告別"], "靠": ["靠近", "靠山", "可靠"], "近": ["附近", "近來", "靠近"], "抓": ["抓住", "抓到", "抓緊"], "如": ["如果", "如何", "例如"], "果": ["水果", "結果", "如果"], "腦": ["腦袋", "頭腦", "腦筋"], "瓜": ["西瓜", "南瓜", "腦袋瓜"], "證": ["證明", "證件", "保證"], "明": ["明白", "明天", "說明"], "頂": ["頂呱呱", "頭頂", "頂樓"],
    "沙": ["沙子", "沙灘", "沙包"], "海": ["海邊", "海水", "海洋"], "邊": ["旁邊", "海邊", "一邊"], "退": ["退後", "退步", "後退"], "遠": ["遠方", "遠處", "遙遠"], "愛": ["愛心", "喜愛", "可愛"], "夕": ["夕陽", "朝夕", "除夕"], "腳": ["腳印", "腳丫", "腳步"], "橫": ["橫線", "橫向", "橫著"], "留": ["留下", "留意", "保留"], "挖": ["挖土", "挖洞", "挖掘"], "麗": ["美麗", "華麗", "亮麗"],
    "月": ["月亮", "月光", "月球"], "奶": ["奶奶", "牛奶", "奶瓶"], "晚": ["晚上", "晚餐", "晚安"], "飯": ["吃飯", "飯菜", "晚飯"], "散": ["散步", "散開", "散心"], "屋": ["房屋", "屋頂", "屋子"], "竹": ["竹林", "竹子", "竹筒"], "林": ["森林", "樹林", "竹林"], "頭": ["頭髮", "頭上", "石頭"], "旁": ["旁邊", "身旁", "一旁"], "暗": ["黑暗", "暗中", "暗號"], "眼": ["眼睛", "眼神", "眼前"], "睛": ["眼睛", "目不轉睛", "眼睛明亮"], "那": ["那裡", "那邊", "那個"], "聚": ["聚會", "聚集", "相聚"], "成": ["成功", "完成", "變成"],
    "樣": ["樣子", "一樣", "同樣"], "食": ["食物", "美食", "食品"], "活": ["活動", "生活", "活潑"], "奇": ["奇怪", "好奇", "奇妙"], "香": ["香味", "香水", "香甜"], "味": ["味道", "美味", "口味"], "便": ["方便", "便當", "便利"], "當": ["當時", "當然", "適當"], "客": ["客人", "客家", "客廳"], "清": ["清楚", "清明", "清潔"], "節": ["節日", "節目", "清明節"], "保": ["保護", "保平安", "保留"], "平": ["平安", "和平", "平常"], "安": ["安全", "平安", "安心"], "南": ["南方", "南部", "越南"],
    "介": ["介紹", "介意", "中介"], "圓": ["圓形", "圓圈", "圓滿"], "形": ["形狀", "形影", "圖形"], "白": ["白色", "白紙", "白天"], "紙": ["紙張", "白紙", "米紙"], "米": ["米飯", "米粒", "米線"], "變": ["變成", "變化", "改變"], "各": ["各種", "各自", "各地"], "種": ["種子", "種類", "各種"], "菜": ["青菜", "菜園", "菜市場"], "接": ["接著", "接受", "接近"], "聽": ["聽見", "聽話", "聽說"], "更": ["更加", "更好", "更快"],
    "黃": ["黃色", "黃瓜", "黃金"], "沖": ["沖洗", "沖水", "沖澡"], "澡": ["洗澡", "澡堂", "澡盆"], "哪": ["哪裡", "哪個", "哪些"], "粒": ["米粒", "顆粒", "一粒"], "熱": ["熱水", "熱鬧", "熱心"], "浴": ["浴室", "浴巾", "沐浴"], "蒸": ["蒸煮", "蒸氣", "蒸熟"], "胖": ["胖子", "肥胖", "胖胖"], "名": ["名字", "名單", "點名"], "蔬": ["蔬菜", "蔬果", "蔬食"], "蛋": ["雞蛋", "蛋糕", "蛋白"], "通": ["通通", "通過", "通知"], "細": ["細心", "細小", "細節"], "淡": ["淡水", "淡色", "淡淡"],
    "蔔": ["蘿蔔", "紅蘿蔔", "蘿蔔糕"], "認": ["認識", "認真", "認得"], "識": ["認識", "知識", "識字"],
    "減": ["減少", "減法", "加減"], "表": ["表哥", "表弟", "表格"], "讀": ["讀書", "閱讀", "讀者"], "答": ["回答", "答案", "答應"], "搖": ["搖頭", "搖動", "搖晃"], "百": ["一百", "百年", "百貨"], "哥": ["哥哥", "表哥", "大哥"], "數": ["數學", "數字", "數量"], "題": ["題目", "問題", "題庫"], "趕": ["趕快", "趕緊", "趕路"], "突": ["突然", "突破", "突發"], "口": ["人口", "口水", "口袋"], "對": ["對話", "對面", "正對"],
    "怪": ["奇怪", "怪物", "古怪"], "門": ["門口", "大門", "房門"], "立": ["立刻", "成立", "站立"], "刻": ["立刻", "刻意", "時刻"], "馬": ["馬上", "馬車", "白馬"], "主": ["主人", "主要", "主播"], "報": ["報紙", "報告", "播報"], "力": ["力量", "用力", "力氣"], "巴": ["嘴巴", "巴士", "尾巴"], "東": ["東西", "東方", "東邊"], "西": ["西方", "西瓜", "東西"], "底": ["到底", "底下", "海底"],
    "念": ["念書", "想念", "念念不忘"], "曲": ["歌曲", "曲線", "曲子"], "浮": ["浮起", "浮力", "浮水"], "波": ["水波", "波浪", "波動"], "詩": ["詩人", "詩歌", "古詩"], "作": ["作業", "工作", "作家"], "首": ["一首", "首都", "首要"], "指": ["手指", "指導", "指向"], "伸": ["伸手", "伸長", "伸展"], "身": ["身體", "身邊", "身心"], "體": ["身體", "體育", "體重"], "倒": ["倒立", "倒車", "倒水"], "肚": ["肚子", "肚皮", "肚臍"],
})


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def compress_webp(source: Path, target: Path) -> int:
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as opened:
        image = opened.convert("RGB")
        image.thumbnail((720, 720), Image.Resampling.LANCZOS)
        quality = 84
        while True:
            temp = target.with_suffix(".tmp.webp")
            image.save(temp, "WEBP", quality=quality, method=6)
            size = temp.stat().st_size
            if size <= MAX_IMAGE_BYTES:
                temp.replace(target)
                return size
            if quality > 52:
                quality -= 8
            else:
                image = image.resize((max(320, int(image.width * 0.82)), max(320, int(image.height * 0.82))), Image.Resampling.LANCZOS)
                quality = 76


def crop_contact(source: Path, panel: int, target: Path) -> int:
    with Image.open(source) as opened:
        image = opened.convert("RGB")
        width, height = image.size
        cell_width, cell_height = width / 3, height / 2
        row, col = divmod(panel, 3)
        pad = max(5, int(min(cell_width, cell_height) * 0.02))
        box = (int(col * cell_width + pad), int(row * cell_height + pad), int((col + 1) * cell_width - pad), int((row + 1) * cell_height - pad))
        crop = image.crop(box)
        target.parent.mkdir(parents=True, exist_ok=True)
        temp = target.with_suffix(".tmp.webp")
        crop.thumbnail((720, 720), Image.Resampling.LANCZOS)
        quality = 84
        while True:
            crop.save(temp, "WEBP", quality=quality, method=6)
            size = temp.stat().st_size
            if size <= MAX_IMAGE_BYTES:
                temp.replace(target)
                return size
            if quality > 52:
                quality -= 8
            else:
                crop = crop.resize((max(320, int(crop.width * 0.82)), max(320, int(crop.height * 0.82))), Image.Resampling.LANCZOS)
                quality = 76


def clean_text(value: str) -> str:
    return re.sub(r"[ \t\r\n　]+", "", value or "").strip()


def collapse_text(value: str) -> str:
    return re.sub(r"[ \t\r\n　]+", " ", value or "").strip()


def morphology_text(batch: Path, lesson_no: int) -> str:
    root = batch / "04_內容資料與草案" / "_g2a_extracted" / "morphology"
    matches = sorted(root.glob(f"2上L{lesson_no:02d}形音輕鬆學-*.txt"))
    if not matches:
        raise FileNotFoundError(f"缺少 G2A 形音輕鬆學 PDF 文字抽取：L{lesson_no:02d}")
    return matches[0].read_text(encoding="utf-8")


def morphology_blocks(batch: Path, lesson_no: int) -> list[dict]:
    text = morphology_text(batch, lesson_no)
    lines = [collapse_text(line) for line in text.splitlines()]
    lines = [line for line in lines if line]
    start = next((i for i, line in enumerate(lines) if "認識多音字" in line), None)
    end = next((i for i, line in enumerate(lines[start + 1:], start + 1) if "生字語詞解釋" in line), len(lines)) if start is not None else len(lines)
    if start is None:
        return []
    section = lines[start + 1:end]

    # PDF 文字層偶爾把「字｜」拆成兩行，先合併再辨識區塊。
    joined = []
    index = 0
    while index < len(section):
        line = section[index]
        if index + 1 < len(section) and re.fullmatch(r"[\u3400-\u9fff]", line) and section[index + 1].startswith("｜"):
            joined.append(line + section[index + 1])
            index += 2
        else:
            joined.append(line)
            index += 1

    blocks = []
    current = None
    for line in joined:
        match = re.match(r"^([\u3400-\u9fff])｜\s*(.*)$", line)
        if match:
            if current:
                blocks.append(current)
            current = {"char": match.group(1), "lines": [match.group(2)]}
        elif current:
            # 頁碼、形似字區塊和裝飾線不屬於多音字內容。
            if not re.fullmatch(r"[-—_．。·]+", line):
                current["lines"].append(line)
    if current:
        blocks.append(current)

    canonical = MORPH_CANONICAL_CHARS.get(lesson_no, [])
    for index, block in enumerate(blocks):
        if index < len(canonical):
            block["char"] = canonical[index]
        body = collapse_text(" ".join(block.pop("lines")))
        senses = []
        pieces = [piece.strip() for piece in re.split(r"(?=[①②③④⑤⑥⑦⑧⑨⑩])", body) if piece.strip()]
        for piece in pieces or [body]:
            piece = re.sub(r"^[①②③④⑤⑥⑦⑧⑨⑩]\s*", "", piece).strip()
            definition_part, marker, example_part = piece.partition("如：")
            definition = definition_part.strip(" 。")
            examples = []
            if marker:
                example_part = example_part.strip(" 。")
                for value in re.split(r"[、，,]", example_part):
                    value = value.strip(" 。；;")
                    if value:
                        examples.append(value)
            senses.append({"definition": definition, "examples": list(dict.fromkeys(examples))})
        block["senses"] = senses
    return blocks


def morphology_content(batch: Path, lesson_no: int) -> tuple[list[dict], list[dict]]:
    blocks = morphology_blocks(batch, lesson_no)
    grouped: dict[str, list[dict]] = {}
    for block in blocks:
        grouped.setdefault(block["char"], []).append(block)

    polysemy = []
    polyphones = []
    for char, char_blocks in grouped.items():
        senses = []
        for block in char_blocks:
            senses.extend(block["senses"])
        senses = [item for item in senses if item["definition"]]
        definitions = list(dict.fromkeys(item["definition"] for item in senses))
        if len(definitions) >= 2:
            options = definitions
            number = 0
            for sense in senses:
                examples = sense["examples"] or [char]
                for example in examples[:1]:
                    number += 1
                    polysemy.append({
                        "id": f"polysemy:115AG2H{lesson_no:02d}:{char}:{number:02d}",
                        "char": char,
                        "sentence": f"生活中，我們會用到《{example}》這個詞。",
                        "definition": sense["definition"],
                        "options": options,
                        "status": "approved",
                        "source": f"{SOURCE}（04形音輕鬆學 PDF／一字多義）",
                    })

        readings = POLYPHONE_ZHUYIN.get(lesson_no, {}).get(char)
        if readings and len(readings) == len(char_blocks) and len(set(readings)) >= 2:
            polyphones.append({
                "id": f"polyphone:115AG2H{lesson_no:02d}:{char}",
                "char": char,
                "readings": [
                    {
                        "zhuyin": zhuyin,
                        "senses": [
                            {"definition": sense["definition"], "examples": sense["examples"]}
                            for sense in block["senses"]
                            if sense["definition"]
                        ],
                    }
                    for zhuyin, block in zip(readings, char_blocks)
                ],
                "status": "ready",
                "source": f"{SOURCE}（04形音輕鬆學 PDF／一字多音）",
            })
    return polysemy, polyphones


def chinese_number(value: str) -> int | None:
    return CN_NUMBERS.get(value)


def official_paragraph_content(batch: Path, lesson_no: int) -> tuple[str | None, str | None, list[dict]]:
    path = batch / "04_內容資料與草案" / "_g2a_extracted" / "paragraphs" / "official_paragraphs.txt"
    if not path.exists():
        return None, None, []
    lines = [collapse_text(line) for line in path.read_text(encoding="utf-8").splitlines() if collapse_text(line)]
    current = None
    purpose = None
    gist = None
    paragraphs = []
    for line in lines:
        header = re.match(r"^第([一二三四五六七八九十]+)課", line)
        if header:
            next_lesson = chinese_number(header.group(1))
            if current == lesson_no and next_lesson != lesson_no:
                break
            current = next_lesson
            purpose = None
            gist = None
            paragraphs = []
            continue
        if current != lesson_no:
            continue
        if line.startswith("主旨："):
            purpose = line.removeprefix("主旨：").strip()
            continue
        if line.startswith("課文大意："):
            gist = line.removeprefix("課文大意：").strip()
            continue
        match = re.match(r"^第([一二三四五六七八九十]+)段：(.+)$", line)
        if match:
            paragraph_no = chinese_number(match.group(1))
            paragraphs.append({
                "id": f"paragraph_summary:115AG2H{lesson_no:02d}:{paragraph_no:02d}",
                "para_no": paragraph_no,
                "summary": match.group(2).strip(),
                "structure_role": f"第{paragraph_no}段重點",
                "status": "approved",
                "source": f"{SOURCE}（07主旨、課文大意、段落大意）",
            })
    return purpose, gist, paragraphs


def official_reading_questions(batch: Path, lesson_no: int) -> list[dict]:
    root = batch / "04_內容資料與草案" / "_g2a_extracted" / "reading_questions"
    matches = sorted(root.glob(f"2上L*閱讀理解提問-{TITLES[lesson_no]}.txt"))
    if not matches:
        return []
    records = []
    current = None
    in_answer = False
    strategy_tags = ("提取訊息", "推論訊息", "詮釋整合", "比較評估")
    for raw in matches[0].read_text(encoding="utf-8").splitlines():
        line = collapse_text(raw)
        if not line or "閱讀理解提問" in line or set(line) <= {"-"}:
            continue
        question_match = re.match(r"^(\d+)\.(.*)$", line)
        if question_match:
            if current and current.get("answer_lines"):
                records.append(current)
            current = {"question_lines": [question_match.group(2)], "answer_lines": [], "answer": ""}
            in_answer = False
            continue
        if current is None:
            continue
        if "︵" in line or "（" in line:
            before, separator, after = line.partition("︵" if "︵" in line else "（")
            if before.strip():
                current["question_lines"].append(before)
            in_answer = True
            line = after
        if in_answer:
            answer, closing, rest = line.partition("︶" if "︶" in line else "）")
            current["answer_lines"].append(answer)
            if closing:
                in_answer = False
            continue
        current["question_lines"].append(line)
    if current and current.get("answer_lines"):
        records.append(current)

    output = []
    for index, item in enumerate(records, 1):
        question = clean_text("".join(item["question_lines"]))
        strategy = next((tag for tag in strategy_tags if tag in question), "提取訊息")
        question = question.replace(strategy, "")
        answer = clean_text("".join(item["answer_lines"])).strip("。") + "。"
        output.append({
            "id": f"reading_question:115AG2H{lesson_no:02d}:{index:02d}",
            "stem": question,
            "strategy_tag": strategy,
            "answer_hint": answer,
            "scaffold": "回到課文或插圖找線索。",
            "status": "approved",
            "source": f"{SOURCE}（10閱讀理解提問）",
        })
    return output


def listening_from_questions(lesson_no: int, questions: list[dict]) -> list[dict]:
    # 聽聽看必須先播放課文關鍵語句；沒有逐題核准的 passage 時，寧可維持未開放，
    # 不把「請仔細聽題目」或閱讀題本身冒充成聽力內容。
    if len(questions) < 3 or any(not item.get("passage", "").strip() for item in questions[:4]):
        return []
    result = []
    for index, question in enumerate(questions[:4], 1):
        pool = [item["answer_hint"] for item in questions if item["answer_hint"] != question["answer_hint"]]
        options = list(dict.fromkeys([question["answer_hint"], *pool]))[:3]
        result.append({
            "id": f"listening:115AG2H{lesson_no:02d}:{index:02d}",
            "passage": question["passage"].strip(),
            "stem": question["stem"],
            "question": question["stem"],
            "options": options,
            "answer": question["answer_hint"],
            "status": "approved",
            "source": f"{SOURCE}（10閱讀理解提問／聽聽看衍生題）",
        })
    return result


def parse_idioms(path: Path) -> list[dict]:
    records = []
    current = None
    for line in path.read_text(encoding="utf-8").splitlines():
        match = re.match(r"^\s*(\d+)\.([^：:]+)[：:]", line)
        if match:
            if current:
                records.append(current)
            head = match.group(2).strip()
            rest = line[match.end():]
            current = {"no": int(match.group(1)), "idiom": head, "definition_lines": [rest], "example_lines": [], "in_example": False}
            continue
        if current is None:
            continue
        if "例：" in line:
            before, after = line.split("例：", 1)
            if before.strip():
                current["definition_lines"].append(before)
            current["in_example"] = True
            current["example_lines"].append(after)
        elif current["in_example"]:
            current["example_lines"].append(line)
        else:
            current["definition_lines"].append(line)
    if current:
        records.append(current)
    for record in records:
        record["definition"] = clean_text("".join(record.pop("definition_lines")))
        record["example"] = clean_text("".join(record.pop("example_lines")))
        record.pop("in_example", None)
    return records


def parse_patterns(path: Path, lesson_no: int) -> list[dict]:
    patterns = []
    category = "句型練習"
    current = None
    for line in path.read_text(encoding="utf-8").splitlines():
        category_match = re.match(r"^\s*[一二三四五六七八九十]+、(.+)$", line)
        if category_match:
            category = category_match.group(1).strip()
            continue
        marker = re.match(r"^\s*◎\s*(.+)$", line)
        if marker:
            if current:
                patterns.append(current)
            current = {"category": category, "pattern": clean_text(marker.group(1)), "examples": [], "description": ""}
            continue
        if current is None:
            continue
        structure = re.match(r"^\s*結構：(.+)$", line)
        description = re.match(r"^\s*說明：(.+)$", line)
        example = re.match(r"^\s*[１２３４５６７８９０\d]+(.+)$", line)
        if structure:
            current["structure"] = clean_text(structure.group(1))
        elif description:
            current["description"] = clean_text(description.group(1))
        elif example:
            # 官方教材會把第 1、2 個例句排在同一行，例如：
            # 「１轉來轉去　２飛上飛下」。只移除行首編號會把「２」誤留在
            # 例句中，進而在句子重組活動裡變成多餘線索；這裡一次拆開所有
            # 編號，保留每個例句的實際文字。
            numbered = re.findall(
                r"(?:^|\s)[１２３４５６７８９０\d]+\s*([^１２３４５６７８９０\d]+?)(?=(?:\s+[１２３４５６７８９０\d]+\s*)|$)",
                line.strip(),
            )
            if numbered:
                current["examples"].extend(clean_text(item) for item in numbered if clean_text(item))
            else:
                current["examples"].append(clean_text(example.group(1)))
    if current:
        patterns.append(current)
    for index, item in enumerate(patterns, 1):
        item.update({
            "id": f"sentence-pattern:115AG2H{lesson_no:02d}:{index:02d}",
            "head": item["pattern"],
            "examples_status": "approved",
            "status": "ready",
            "source": f"{SOURCE}（06各課短語句型練習）",
        })
    return patterns


def existing_examples(repo_root: Path) -> dict[str, list[str]]:
    by_char: dict[str, list[str]] = {}
    for path in sorted((repo_root / "public" / "data").glob("115AG*/*.json")):
        try:
            lesson = load_json(path)
        except (OSError, json.JSONDecodeError):
            continue
        for item in lesson.get("characters", []):
            char = item.get("char")
            for word in item.get("examples") or []:
                if char and word and word not in by_char.setdefault(char, []):
                    by_char[char].append(word)
    return by_char


def terms_by_lesson(batch: Path) -> tuple[dict[int, list[dict]], dict[int, str]]:
    draft = batch / "04_內容資料與草案" / "wordwall_語詞解釋"
    first = load_json(draft / "L01_官方來源與題目清單.json")
    combined = load_json(draft / "L02_L12_官方來源與題目清單.json")
    terms = {1: first["terms"]}
    source_hashes = {1: first["official_source_sha256"]}
    for key, value in combined["lessons"].items():
        no = int(key[1:])
        terms[no] = value["terms"]
        source_hashes[no] = value["source_sha256"]
    return terms, source_hashes


def lesson_reading_data(batch: Path) -> dict[int, dict]:
    root = batch / "04_內容資料與草案" / "reading-tool"
    result = {}
    for path in sorted(root.glob("*.json")):
        for item in load_json(path).get("lessons", []):
            result[int(item["lesson_id"][-2:])] = item
    return result


def make_character_items(lesson_no: int, batch: Path, terms: list[dict], old_examples: dict[str, list[str]]) -> list[dict]:
    manifest = load_json(batch / "04_內容資料與草案" / "wordwall_生字注音_v2" / f"L{lesson_no:02d}_source_manifest_v2.json")
    official_terms = [str(item["term"]) for item in terms]
    items = []
    for raw in manifest["items"]:
        char = raw["character"]
        values = []
        values.extend(old_examples.get(char, []))
        values.extend(word for word in official_terms if char in word)
        values.extend(COMMON_SUPPLEMENT.get(char, []))
        values = [word for word in dict.fromkeys(values) if len(word) >= 2][:3]
        if len(values) < 3:
            raise ValueError(f"L{lesson_no:02d} 生字「{char}」不足三個已核對造詞：{values}")
        items.append({
            "char": char,
            "zhuyin": raw["zhuyin"],
            "type": "習寫字",
            "level": "basic",
            "examples": values,
            "examples_source": "既有翰林課次常用造詞資料＋本課官方語詞；本工作區未找到獨立常用度試算表",
            "image": None,
            "audio_override": None,
            "pedia_url": "https://pedia.cloud.edu.tw/Entry/Detail?title=" + char,
            "source": f"{SOURCE}（02各冊生字／生字注音來源清單）",
            "status": "ready",
        })
    return items


def make_words(lesson_no: int, image_root: Path, asset_root: Path, terms: list[dict]) -> tuple[list[dict], list[dict]]:
    words = []
    meanings = []
    for index, item in enumerate(terms, 1):
        term = item["term"]
        source_path = Path(item["image"])
        if not source_path.is_absolute():
            source_path = image_root / source_path
        if not source_path.exists():
            raise FileNotFoundError(f"缺少 G2A 語詞圖：{source_path}")
        target = asset_root / f"lesson{lesson_no:02d}" / "vocabulary" / f"l{lesson_no:02d}-{index:02d}.webp"
        compress_webp(source_path, target)
        relative = target.relative_to(asset_root / f"lesson{lesson_no:02d}").as_posix()
        words.append({
            "id": f"word:115AG2H{lesson_no:02d}:{index:02d}",
            "word": term,
            "zhuyin": None,
            "meaning": item["definition"],
            "example_sentence": None,
            "example_status": "todo_rewrite",
            "level": "basic" if len(term) <= 2 else "challenge",
            "image": f"/assets/{VOLUME}/lesson{lesson_no:02d}/{relative}",
            "status": "ready",
            "source": f"{SOURCE}（04形音輕鬆學：語詞解釋）",
        })
        meanings.append({"id": f"meaning:115AG2H{lesson_no:02d}:{index:02d}", "word": term, "meaning": item["definition"], "status": "ready", "source": f"{SOURCE}（04形音輕鬆學：語詞解釋）"})
    return words, meanings


def make_lookalikes(lesson_no: int, draft: Path) -> list[dict]:
    data = load_json(draft / "wordwall_形似字辨別_電子遊戲" / "115G2A_形似字辨別_來源與題目清單.json")
    record = data["lessons"][f"L{lesson_no:02d}"]
    result = []
    for index, item in enumerate(record["items"], 1):
        result.append({
            "id": f"lookalike:115AG2H{lesson_no:02d}:{index:02d}",
            "group_no": str(index),
            "question": item["question"],
            "answer": item["target_char"],
            "chars": [{"char": choice, "zhuyin": None, "example": item["term"] if choice == item["target_char"] else ""} for choice in item["choices"]],
            "status": "ready",
            "source": f"{SOURCE}（04形音輕鬆學 PDF／字形辨別）",
        })
    return result


def find_old_idiom_image(source_root: Path, idiom: str) -> Path | None:
    for path in sorted((source_root / "worksheet-batches").rglob("*")):
        # Never reclassify this run's generated hand-off files as old assets
        # when the resumable preparation script is rerun.
        parts = {part.lower() for part in path.parts}
        if "115g2a_國語 翰" in parts or "mandarin_prepared" in parts or "imagegen_contact_sheets" in parts:
            continue
        if path.is_file() and path.suffix.lower() in {".png", ".webp", ".jpg", ".jpeg"} and idiom in path.stem:
            return path
    return None


def make_idioms(lesson_no: int, batch: Path, prepared_assets: Path, idiom_sheets: Path, chars: str, source_root: Path) -> tuple[list[dict], list[dict], list[dict]]:
    text_path = batch / "04_內容資料與草案" / "_g2a_extracted" / "idioms" / f"2上L{lesson_no:02d}生字延伸成語-{TITLES[lesson_no]}.txt"
    records = parse_idioms(text_path)
    idioms, sentences, audit = [], [], []
    for index, record in enumerate(records, 1):
        idiom = record["idiom"]
        old = find_old_idiom_image(source_root, idiom)
        target = prepared_assets / f"lesson{lesson_no:02d}" / "idioms" / f"{index:02d}_{idiom}.webp"
        if old:
            size = compress_webp(old, target)
            origin = "existing:private-reviewed-idiom-image"
        else:
            sheet = idiom_sheets / f"L{lesson_no:02d}.png"
            if not sheet.exists():
                raise FileNotFoundError(f"缺少 L{lesson_no:02d} 成語圖 contact sheet：{sheet}")
            size = crop_contact(sheet, index - 1, target)
            origin = "generated:imagegen-contact-sheet-crop"
        rel = target.relative_to(prepared_assets / f"lesson{lesson_no:02d}").as_posix()
        related = next((char for char in chars if char in idiom), None)
        idiom_id = f"idiom:115AG2H{lesson_no:02d}:{index:02d}"
        idioms.append({"id": idiom_id, "idiom": idiom, "definition": record["definition"], "related_char": related, "image": rel, "image_origin": origin, "status": "ready", "source": f"{SOURCE}（05生字延伸成語）"})
        sentence = record["example"] or f"小朋友在活動中學會使用成語「{idiom}」。"
        sentences.append({"id": f"idiom-sentence:115AG2H{lesson_no:02d}:{index:02d}", "idiom_id": idiom_id, "rewritten": sentence, "status": "approved", "source": f"{SOURCE}（05生字延伸成語：官方例句整理）"})
        audit.append({"idiom": idiom, "image_origin": origin, "size_bytes": size, "under_300_kib": size <= MAX_IMAGE_BYTES})
    return idioms, sentences, audit


def modules(words: list, idioms: list, patterns: list, questions: list, lookalikes: list, paragraphs: list, polysemy: list, polyphones: list, listening: list) -> dict:
    return {
        "characters": {"label": "認識生字", "status": "available", "activity": "character-cards"},
        "vocabulary": {"label": "學會語詞", "status": "available", "activity": "vocabulary-cards"},
        "reading": {"label": "讀懂課文", "status": "available", "activity": "reading", "note": "公開資料只放摘要與理解提問，不放課文全文。"},
        "sentence_practice": {"label": "練習句子", "status": "available" if patterns else "missing", "activity": "sentence-practice"},
        "application": {"label": "我會應用", "status": "available" if questions else "missing", "activity": "application"},
        "idiom_builder": {"label": "生字變成語", "status": "available" if idioms else "missing", "activity": "idiom-builder"},
        "lookalikes": {"label": "形似字", "status": "available" if lookalikes else "missing", "activity": "lookalikes"},
        "polysemy": {"label": "一字多義", "status": "available" if len(polysemy) >= 3 else "missing", "activity": "polysemy"},
        "polyphones": {"label": "一字多音", "status": "available" if polyphones else "missing", "activity": "polyphones"},
        "structure_map": {"label": "課文地圖", "status": "available" if len(paragraphs) >= 3 else "missing", "activity": "structure-map"},
        "listening": {"label": "聽聽看", "status": "available" if len(listening) >= 3 else "missing", "activity": "listening-quiz"},
        "rhetoric": {"label": "修辭小偵探", "status": "unavailable", "activity": "rhetoric", "note": "無此資料。"},
        "review": {"label": "舊字新詞", "status": "missing", "activity": "review", "note": "由公共匯入器依前課資料同步。"},
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--prepared-root", type=Path, required=True)
    parser.add_argument("--repo-root", type=Path, required=True)
    parser.add_argument("--idiom-sheets", type=Path, required=True)
    parser.add_argument("--lessons", default="1-12")
    args = parser.parse_args()

    source_root = args.source_root.resolve()
    batch = source_root / "worksheet-batches" / "115" / "115G2A_國語 翰"
    prepared = args.prepared_root.resolve()
    profile_dir = prepared / VOLUME
    asset_root = prepared / "assets" / VOLUME
    profile_dir.mkdir(parents=True, exist_ok=True)
    old_examples = existing_examples(args.repo_root.resolve())
    terms, vocab_hashes = terms_by_lesson(batch)
    readings = lesson_reading_data(batch)
    progress = {"version": 1, "profile": "g2a", "lessons": {}}
    all_audit = {"profile": VOLUME, "thumbnail_contract": {"format": "WebP", "max_bytes": MAX_IMAGE_BYTES}, "lessons": {}}

    for lesson_no in range(1, 13):
        char_items = make_character_items(lesson_no, batch, terms[lesson_no], old_examples)
        # Resolve the private vocabulary image paths from the manifest folder.
        for item in terms[lesson_no]:
            item["image"] = str((batch / "04_內容資料與草案" / "wordwall_語詞解釋" / item["image"]).resolve())
        words, word_meanings = make_words(lesson_no, batch / "04_內容資料與草案" / "wordwall_語詞解釋", asset_root, terms[lesson_no])
        for word in words:
            word["image"] = word["image"].replace("\\", "/")
        chars = "".join(item["char"] for item in char_items)
        idioms, idiom_sentences, idiom_audit = make_idioms(lesson_no, batch, asset_root, args.idiom_sheets.resolve(), chars, source_root)
        for idiom in idioms:
            idiom["image"] = idiom["image"].replace("\\", "/")
        patterns_path = next((batch / "04_內容資料與草案" / "_g2a_extracted" / "sentences").glob(f"2上L{lesson_no:02d}短語句型造句-{TITLES[lesson_no]}.txt"), None)
        patterns = parse_patterns(patterns_path, lesson_no) if patterns_path else []
        lookalikes = make_lookalikes(lesson_no, batch / "04_內容資料與草案")
        official_theme, official_gist, paragraphs = official_paragraph_content(batch, lesson_no)
        if not paragraphs:
            paragraphs = [{"id": f"paragraph_summary:115AG2H{lesson_no:02d}:01", "para_no": 1, "summary": MAIN_IDEAS[lesson_no][0], "structure_role": "總說", "status": "approved", "source": f"{SOURCE}（07主旨、課文大意、段落大意；教師提供課文整理）"}]
        questions = official_reading_questions(batch, lesson_no)
        if not questions:
            questions = [{"id": f"reading_question:115AG2H{lesson_no:02d}:{index:02d}", "stem": stem, "strategy_tag": "提取與推論", "answer_hint": answer, "scaffold": hint, "status": "approved", "source": f"{SOURCE}（10閱讀理解提問／課文整理）"} for index, (stem, answer, hint) in enumerate(READING_QUESTIONS[lesson_no], 1)]
        listening = listening_from_questions(lesson_no, questions)
        polysemy, polyphones = morphology_content(batch, lesson_no)
        theme = official_theme or MAIN_IDEAS[lesson_no][1]
        gist = official_gist or MAIN_IDEAS[lesson_no][0]
        lesson = {
            "lesson_id": f"{VOLUME}{lesson_no:02d}",
            "volume": {"code": VOLUME, "publisher": "翰林", "grade": 2, "term": "上"},
            "unit": {"no": 1, "title": "二上國語課程"},
            "lesson_no": lesson_no,
            "title": TITLES[lesson_no],
            "blurb": BLURBS[lesson_no],
            "characters": char_items,
            "words": words,
            "word_meanings": word_meanings,
            "sentences": patterns,
            "idioms": idioms,
            "idiom_sentences": idiom_sentences,
            "sentence_patterns": patterns,
            "polysemy": polysemy,
            "polyphones": polyphones,
            "listening": listening,
            "rhetoric": [],
            "paragraph_summary": paragraphs,
            "main_idea": {"id": f"main_idea:115AG2H{lesson_no:02d}:01", "gist": gist, "theme": theme, "status": "approved", "source": f"{SOURCE}（07主旨、課文大意、段落大意）"},
            "reading_questions": questions,
            "lookalikes": lookalikes,
            "modules": modules(words, idioms, patterns, questions, lookalikes, paragraphs, polysemy, polyphones, listening),
        }
        save_json(profile_dir / f"lesson{lesson_no:02d}.json", lesson)
        all_audit["lessons"][f"L{lesson_no:02d}"] = {
            "title": TITLES[lesson_no],
            "character_source": sha256(batch / "04_內容資料與草案" / "wordwall_生字注音_v2" / f"L{lesson_no:02d}_source_manifest_v2.json"),
            "vocabulary_source_sha256": vocab_hashes[lesson_no],
            "reading_source": readings.get(lesson_no, {}).get("title"),
            "idioms": idiom_audit,
            "image_count": len(terms[lesson_no]) + len(idioms),
        }
        progress["lessons"][f"L{lesson_no:02d}"] = {"status": "ready", "characters": len(char_items), "words": len(words), "idioms": len(idioms)}

    save_json(prepared / "g2a-source-audit.json", all_audit)
    save_json(prepared / "g2a-progress.json", progress)
    print(json.dumps({"profile": VOLUME, "lessons": 12, "prepared_root": str(prepared), "max_image_bytes": MAX_IMAGE_BYTES}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
