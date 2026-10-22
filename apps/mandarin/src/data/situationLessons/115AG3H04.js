// 公開資料只保留原句索引與雜湊；原文由 classroomKey 解密。
const FIRST_PERSON_LESSON = {
  "lessonId": "115AG3H04",
  "version": 9,
  "title": "食堂裡的閱讀線索",
  "source": {
    "text": "翰林115三上官方課文Word，第4課〈水滾了〉，王宗仁",
    "questions": "官方15閱讀理解提問：第1、3、4、6、7題",
    "strategy": "郭富華老師文本分析提問單（教用）：事件背景、經過與解決、結果與啟示",
    "checked": "2026-10-22"
  },
  "scenes": [
    {
      "id": "welcome",
      "title": "食堂的早晨",
      "place": "門口 → 工作角",
      "goal": "點風鈴，再搬三根木柴。",
      "view": "entrance",
      "alternateView": "work",
      "viewLabel": "看工作角",
      "experience": {
        "mood": "日常",
        "caption": "你是跟著康康一起試的小幫手。",
        "action": "環顧食堂",
        "reflection": "點風鈴，再搬三根木柴。",
        "observeCaption": null,
        "afterCaption": null
      },
      "clues": [
        {
          "id": "paragraph",
          "label": "第1段",
          "object": "bell",
          "note": "觀察動作，再完整閱讀這一段。",
          "refs": [
            {
              "para": 1,
              "sentences": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8
              ],
              "sha": [
                "2761b05e",
                "0a3f5625",
                "6233f9bb",
                "47a06f75",
                "fd92befa",
                "f9fb8a47",
                "59ee1d82",
                "5df00739",
                "67a25863"
              ]
            }
          ]
        }
      ],
      "act": 1,
      "beats": {"intro": [{"para": 1, "sentences": [0, 1, 2, 3]}], "act": {"demo": false}, "result": {"duration": 1800, "view": "work"}, "read": [{"para": 1, "sentences": [4, 5, 6, 7, 8]}]},
      "stationType": "challenge",
      "questions": [
        {
          "id": "division",
          "kind": "找出訊息",
          "basis": [
            "reading_question:04:01"
          ],
          "stem": "按照課文，師徒原本怎麼分工？",
          "options": [
            "師傅燒水做菜，康康撿柴",
            "師傅撿柴，康康燒水做菜",
            "師傅做菜撿柴，康康燒水"
          ],
          "answer": 0,
          "why": [
            "你找到了兩人的工作，沒有把分工交換。",
            "再讀年長的師傅與年輕的徒弟各負責哪件事。",
            "康康原本只負責一種工作，再找找「只負責」後面的詞。"
          ],
          "hints": [
            "先找介紹兩位人物工作的那一句。",
            "把「師傅」和「徒弟康康」分開看，各找一個動作。",
            "重看標記的分工句，逐項核對選項中的人物與動作。"
          ],
          "explanation": "你找對了：師傅燒水做菜，康康撿柴。",
          "type": "choice",
          "pirls": "擷取",
          "refs": [
            {
              "para": 1,
              "sentences": [
                2,
                3,
                4,
                5
              ],
              "sha": [
                "6233f9bb",
                "47a06f75",
                "fd92befa",
                "f9fb8a47"
              ]
            },
            {
              "para": 1,
              "sentences": [
                6,
                7,
                8
              ],
              "sha": [
                "59ee1d82",
                "5df00739",
                "67a25863"
              ]
            }
          ]
        }
      ],
      "operation": {
        "kind": "collect",
        "steps": [
          "bell",
          "wood-1",
          "wood-2",
          "wood-3"
        ]
      }
    },
    {
      "id": "ladle",
      "title": "鍋旁的嘗試",
      "place": "鍋邊 → 舀水處",
      "goal": "舀起水，再倒回鍋中。",
      "view": "pot",
      "alternateView": "ladle",
      "viewLabel": "看長柄勺",
      "experience": {
        "mood": "慌張",
        "caption": "你是跟著康康一起試的小幫手。",
        "action": "觀察康康舀水",
        "reflection": "舀起水，再倒回鍋中。",
        "observeCaption": "看康康來回舀水。鍋裡的水有停下來嗎？",
        "afterCaption": "來回舀水，水還是在沸騰。接下來能往哪裡找原因？"
      },
      "clues": [
        {
          "id": "paragraph",
          "label": "第2段",
          "object": "pot",
          "note": "觀察動作，再完整閱讀這一段。",
          "refs": [
            {
              "para": 2,
              "sentences": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11
              ],
              "sha": [
                "c667349f",
                "4e11e7ab",
                "50b80674",
                "04ccac9e",
                "5e3c1a28",
                "6979bde3",
                "30f9c9f4",
                "2dc7dca3",
                "0e9d1562",
                "3e55eae9",
                "0f2390f2",
                "28206697"
              ]
            }
          ]
        }
      ],
      "act": 2,
      "beats": {"intro": [{"para": 2, "sentences": [0, 1, 2, 3]}], "act": {"demo": false}, "result": {"duration": 1800, "view": "pot"}, "read": [{"para": 2, "sentences": [4, 5, 6, 7, 8, 9, 10, 11]}]},
      "stationType": "challenge",
      "questions": [
        {
          "id": "action",
          "kind": "理解心情",
          "basis": [
            "reading_question:04:02"
          ],
          "stem": "試了三次，水還在滾。請替康康選一張表情卡。",
          "options": [
            "十分慌張",
            "悠閒",
            "放心"
          ],
          "answer": 0,
          "why": [
            "你把「十分慌張」和跑到鍋邊、反覆舀水的動作連起來了。",
            "原文說他跑到鍋旁，又反覆舀水；這不像悠閒觀察。",
            "康康沒有站著等，他已經急著自己想辦法了。"
          ],
          "hints": [
            "找第2段直接描寫心情的詞。",
            "把「師傅在接待客人」和康康接下來的動作連起來看。",
            "比較「跑到鍋旁、舀了好多次」與三個選項中的心情是否一致。"
          ],
          "explanation": "原文明說康康「十分慌張」。他把水舀起來再倒回去，急著處理眼前的情況；水仍在沸騰。",
          "extraEvidence": [
            {
              "para": 2,
              "sentences": [
                4,
                5
              ],
              "sha": [
                "5e3c1a28",
                "6979bde3"
              ]
            }
          ],
          "type": "emotion",
          "pirls": "推論",
          "refs": [
            {
              "para": 2,
              "sentences": [
                0,
                1,
                2,
                3,
                4,
                5
              ],
              "sha": [
                "c667349f",
                "4e11e7ab",
                "50b80674",
                "04ccac9e",
                "5e3c1a28",
                "6979bde3"
              ]
            },
            {
              "para": 2,
              "sentences": [
                4,
                5
              ],
              "sha": [
                "5e3c1a28",
                "6979bde3"
              ]
            },
            {
              "para": 2,
              "sentences": [
                6,
                7,
                8,
                9
              ],
              "sha": [
                "30f9c9f4",
                "2dc7dca3",
                "0e9d1562",
                "3e55eae9"
              ]
            }
          ],
          "images": [
            "anxious",
            "relaxed",
            "relieved"
          ]
        }
      ],
      "operation": {
        "kind": "scoop",
        "steps": ["scoop", "scoop", "scoop"]
      }
    },
    {
      "id": "cause",
      "title": "往鍋底找原因",
      "place": "水面 → 爐口",
      "goal": "看水面、勺子和鍋下。",
      "view": "pot",
      "alternateView": "fire",
      "viewLabel": "看爐口柴火",
      "experience": {
        "mood": "找原因",
        "caption": "你是跟著康康一起試的小幫手。",
        "action": "觀察舀水後的結果",
        "reflection": "看水面、勺子和鍋下。",
        "observeCaption": null,
        "afterCaption": "來回舀水，水還是在沸騰。接下來能往哪裡找原因？"
      },
      "clues": [
        {
          "id": "paragraph",
          "label": "第3段",
          "object": "pot",
          "note": "觀察動作，再完整閱讀這一段。",
          "refs": [
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
                13
              ],
              "sha": [
                "44cffcd0",
                "a64002b2",
                "a36ea753",
                "f3c2eb87",
                "6620976f",
                "3869c3b1",
                "b60df79a",
                "ba3883c3",
                "aba0dc99",
                "4258a71a",
                "532f8b5b",
                "4c4806ed",
                "e1ffefc2",
                "76a9cbe3"
              ]
            }
          ]
        }
      ],
      "act": 3,
      "beats": {"intro": [], "act": {"demo": false}, "result": {"duration": 1800, "view": "fire"}, "read": [{"para": 3, "sentences": [0, 1, 2, 3, 4, 5, 6, 7, 8]}]},
      "stationType": "challenge",
      "questions": [
        {
          "id": "cause",
          "kind": "推論原因",
          "basis": [
            "reading_question:04:03"
          ],
          "stem": "舀了好多次，水為什麼還在沸騰？",
          "options": [
            "因為木柴背回來的數量太少",
            "因為師傅在門口接待著客人",
            "因為鍋底的柴火還繼續燃燒"
          ],
          "answer": 2,
          "why": [
            "課文沒有把原因歸在背回的木柴數量；再看當時鍋下的情況。",
            "師傅接待客人是當時的情況；什麼在持續讓鍋子受熱呢？",
            "你把水面的結果和鍋底持續燃燒的柴火連起來了。"
          ],
          "hints": [
            "除了水面，再往鍋子下面找。",
            "想一想：舀水後，有沒有改變讓水受熱的東西？",
            "合讀第2段的結果與第3段鍋下的描述，找出仍在作用的原因。"
          ],
          "explanation": "第2段說水仍沸騰，第3段說鍋下的木柴燒得火紅。舀水沒有改變持續加熱的原因。",
          "type": "choice",
          "pirls": "推論",
          "refs": [
            {
              "para": 2,
              "sentences": [
                10,
                11
              ],
              "sha": [
                "0f2390f2",
                "28206697"
              ]
            },
            {
              "para": 2,
              "sentences": [
                10,
                11
              ],
              "sha": [
                "0f2390f2",
                "28206697"
              ]
            },
            {
              "para": 3,
              "sentences": [
                3,
                4,
                5,
                6,
                7,
                8
              ],
              "sha": [
                "f3c2eb87",
                "6620976f",
                "3869c3b1",
                "b60df79a",
                "ba3883c3",
                "aba0dc99"
              ]
            }
          ]
        }
      ],
      "operation": {
        "kind": "detect",
        "steps": [
          "pot",
          "ladle",
          "fire"
        ]
      }
    },
    {
      "id": "root",
      "title": "找出解決的關鍵",
      "place": "工具旁 → 閱讀筆記",
      "goal": "看示範，再把三根柴拖出來。",
      "view": "tool",
      "alternateView": "notes",
      "viewLabel": "看閱讀筆記",
      "experience": {
        "mood": "用心理解",
        "caption": "你是跟著康康一起試的小幫手。",
        "action": "觀察師傅的方法",
        "reflection": "看示範，再把三根柴拖出來。",
        "observeCaption": null,
        "afterCaption": null
      },
      "clues": [
        {
          "id": "paragraph",
          "label": "第4段",
          "object": "tool",
          "note": "觀察動作，再完整閱讀這一段。",
          "refs": [
            {
              "para": 4,
              "sentences": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9
              ],
              "sha": [
                "edd44301",
                "a3d24398",
                "16d6282e",
                "c9418dd2",
                "cbf41dca",
                "7e3d6777",
                "f52f4492",
                "abd01276",
                "05823090",
                "bf1a4eee"
              ]
            }
          ]
        }
      ],
      "act": 4,
      "beats": {"intro": [{"para": 3, "sentences": [9, 10]}], "act": {"demo": true}, "result": {"duration": 1800, "view": "pot"}, "read": [{"para": 3, "sentences": [11, 12, 13]}, {"para": 4, "sentences": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}]},
      "stationType": "challenge",
      "questions": [
        {
          "id": "sequence",
          "type": "order",
          "kind": "事件排序",
          "pirls": "擷取",
          "stem": "依故事先後，點選三張事件卡。",
          "options": [
            "康康反覆舀水",
            "師傅抽出部分柴火",
            "水不再沸騰"
          ],
          "answer": [
            0,
            1,
            2
          ],
          "why": [
            "先辨認康康的嘗試，再接師傅的方法和結果。",
            "師傅的方法在康康嘗試之後。",
            "水面的變化是處理柴火之後的結果。"
          ],
          "hints": [
            "先找誰先嘗試。",
            "把嘗試、解決方法、結果接起來。",
            "回到第2至4段，核對動作的先後。"
          ],
          "explanation": "把事件按先後排列，才能比較兩種方法。",
          "refs": [
            {
              "para": 2,
              "sentences": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11
              ],
              "sha": [
                "c667349f",
                "4e11e7ab",
                "50b80674",
                "04ccac9e",
                "5e3c1a28",
                "6979bde3",
                "30f9c9f4",
                "2dc7dca3",
                "0e9d1562",
                "3e55eae9",
                "0f2390f2",
                "28206697"
              ]
            },
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
                13
              ],
              "sha": [
                "44cffcd0",
                "a64002b2",
                "a36ea753",
                "f3c2eb87",
                "6620976f",
                "3869c3b1",
                "b60df79a",
                "ba3883c3",
                "aba0dc99",
                "4258a71a",
                "532f8b5b",
                "4c4806ed",
                "e1ffefc2",
                "76a9cbe3"
              ]
            },
            {
              "para": 4,
              "sentences": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9
              ],
              "sha": [
                "edd44301",
                "a3d24398",
                "16d6282e",
                "c9418dd2",
                "cbf41dca",
                "7e3d6777",
                "f52f4492",
                "abd01276",
                "05823090",
                "bf1a4eee"
              ]
            }
          ]
        }
      ],
      "operation": {
        "kind": "extract",
        "steps": [
          "demo",
          "wood-1",
          "wood-2",
          "wood-3"
        ]
      }
    }
  ],
  "gateTitle": "走進食堂，探索課文",
  "introduction": "你是跟著康康一起試的小幫手。親手操作，看看結果，再讀原句。",
  "review": [
    [
      "康康遇到什麼？",
      "鍋裡的水持續沸騰，師傅正在忙。"
    ],
    [
      "為什麼慌張？",
      "從原文明說的心情與反覆舀水的動作找依據。"
    ],
    [
      "怎麼解決？",
      "師傅抽出一些柴火，改變持續加熱的原因。"
    ],
    [
      "學到什麼？",
      "比較兩種方法，處理產生問題的根本。"
    ]
  ],
  "idiomRefs": [
    {
      "para": 4,
      "sentences": [
        1,
        2,
        3,
        4,
        5
      ],
      "sha": [
        "a3d24398",
        "16d6282e",
        "c9418dd2",
        "cbf41dca",
        "7e3d6777"
      ]
    }
  ]
};
// Illustration positions in source-image percent. Keep dots beside evidence, away from faces/hands.
const FIRST_PERSON_ILLUSTRATIONS = {
  1: { images: ['act1-entrance.webp'], hotspots: { bell: [29, 16], wood: [49, 52] }, views: { entrance: .52, work: .65, side: .80 } },
  2: { images: ['act2-clean.webp'], hotspots: { pot: [64, 69], ladle: [59, 67] }, views: { pot: .65, ladle: .30, side: .15 }, effects: { bubble: [65, 68], steam: [70, 54] } },
  3: { images: ['act3-looking-down.webp'], hotspots: { pot: [62, 30], fire: [59, 68] }, views: { pot: .55, fire: .80, side: .20 }, effects: { fire: [59, 66] } },
  4: { images: ['act4-draw-wood.webp', 'act4-small-fire.webp'], hotspots: { tool: [51, 69], notes: [31, 41], fire: [73, 66], master: [37, 54], wood: [62, 80], pot: [74, 41] }, views: { tool: .55, notes: .20, fire: .70, master: .35, work: .35, pot: .70, side: .15 }, effects: { fire: [74, 70], steam: [75, 35], bubble: [74, 41] } },
};

