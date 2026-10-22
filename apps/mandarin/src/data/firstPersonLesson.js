// 公開資料只保留原句索引與雜湊；原文由 classroomKey 解密。
export const FIRST_PERSON_LESSON = {
  "lessonId": "115AG3H04",
  "version": 8,
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
      "goal": "點風鈴，再把三根木柴移到柴堆。",
      "view": "entrance",
      "alternateView": "work",
      "viewLabel": "看工作角",
      "experience": {
        "mood": "日常",
        "caption": "你是跟著康康一起試的小幫手。",
        "action": "環顧食堂",
        "reflection": "點風鈴，再把三根木柴移到柴堆。",
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
      "goal": "拿起勺子試試看，舀起後倒回鍋中三次。",
      "view": "pot",
      "alternateView": "ladle",
      "viewLabel": "看長柄勺",
      "experience": {
        "mood": "慌張",
        "caption": "你是跟著康康一起試的小幫手。",
        "action": "觀察康康舀水",
        "reflection": "拿起勺子試試看，舀起後倒回鍋中三次。",
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
      "goal": "先看看水面和勺子，再找鍋下的線索。",
      "view": "pot",
      "alternateView": "fire",
      "viewLabel": "看爐口柴火",
      "experience": {
        "mood": "找原因",
        "caption": "你是跟著康康一起試的小幫手。",
        "action": "觀察舀水後的結果",
        "reflection": "先看看水面和勺子，再找鍋下的線索。",
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
                "8c66f4e0",
                "6bfb1d3a",
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
                "8c66f4e0",
                "6bfb1d3a",
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
      "goal": "先看師傅示範，再把爐口裡的三根柴往外拖。",
      "view": "tool",
      "alternateView": "notes",
      "viewLabel": "看閱讀筆記",
      "experience": {
        "mood": "用心理解",
        "caption": "你是跟著康康一起試的小幫手。",
        "action": "觀察師傅的方法",
        "reflection": "先看師傅示範，再把爐口裡的三根柴往外拖。",
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
                "c72efd44",
                "ee27c5bc",
                "abd01276",
                "05823090",
                "bf1a4eee"
              ]
            }
          ]
        }
      ],
      "act": 4,
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
                "8c66f4e0",
                "6bfb1d3a",
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
                "c72efd44",
                "ee27c5bc",
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
        "c72efd44"
      ]
    }
  ]
};
export function getFirstPersonLesson(id) { return id === FIRST_PERSON_LESSON.lessonId ? FIRST_PERSON_LESSON : null; }
export function clueRefs(clue, scene, lesson) {
 if (!clue.questionEvidence) return clue.refs;
 return [...(scene.questions[0].extraEvidence || []), ...scene.questions[0].basis.flatMap(id => lesson.reading_questions.find(q => q.id === id)?.evidence || [])];
}


// Illustration positions in source-image percent. Keep dots beside evidence, away from faces/hands.
export const FIRST_PERSON_ILLUSTRATIONS = {
  1: { images: ['act1-entrance.webp'], hotspots: { bell: [29, 16], wood: [49, 52] }, views: { entrance: .52, work: .65, side: .80 } },
  2: { images: ['act2-clean.webp'], hotspots: { pot: [64, 69], ladle: [59, 67] }, views: { pot: .65, ladle: .30, side: .15 }, effects: { bubble: [65, 68], steam: [70, 54] } },
  3: { images: ['act3-looking-down.webp'], hotspots: { pot: [62, 30], fire: [59, 68] }, views: { pot: .55, fire: .80, side: .20 }, effects: { fire: [59, 66] } },
  4: { images: ['act4-draw-wood.webp', 'act4-small-fire.webp'], hotspots: { tool: [51, 69], notes: [31, 41], fire: [73, 66], master: [37, 54], wood: [62, 80], pot: [74, 41] }, views: { tool: .55, notes: .20, fire: .70, master: .35, work: .35, pot: .70, side: .15 }, effects: { fire: [74, 70], steam: [75, 35], bubble: [74, 41] } },
};
