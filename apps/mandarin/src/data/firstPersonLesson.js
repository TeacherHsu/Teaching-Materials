// 公開資料只保留原句索引與雜湊；原文由 classroomKey 解密。
export const FIRST_PERSON_LESSON = {
  "lessonId": "115AG3H04",
  "version": 3,
  "title": "食堂裡的閱讀線索",
  "source": {
    "text": "翰林115三上官方課文Word，第4課〈水滾了〉，王宗仁",
    "questions": "官方15閱讀理解提問：第1、3、4、6、7題",
    "strategy": "郭富華老師文本分析提問單（教用）：事件背景、經過與解決、結果與啟示",
    "checked": "2026-10-22"
  },
  "scenes": [
    {
      "id": "story-welcome",
      "title": "第1幕・劇情站",
      "place": "門口 → 工作角",
      "goal": "先觀察，再完整閱讀本段。",
      "view": "entrance",
      "alternateView": "work",
      "viewLabel": "看工作角",
      "experience": {
        "mood": "日常",
        "caption": "食堂裡，師徒各自忙著自己的工作。",
        "action": "環顧食堂",
        "reflection": "先認識這個平常的早晨。",
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
      "stationType": "story",
      "questions": []
    },
    {
      "id": "welcome",
      "title": "食堂的早晨",
      "place": "門口 → 工作角",
      "goal": "找風鈴和木柴，讀讀師徒怎麼分工。",
      "view": "entrance",
      "alternateView": "work",
      "viewLabel": "看工作角",
      "experience": {
        "mood": "日常",
        "caption": "食堂裡，師徒各自忙著自己的工作。",
        "action": "環顧食堂",
        "reflection": "先認識這個平常的早晨。",
        "observeCaption": null,
        "afterCaption": null
      },
      "clues": [
        {
          "id": "bell",
          "label": "門前風鈴",
          "object": "bell",
          "note": "先認識故事發生的地方。",
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
            }
          ]
        },
        {
          "id": "wood",
          "label": "工作角木柴",
          "object": "wood",
          "note": "木柴讓我們回到師徒分工的文字。",
          "questionEvidence": true
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
          "explanation": "第1段清楚交代兩人的工作；這也幫助我們理解後來康康為什麼要自己想辦法。",
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
        },
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
      ]
    },
    {
      "id": "story-ladle",
      "title": "第2幕・劇情站",
      "place": "鍋邊 → 舀水處",
      "goal": "先觀察，再完整閱讀本段。",
      "view": "pot",
      "alternateView": "ladle",
      "viewLabel": "看長柄勺",
      "experience": {
        "mood": "慌張",
        "caption": "水不停冒泡，師傅還在接待客人……",
        "action": "觀察康康舀水",
        "reflection": "注意康康反覆舀水後，鍋裡有沒有改變。",
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
      "stationType": "story",
      "questions": []
    },
    {
      "id": "ladle",
      "title": "鍋旁的嘗試",
      "place": "鍋邊 → 舀水處",
      "goal": "觀察鍋子和長柄勺，找出康康做了什麼。",
      "view": "pot",
      "alternateView": "ladle",
      "viewLabel": "看長柄勺",
      "experience": {
        "mood": "慌張",
        "caption": "水不停冒泡，師傅還在接待客人……",
        "action": "觀察康康舀水",
        "reflection": "注意康康反覆舀水後，鍋裡有沒有改變。",
        "observeCaption": "看康康來回舀水。鍋裡的水有停下來嗎？",
        "afterCaption": "來回舀水，水還是在沸騰。接下來能往哪裡找原因？"
      },
      "clues": [
        {
          "id": "pot",
          "label": "冒泡的鍋子",
          "object": "pot",
          "note": "讀讀康康看到的情況。",
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
            }
          ]
        },
        {
          "id": "ladle",
          "label": "鍋旁長柄勺",
          "object": "ladle",
          "note": "勺子的造型是示意，動作請以原文為準。",
          "questionEvidence": true
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
          "stem": "水不停沸騰，師傅又正在忙。從原文和動作看，康康當時怎麼了？",
          "options": [
            "十分慌張，急著想讓水停下來",
            "覺得好奇，悠閒地看水冒泡泡",
            "覺得放心，等師傅自己來處理"
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
          "type": "choice",
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
          ]
        },
        {
          "id": "match",
          "type": "match",
          "kind": "動作與心情配對",
          "pirls": "詮釋",
          "stem": "依序替「康康反覆舀水」與「師傅抽出一些柴火」配對原文心情依據。",
          "options": [
            "十分慌張",
            "不慌不忙",
            "用心記住"
          ],
          "answer": [
            0,
            1
          ],
          "why": [
            "這是康康面對沸水時明說的心情。",
            "這是師傅處理柴火時明說的態度。",
            "這描述康康後來學習的情況，不是處理柴火時的態度。"
          ],
          "hints": [
            "分清楚人物與動作。",
            "一個人在反覆嘗試，一個人在處理原因。",
            "重讀第2、3段，找兩人動作旁的心情詞。"
          ],
          "explanation": "心情判斷需要原文詞語和同一人物的動作支持。",
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
            }
          ]
        }
      ]
    },
    {
      "id": "story-cause",
      "title": "第3幕・劇情站",
      "place": "水面 → 爐口",
      "goal": "先觀察，再完整閱讀本段。",
      "view": "pot",
      "alternateView": "fire",
      "viewLabel": "看爐口柴火",
      "experience": {
        "mood": "找原因",
        "caption": "舀了好多次，水還是在滾。原因在哪裡？",
        "action": "觀察舀水後的結果",
        "reflection": "試著把視線從水面移到鍋子底下。",
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
      "stationType": "story",
      "questions": []
    },
    {
      "id": "cause",
      "title": "往鍋底找原因",
      "place": "水面 → 爐口",
      "goal": "比較水面和鍋下的柴火，找出舀水無效的原因。",
      "view": "pot",
      "alternateView": "fire",
      "viewLabel": "看爐口柴火",
      "experience": {
        "mood": "找原因",
        "caption": "舀了好多次，水還是在滾。原因在哪裡？",
        "action": "觀察舀水後的結果",
        "reflection": "試著把視線從水面移到鍋子底下。",
        "observeCaption": null,
        "afterCaption": "來回舀水，水還是在沸騰。接下來能往哪裡找原因？"
      },
      "clues": [
        {
          "id": "water",
          "label": "仍在沸騰的水",
          "object": "pot",
          "note": "這是康康多次舀水後的結果。",
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
            }
          ]
        },
        {
          "id": "fire",
          "label": "鍋下柴火",
          "object": "fire",
          "note": "把結果和鍋子下面的情況連起來想。",
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
        },
        {
          "id": "picture",
          "type": "picture",
          "kind": "看圖找原因",
          "pirls": "推論",
          "stem": "哪個示意圖指出舀水沒有改變的原因？",
          "options": [
            "風鈴",
            "鍋底柴火",
            "閱讀筆記"
          ],
          "images": [
            "bell",
            "fire",
            "notes"
          ],
          "answer": 1,
          "why": [
            "風鈴呈現食堂環境，沒有讓鍋底受熱。",
            "鍋底仍有燃燒的柴火，持續供應熱。",
            "筆記是導讀示意，並不是加熱來源。"
          ],
          "hints": [
            "找讓水受熱的位置。",
            "舀水改變水面，沒有改變鍋底。",
            "回到第3段，核對鍋下面的描述。"
          ],
          "explanation": "觀察圖像後，仍要以鍋底的原句確認原因。",
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
      ]
    },
    {
      "id": "story-root",
      "title": "第4幕・劇情站",
      "place": "工具旁 → 閱讀筆記",
      "goal": "先觀察，再完整閱讀本段。",
      "view": "tool",
      "alternateView": "notes",
      "viewLabel": "看閱讀筆記",
      "experience": {
        "mood": "用心理解",
        "caption": "師傅不慌不忙地抽出一些柴火。火漸漸小了。",
        "action": "觀察師傅的方法",
        "reflection": "康康用心記住了什麼？把前後兩種方法放在一起想。",
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
      "stationType": "story",
      "questions": []
    },
    {
      "id": "root",
      "title": "找出解決的關鍵",
      "place": "工具旁 → 閱讀筆記",
      "goal": "看師傅的方法，再用一句話整理這次學到的道理。",
      "view": "tool",
      "alternateView": "notes",
      "viewLabel": "看閱讀筆記",
      "experience": {
        "mood": "用心理解",
        "caption": "師傅不慌不忙地抽出一些柴火。火漸漸小了。",
        "action": "觀察師傅的方法",
        "reflection": "康康用心記住了什麼？把前後兩種方法放在一起想。",
        "observeCaption": null,
        "afterCaption": null
      },
      "clues": [
        {
          "id": "tool",
          "label": "抽柴的工具",
          "object": "tool",
          "note": "原文只說「工具」；畫面外形為示意。留意「一些」與「漸漸」。",
          "questionEvidence": true
        },
        {
          "id": "notes",
          "label": "閱讀筆記",
          "object": "notes",
          "note": "筆記是導讀工具，並非課文中的物件。",
          "refs": [
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
        }
      ],
      "act": 4,
      "stationType": "challenge",
      "questions": [
        {
          "id": "meaning",
          "kind": "比較與統整",
          "basis": [
            "reading_question:04:04"
          ],
          "stem": "比較兩人的方法，這篇課文最想提醒我們什麼？",
          "options": [
            "多次重複同個動作，就能解決問題",
            "先找產生問題的根本，再處理問題",
            "先處理眼前看到的現象，就能解決"
          ],
          "answer": 1,
          "why": [
            "康康重複舀水仍無效，想一想師傅改變了哪個原因。",
            "你結合了師傅的方法和最後的提醒，整理出課文的道理。",
            "康康已經試過處理水面，最後一段提醒還要往哪裡找呢？"
          ],
          "hints": [
            "先比較：康康改變水面，師傅改變什麼？",
            "找出師傅抽出一些柴火後，火與水各有什麼變化。",
            "重讀第4段師傅的提醒，選出能同時解釋方法和結果的一句話。"
          ],
          "explanation": "師傅用工具抽出一些柴火，火漸漸變小，水不再沸騰；最後一段把這個方法連到「找到問題的根本」。",
          "type": "choice",
          "pirls": "統整",
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
            },
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
        },
        {
          "id": "act",
          "type": "action",
          "kind": "用動作回答",
          "pirls": "統整",
          "stem": "請關閉閱讀面板，在場景選擇能改變加熱原因的動作。",
          "options": [
            "再舀一次水",
            "繼續添加木柴",
            "抽出一些柴火"
          ],
          "answer": 2,
          "why": [
            "康康已多次嘗試，水仍沸騰。",
            "添加木柴會繼續供熱，不符合師傅的方法。",
            "你選擇改變持續加熱的原因；再看火與水的變化。"
          ],
          "hints": [
            "比較康康和師傅的方法。",
            "要改變鍋底持續供熱的情況。",
            "重讀第3段師傅的動作，再到場景操作。"
          ],
          "explanation": "抽出一些柴火後火漸小，這是方法與結果的因果關係。",
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
      ]
    }
  ],
  "gateTitle": "走進食堂，探索課文",
  "introduction": "你是課文探索者。觀察康康的經歷，再回到原句找依據。",
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
  2: { images: ['act2-scoop-1.webp', 'act2-scoop-2.webp', 'act2-scoop-3.webp'], hotspots: { pot: [72, 85], ladle: [65, 50] }, views: { pot: .65, ladle: .30, side: .15 }, effects: { bubble: [65, 68], steam: [70, 54] } },
  3: { images: ['act3-looking-down.webp'], hotspots: { pot: [62, 30], fire: [59, 68] }, views: { pot: .55, fire: .80, side: .20 }, effects: { fire: [59, 66] } },
  4: { images: ['act4-draw-wood.webp', 'act4-after.webp'], hotspots: { tool: [51, 69], notes: [31, 41], fire: [73, 66], master: [37, 54], wood: [62, 80], pot: [74, 41] }, views: { tool: .55, notes: .20, fire: .70, master: .35, work: .35, pot: .70, side: .15 }, effects: { fire: [74, 70], steam: [75, 35] } },
};