export const groundPile = [[59,80],[62,81],[60.5,78.5]];
export const outsidePile = [[54,79],[58,81.5],[62,78.5]];
export const operationObjects = {
  1: [['風鈴',null,29.5,17,'bell',5,1],
    ['第1根木柴','wood',24,79,'wood-1',9,.24],
    ['第2根木柴','wood',31,81,'wood-2',10,.24],
    ['第3根木柴','wood',35,77,'wood-3',8.5,.24],
    ['柴堆',null,61,80,'pile',9,.3,true]],
  2: [['勺子','ladle-empty',59,67,'ladle',18,.78], ['水面',null,64,69,'water',20,.22,true]],
  3: [['水面',null,62,30,'pot',15,.3], ['勺子','ladle-empty',77,43,'ladle',12,.78], ['火紅木柴','wood-burning',59,68,'fire',12,.35]],
  4: [['師傅示範','tongs',51,59,'demo',16,.3],
    ['第1根柴火','wood-burning',71,71,'wood-1',7,.35],
    ['第2根柴火','wood-burning',74,76,'wood-2',8,.35],
    ['第3根柴火','wood-burning',72,79,'wood-3',6.5,.35]],
};
export const woodAngle = (act, index) => (act === 1 ? [-14,11,-6] : [-19,22,-9])[index];

// Legacy choreography is an effect profile: preserve the approved timing and geometry.
FIRST_PERSON_LESSON.schemaVersion = 1;
FIRST_PERSON_LESSON.assetBase = 'assets/first-person/115AG3H04/';
FIRST_PERSON_LESSON.paragraphCounts = [9, 12, 14, 10];
FIRST_PERSON_LESSON.sentenceCount = 45;
FIRST_PERSON_LESSON.ui = {
  enter: '打開課文，進入食堂', return: '回到食堂', speaker: '師傅', character: '康康',
  context: '人物、擺設和聲音為閱讀示意。你是跟著康康一起試的小幫手；文字明說的心情才當作事實。',
  safety: '不計時、不扣分；不記學生姓名，不納入原有成績。場景不要求實際操作火或熱水。',
};
FIRST_PERSON_LESSON.ending = { title: '釜底抽薪', refs: FIRST_PERSON_LESSON.idiomRefs };
FIRST_PERSON_LESSON.meter = {
  states: ['平靜', '有點慌張', '慌張', '十分慌張', '用心記住'],
  // Terms are verified against unlocked text by validateUnlockedLesson, never copied sentences.
  faces: ['🙂', '😟', '😟', '😟', '🙂'],
  read: { para: 4, n: 7, state: 4, level: 0 },
};
const types = ['dragToTarget', 'scoopGesture', 'observe', 'toolGrab'];
const levels = [[0,0,0,0,0], [1,2,3,3], [3,3,3,3], [3,3,2,1,0]];
for (const scene of FIRST_PERSON_LESSON.scenes) {
  scene.assetBase = FIRST_PERSON_LESSON.assetBase;
  scene.art = FIRST_PERSON_ILLUSTRATIONS[scene.act];
  scene.art.fallback = 'cooking';
  scene.art.aspect = [2400, 1024];
  scene.art.focus = scene.act === 4 ? { landscape: {49:46,69:46}, portrait: {49:30} } : {};
  scene.art.plugins = scene.act === 1 ? ['chimeWind'] : [];
  scene.art.freezeFirstFrame = scene.act === 2;
  scene.art.stateImages = scene.act === 4;
  scene.operation.type = types[scene.act - 1];
  scene.operation.profile = `cooking-${scene.operation.type}`;
  scene.operation.objects = operationObjects[scene.act].map(([label,sprite,x,y,action,width,ratio,target],i) => ({label,sprite,x,y,action,width,ratio,target:Boolean(target),angle:action.startsWith('wood-')?woodAngle(scene.act,Number(action.slice(-1))-1):0}));
  scene.operation.collect = scene.operation.steps.filter(a => a.startsWith('wood-'));
  scene.operation.heat = scene.act === 4 ? [1,1,2/3,1/3,0] : scene.operation.steps.map(() => 1).concat(1);
  scene.meter = levels[scene.act - 1].map(level => ({state:level,level}));
  scene.questions.forEach(q => {
    q.operationType = q.type === 'order' ? 'orderCards' : 'chooseCard';
    if (q.type === 'order') q.initialOrder = [2,0,1];
  });
  const refs = FIRST_PERSON_LESSON.scenes.flatMap(s => s.clues.flatMap(c => c.refs));
  for (const ref of [...scene.beats.intro, ...scene.beats.read]) {
    ref.sha = ref.sentences.map(n => refs.find(r => r.para === ref.para && r.sentences.includes(n)).sha[refs.find(r => r.para === ref.para && r.sentences.includes(n)).sentences.indexOf(n)]);
  }
}
// 回補策略：原句仍只用索引與雜湊；保留既有 cooking 操作與素材。
const strategyBackfill = {
  "version": 10,
  "meter": {
    "states": [
      "分工合作",
      "十分慌張",
      "十分慌張",
      "十分慌張",
      "用心的記住"
    ],
    "faces": [
      "🙂",
      "😟",
      "😟",
      "😟",
      "🙂"
    ],
    "read": {
      "para": 4,
      "n": 7,
      "state": 4,
      "level": 0
    }
  },
  "scenes": [
    {
      "beats": {
        "intro": [
          {
            "para": 1,
            "sentences": [
              0,
              1,
              2,
              3
            ],
            "sha": [
              "2761b05e",
              "0a3f5625",
              "6233f9bb",
              "47a06f75"
            ]
          }
        ],
        "act": {
          "demo": false
        },
        "result": {
          "duration": 1800,
          "view": "work"
        },
        "read": [
          {
            "para": 1,
            "sentences": [
              4,
              5,
              6,
              7,
              8
            ],
            "sha": [
              "fd92befa",
              "f9fb8a47",
              "59ee1d82",
              "5df00739",
              "67a25863"
            ]
          }
        ]
      },
      "timeline": [
        {
          "kind": "intro",
          "refs": [
            {
              "para": 1,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "2761b05e",
                "0a3f5625",
                "6233f9bb",
                "47a06f75"
              ]
            }
          ]
        },
        {
          "kind": "act"
        },
        {
          "kind": "result"
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 1,
              "sentences": [
                4,
                5,
                6,
                7,
                8
              ],
              "sha": [
                "fd92befa",
                "f9fb8a47",
                "59ee1d82",
                "5df00739",
                "67a25863"
              ]
            }
          ]
        },
        {
          "kind": "question"
        }
      ],
      "questions": [
        {
          "id": "division",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "kind": "摘要",
          "pirls": "統整",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "師徒分工，康康負責撿柴",
            "門口掛著風鈴",
            "樹林是青綠色的"
          ],
          "answer": 0,
          "summaryImages": [
            "act1-entrance.webp",
            "act1-entrance.webp",
            "act1-entrance.webp"
          ],
          "why": [
            "把這一幕的事情和結果連起來，就是重點。",
            "這是細節，不是最重要的事；再想想整幕發生什麼。",
            "這是細節，不是最重要的事；再想想整幕發生什麼。"
          ],
          "hints": [
            "回想這一幕的困難或任務。",
            "找出做了什麼，以及結果如何。",
            "選能把事情和結果連起來的圖卡。"
          ],
          "explanation": "把這一幕的事情和結果連起來，就是重點。",
          "refs": [
            {
              "para": 1,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "2761b05e",
                "0a3f5625",
                "6233f9bb",
                "47a06f75"
              ]
            },
            {
              "para": 1,
              "sentences": [
                4,
                5,
                6,
                7,
                8
              ],
              "sha": [
                "fd92befa",
                "f9fb8a47",
                "59ee1d82",
                "5df00739",
                "67a25863"
              ]
            }
          ]
        }
      ]
    },
    {
      "beats": {
        "intro": [
          {
            "para": 2,
            "sentences": [
              0,
              1,
              2,
              3
            ],
            "sha": [
              "c667349f",
              "4e11e7ab",
              "50b80674",
              "04ccac9e"
            ]
          }
        ],
        "act": {
          "demo": false
        },
        "result": {
          "duration": 1800,
          "view": "pot"
        },
        "read": [
          {
            "para": 2,
            "sentences": [
              4,
              5,
              6,
              7,
              8,
              9,
              10,
              11
            ],
            "sha": [
              "5e3c1a28",
              "6979bde3",
              "30f9c9f4",
              "2dc7dca3",
              "0e9d1562",
              "3e55eae9",
              "0f2390f2",
              "28206697"
            ]
          }
        ]
      },
      "timeline": [
        {
          "kind": "intro",
          "refs": [
            {
              "para": 2,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "c667349f",
                "4e11e7ab",
                "50b80674",
                "04ccac9e"
              ]
            }
          ]
        },
        {
          "kind": "act"
        },
        {
          "kind": "result"
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 2,
              "sentences": [
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11
              ],
              "sha": [
                "5e3c1a28",
                "6979bde3",
                "30f9c9f4",
                "2dc7dca3",
                "0e9d1562",
                "3e55eae9",
                "0f2390f2",
                "28206697"
              ]
            }
          ]
        },
        {
          "kind": "strategy",
          "id": "panic-clues",
          "hideOperations": true
        },
        {
          "kind": "question"
        }
      ],
      "strategies": [
        {
          "id": "panic-clues",
          "type": "emotionClue",
          "prompt": "點康康的臉與舀水動作，找心情線索。",
          "options": [
            {
              "label": "康康的臉",
              "x": 45,
              "y": 35,
              "face": {
                "width": 9,
                "height": 24
              },
              "markerOffset": [
                7,
                0
              ],
              "states": [
                3
              ],
              "refs": [
                {
                  "para": 2,
                  "sentences": [
                    5
                  ],
                  "sha": [
                    "6979bde3"
                  ]
                }
              ]
            },
            {
              "label": "舀水的勺子",
              "x": 59,
              "y": 67,
              "states": [
                3
              ],
              "refs": [
                {
                  "para": 2,
                  "sentences": [
                    5,
                    6,
                    7,
                    8,
                    9
                  ],
                  "sha": [
                    "6979bde3",
                    "30f9c9f4",
                    "2dc7dca3",
                    "0e9d1562",
                    "3e55eae9"
                  ]
                }
              ]
            }
          ],
          "answer": [
            0,
            1
          ],
          "refs": [
            {
              "para": 2,
              "sentences": [
                5,
                6,
                7,
                8,
                9
              ],
              "sha": [
                "6979bde3",
                "30f9c9f4",
                "2dc7dca3",
                "0e9d1562",
                "3e55eae9"
              ]
            }
          ],
          "hint": "再看看康康的臉和舀水的動作。"
        }
      ],
      "questions": [
        {
          "id": "action",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "kind": "摘要",
          "pirls": "統整",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "康康反覆舀水，水仍在滾",
            "康康背著木柴回來",
            "師傅在接待客人"
          ],
          "answer": 0,
          "summaryImages": [
            "act2-clean.webp",
            "act2-clean.webp",
            "act2-clean.webp"
          ],
          "why": [
            "把這一幕的事情和結果連起來，就是重點。",
            "這是細節，不是最重要的事；再想想整幕發生什麼。",
            "這是細節，不是最重要的事；再想想整幕發生什麼。"
          ],
          "hints": [
            "回想這一幕的困難或任務。",
            "找出做了什麼，以及結果如何。",
            "選能把事情和結果連起來的圖卡。"
          ],
          "explanation": "把這一幕的事情和結果連起來，就是重點。",
          "refs": [
            {
              "para": 2,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "c667349f",
                "4e11e7ab",
                "50b80674",
                "04ccac9e"
              ]
            },
            {
              "para": 2,
              "sentences": [
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11
              ],
              "sha": [
                "5e3c1a28",
                "6979bde3",
                "30f9c9f4",
                "2dc7dca3",
                "0e9d1562",
                "3e55eae9",
                "0f2390f2",
                "28206697"
              ]
            }
          ]
        }
      ]
    },
    {
      "beats": {
        "intro": [],
        "act": {
          "demo": false
        },
        "result": {
          "duration": 1800,
          "view": "fire"
        },
        "read": [
          {
            "para": 3,
            "sentences": [
              0,
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8
            ],
            "sha": [
              "44cffcd0",
              "a64002b2",
              "a36ea753",
              "f3c2eb87",
              "6620976f",
              "3869c3b1",
              "b60df79a",
              "ba3883c3",
              "aba0dc99"
            ]
          }
        ]
      },
      "timeline": [
        {
          "kind": "act"
        },
        {
          "kind": "result"
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8
              ],
              "sha": [
                "44cffcd0",
                "a64002b2",
                "a36ea753",
                "f3c2eb87",
                "6620976f",
                "3869c3b1",
                "b60df79a",
                "ba3883c3",
                "aba0dc99"
              ]
            }
          ]
        },
        {
          "kind": "strategy",
          "id": "heat-source",
          "hideOperations": true
        },
        {
          "kind": "question"
        }
      ],
      "strategies": [
        {
          "id": "heat-source",
          "type": "causeEffect",
          "prompt": "水為什麼一直滾？點出原因。",
          "options": [
            {
              "label": "灶下燒得火紅的木柴",
              "x": 59,
              "y": 68,
              "refs": [
                {
                  "para": 3,
                  "sentences": [
                    7,
                    8
                  ],
                  "sha": [
                    "ba3883c3",
                    "aba0dc99"
                  ]
                }
              ]
            }
          ],
          "answer": [
            0
          ],
          "refs": [
            {
              "para": 3,
              "sentences": [
                3,
                4,
                5,
                6,
                7,
                8
              ],
              "sha": [
                "f3c2eb87",
                "6620976f",
                "3869c3b1",
                "b60df79a",
                "ba3883c3",
                "aba0dc99"
              ]
            }
          ],
          "result": [
            62,
            30
          ],
          "hint": "再看看鍋子下面。",
          "explanation": "柴火繼續燃燒，水就繼續受熱。"
        }
      ],
      "questions": [
        {
          "id": "cause",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "kind": "摘要",
          "pirls": "統整",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "師傅笑著說話",
            "師傅走回鍋邊",
            "康康觀察灶下，找到持續加熱的柴火"
          ],
          "answer": 2,
          "summaryImages": [
            "act3-looking-down.webp",
            "act3-looking-down.webp",
            "act3-looking-down.webp"
          ],
          "why": [
            "這是細節，不是最重要的事；再想想整幕發生什麼。",
            "這是細節，不是最重要的事；再想想整幕發生什麼。",
            "把這一幕的事情和結果連起來，就是重點。"
          ],
          "hints": [
            "回想這一幕的困難或任務。",
            "找出做了什麼，以及結果如何。",
            "選能把事情和結果連起來的圖卡。"
          ],
          "explanation": "把這一幕的事情和結果連起來，就是重點。",
          "refs": [
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8
              ],
              "sha": [
                "44cffcd0",
                "a64002b2",
                "a36ea753",
                "f3c2eb87",
                "6620976f",
                "3869c3b1",
                "b60df79a",
                "ba3883c3",
                "aba0dc99"
              ]
            }
          ]
        }
      ]
    },
    {
      "beats": {
        "intro": [
          {
            "para": 3,
            "sentences": [
              9
            ],
            "sha": [
              "4258a71a"
            ]
          }
        ],
        "act": {
          "demo": true
        },
        "result": {
          "duration": 1800,
          "view": "pot"
        },
        "read": [
          {
            "para": 3,
            "sentences": [
              10,
              11,
              12,
              13
            ],
            "sha": [
              "532f8b5b",
              "4c4806ed",
              "e1ffefc2",
              "76a9cbe3"
            ]
          },
          {
            "para": 4,
            "sentences": [
              0,
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8,
              9
            ],
            "sha": [
              "edd44301",
              "a3d24398",
              "16d6282e",
              "c9418dd2",
              "cbf41dca",
              "7e3d6777",
              "f52f4492",
              "abd01276",
              "05823090",
              "bf1a4eee"
            ]
          }
        ]
      },
      "timeline": [
        {
          "kind": "intro",
          "refs": [
            {
              "para": 3,
              "sentences": [
                9
              ],
              "sha": [
                "4258a71a"
              ]
            }
          ]
        },
        {
          "kind": "strategy",
          "id": "master-predict",
          "hideOperations": true
        },
        {
          "kind": "act"
        },
        {
          "kind": "result"
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 3,
              "sentences": [
                10,
                11,
                12,
                13
              ],
              "sha": [
                "532f8b5b",
                "4c4806ed",
                "e1ffefc2",
                "76a9cbe3"
              ]
            },
            {
              "para": 4,
              "sentences": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9
              ],
              "sha": [
                "edd44301",
                "a3d24398",
                "16d6282e",
                "c9418dd2",
                "cbf41dca",
                "7e3d6777",
                "f52f4492",
                "abd01276",
                "05823090",
                "bf1a4eee"
              ]
            }
          ]
        },
        {
          "kind": "question"
        }
      ],
      "strategies": [
        {
          "id": "master-predict",
          "type": "predict",
          "prompt": "師傅會怎麼做？",
          "options": [
            "先看看鍋裡的水",
            "先問康康剛才做了什麼",
            "我不確定"
          ],
          "refs": [
            {
              "para": 3,
              "sentences": [
                10,
                11,
                12,
                13
              ],
              "sha": [
                "532f8b5b",
                "4c4806ed",
                "e1ffefc2",
                "76a9cbe3"
              ]
            }
          ],
          "revealAt": {
            "para": 3,
            "n": 10
          }
        }
      ],
      "questions": [
        {
          "id": "sequence",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "kind": "摘要",
          "pirls": "統整",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "師傅移開柴火，康康學會找問題根本",
            "師傅拍拍康康的背",
            "康康點點頭"
          ],
          "answer": 0,
          "summaryImages": [
            "act4-draw-wood.webp",
            "act4-small-fire.webp",
            "act4-small-fire.webp"
          ],
          "why": [
            "把這一幕的事情和結果連起來，就是重點。",
            "這是細節，不是最重要的事；再想想整幕發生什麼。",
            "這是細節，不是最重要的事；再想想整幕發生什麼。"
          ],
          "hints": [
            "回想這一幕的困難或任務。",
            "找出做了什麼，以及結果如何。",
            "選能把事情和結果連起來的圖卡。"
          ],
          "explanation": "把這一幕的事情和結果連起來，就是重點。",
          "refs": [
            {
              "para": 3,
              "sentences": [
                9
              ],
              "sha": [
                "4258a71a"
              ]
            },
            {
              "para": 3,
              "sentences": [
                10,
                11,
                12,
                13
              ],
              "sha": [
                "532f8b5b",
                "4c4806ed",
                "e1ffefc2",
                "76a9cbe3"
              ]
            },
            {
              "para": 4,
              "sentences": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9
              ],
              "sha": [
                "edd44301",
                "a3d24398",
                "16d6282e",
                "c9418dd2",
                "cbf41dca",
                "7e3d6777",
                "f52f4492",
                "abd01276",
                "05823090",
                "bf1a4eee"
              ]
            }
          ]
        }
      ]
    }
  ]
};
FIRST_PERSON_LESSON.version = strategyBackfill.version;
FIRST_PERSON_LESSON.meter = strategyBackfill.meter;
FIRST_PERSON_LESSON.scenes.forEach((scene, i) => Object.assign(scene, strategyBackfill.scenes[i]));
// Reuse the existing full-bleed scooping frame for visual evidence; no new artwork.
FIRST_PERSON_LESSON.scenes[1].art.images.push('act2-scoop-3.webp');
FIRST_PERSON_LESSON.scenes[1].timeline.find(e => e.id === 'panic-clues').imageIndex = 1;
Object.assign(FIRST_PERSON_LESSON.scenes[1].strategies[0].options[1], {x:59,y:54});
FIRST_PERSON_LESSON.scenes.forEach(scene => {
  const q = scene.questions[0];
  q.summaryImages = ['sprites/chime.webp', 'sprites/wood.webp', 'sprites/ladle-empty.webp'];
  q.summaryImages[q.answer] = scene.art.images[0];
});
export default FIRST_PERSON_LESSON;
