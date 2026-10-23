// 原文僅在正常密碼門後於記憶體取用；此檔只存索引與雜湊。
export default {
  "schemaVersion": 1,
  "lessonId": "115AG4K07",
  "version": 1,
  "title": "美食與文化的旅程",
  "gateTitle": "美味的一堂課",
  "introduction": "跟著巧文姐姐看美食、動手做，再找出這堂課的收穫。",
  "assetBase": "assets/situation/115AG4K07/",
  "paragraphCounts": [
    2,
    12,
    17,
    7,
    5,
    4
  ],
  "sentenceCount": 47,
  "storySentenceCount": 47,
  "excludedUnits": [],
  "speakers": {
    "1:0": "",
    "1:1": "",
    "2:0": "",
    "2:1": "",
    "2:2": "",
    "2:3": "",
    "2:4": "",
    "2:5": "",
    "2:6": "",
    "2:7": "",
    "2:8": "巧文姐姐",
    "2:9": "巧文姐姐",
    "2:10": "巧文姐姐",
    "2:11": "",
    "3:0": "",
    "3:1": "",
    "3:2": "",
    "3:3": "巧文姐姐",
    "3:4": "巧文姐姐",
    "3:5": "巧文姐姐",
    "3:6": "巧文姐姐",
    "3:7": "巧文姐姐",
    "3:8": "巧文姐姐",
    "3:9": "巧文姐姐",
    "3:10": "巧文姐姐",
    "3:11": "巧文姐姐",
    "3:12": "巧文姐姐",
    "3:13": "巧文姐姐",
    "3:14": "",
    "3:15": "",
    "3:16": "",
    "4:0": "",
    "4:1": "",
    "4:2": "",
    "4:3": "",
    "4:4": "",
    "4:5": "",
    "4:6": "",
    "5:0": "",
    "5:1": "",
    "5:2": "巧文姐姐",
    "5:3": "巧文姐姐",
    "5:4": "巧文姐姐",
    "6:0": "",
    "6:1": "",
    "6:2": "",
    "6:3": ""
  },
  "source": {
    "text": "教師核定本機來源，對齊正式密文朗讀單位",
    "questions": "官方題號只記於實作紀錄",
    "strategy": "醬料配對、主旨與順序連接詞",
    "checked": "2026-10-23"
  },
  "ui": {
    "enter": "走進美食課",
    "return": "回到場景",
    "speaker": "",
    "character": "我",
    "context": "我只以第一人稱手部出現；投影片與操作為閱讀示意。",
    "safety": "畫面練習不操作真實熱鍋與刀具。"
  },
  "meter": {
    "title": "美食之旅",
    "subject": "這堂課",
    "states": [
      "印度甩餅",
      "義大利麵",
      "壽司",
      "多元的文化"
    ],
    "faces": [
      "🫓",
      "🍝",
      "🍣",
      "🌏"
    ],
    "events": [
      {
        "para": 2,
        "n": 8,
        "state": 0,
        "level": 1
      },
      {
        "para": 3,
        "n": 3,
        "state": 1,
        "level": 1
      },
      {
        "para": 4,
        "n": 2,
        "state": 2,
        "level": 1
      },
      {
        "para": 5,
        "n": 4,
        "state": 3,
        "level": 1
      }
    ]
  },
  "review": [
    [
      "配對",
      "把醬料和味道線索連起來。"
    ],
    [
      "順序",
      "用連接詞回想分享的先後。"
    ],
    [
      "主旨",
      "從巧文姐姐的話找出探索文化的方式。"
    ]
  ],
  "ending": {
    "title": "巧文姐姐分享各地美食，帶同學做壽司，用味覺探索文化。",
    "refs": [
      {
        "para": 5,
        "sentences": [
          2,
          3,
          4
        ],
        "sha": [
          "feeaf77f",
          "8a020a31",
          "3212c48e"
        ]
      },
      {
        "para": 6,
        "sentences": [
          0,
          1,
          2,
          3
        ],
        "sha": [
          "13f9ccd9",
          "69c9e7d5",
          "f379eb03",
          "d6a5593c"
        ]
      }
    ]
  },
  "scenes": [
    {
      "id": "tasty-1",
      "act": 1,
      "title": "影片裡的特技",
      "goal": "桌面拍打一下",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG4K07/",
      "art": {
        "images": [
          "flatbread.webp",
          "flatbread-cook.webp"
        ],
        "aspect": [
          2400,
          1024
        ],
        "hotspots": {},
        "effects": {},
        "views": {
          "work": 0.5
        },
        "orientationFocus": {
          "landscape": 50,
          "portrait": 50
        },
        "readingZoom": false,
        "stepImages": [
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      "operation": {
        "type": "observe",
        "steps": [
          "pat-1",
          "pat-2",
          "toss",
          "cook",
          "curry"
        ],
        "objects": [
          {
            "action": "pat-1",
            "label": "桌面拍打餅皮",
            "x": 50,
            "y": 70,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 0,
            "toStep": 0,
            "sprite": "dough-small",
            "viewMotion": "doughPat"
          },
          {
            "action": "pat-2",
            "label": "再拍打餅皮",
            "x": 50,
            "y": 70,
            "width": 6,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 1,
            "toStep": 1,
            "sprite": "dough-large",
            "viewMotion": "doughPat"
          },
          {
            "action": "toss",
            "label": "往空中拋餅皮",
            "x": 50,
            "y": 70,
            "width": 8,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 2,
            "toStep": 2,
            "sprite": "dough-thin",
            "viewMotion": "doughToss"
          },
          {
            "action": "cook",
            "label": "看影片把餅皮烙一下",
            "x": 50,
            "y": 70,
            "width": 6,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 3,
            "toStep": 3,
            "sprite": "dough-thin",
            "viewMotion": "adultCook",
            "motionImage": "flatbread-cook.webp",
            "cookMotion": "stir"
          },
          {
            "action": "curry",
            "label": "把餅皮沾咖哩",
            "x": 46,
            "y": 72,
            "width": 6,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "dragToTarget",
            "observation": "",
            "fromStep": 4,
            "toStep": 4,
            "sprite": "dough-thin",
            "region": "curry",
            "destination": [
              54,
              72
            ]
          },
          {
            "action": "curry-bowl",
            "label": "咖哩碗",
            "sprite": "curry",
            "x": 54,
            "y": 72,
            "width": 6,
            "ratio": 0.7,
            "angle": 0,
            "target": true,
            "fromStep": 4,
            "toStep": 4
          }
        ],
        "silentObserve": true,
        "hideOnResult": true,
        "prompts": [
          "桌面拍打一下",
          "再拍打一下",
          "點餅皮往上拋",
          "看影片烙餅",
          "把餅皮拖去沾咖哩"
        ],
        "focus": [
          50,
          50,
          50,
          50,
          50,
          50
        ],
        "protectedRegions": [
          {
            "x": 34,
            "y": 26,
            "width": 13,
            "ratio": 0.9
          },
          {
            "x": 71,
            "y": 22,
            "width": 13,
            "ratio": 0.9
          }
        ],
        "regions": {
          "curry": {
            "left": 50,
            "right": 57,
            "top": 64,
            "bottom": 80
          }
        }
      },
      "meter": [
        {
          "state": 0,
          "level": 1
        },
        {
          "state": 0,
          "level": 1
        },
        {
          "state": 0,
          "level": 1
        },
        {
          "state": 0,
          "level": 1
        },
        {
          "state": 0,
          "level": 1
        },
        {
          "state": 0,
          "level": 1
        }
      ],
      "beats": {
        "intro": [
          {
            "para": 1,
            "sentences": [
              0,
              1
            ],
            "sha": [
              "1a283a08",
              "aeae66c2"
            ]
          }
        ],
        "act": {
          "demo": false
        },
        "result": {
          "view": "work",
          "duration": 1800
        },
        "read": [
          {
            "para": 2,
            "sentences": [
              0,
              1,
              2
            ],
            "sha": [
              "c7faad5e",
              "83b74ad0",
              "c08d2367"
            ]
          },
          {
            "para": 2,
            "sentences": [
              3,
              4
            ],
            "sha": [
              "90d326d9",
              "ef4bb329"
            ]
          },
          {
            "para": 2,
            "sentences": [
              5,
              6,
              7
            ],
            "sha": [
              "ecc4de6d",
              "4314f9d9",
              "90f56fd2"
            ]
          },
          {
            "para": 2,
            "sentences": [
              8,
              9,
              10,
              11
            ],
            "sha": [
              "c1a19098",
              "7e4f3e62",
              "6c7452ac",
              "623f32df"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "tasty-evidence-1",
          "refs": [
            {
              "para": 1,
              "sentences": [
                0,
                1
              ],
              "sha": [
                "1a283a08",
                "aeae66c2"
              ]
            },
            {
              "para": 2,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "c7faad5e",
                "83b74ad0",
                "c08d2367"
              ]
            },
            {
              "para": 2,
              "sentences": [
                3,
                4
              ],
              "sha": [
                "90d326d9",
                "ef4bb329"
              ]
            },
            {
              "para": 2,
              "sentences": [
                5,
                6,
                7
              ],
              "sha": [
                "ecc4de6d",
                "4314f9d9",
                "90f56fd2"
              ]
            },
            {
              "para": 2,
              "sentences": [
                8,
                9,
                10,
                11
              ],
              "sha": [
                "c1a19098",
                "7e4f3e62",
                "6c7452ac",
                "623f32df"
              ]
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "tasty-summary-1",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "巧文姐姐播放甩餅影片，同學看見餅皮拍打、拋起後變大變薄。",
            "巧文姐姐介紹不同造型的義大利麵，也分享三種醬料的滋味。",
            "巧文姐姐帶同學動手做壽司，大家完成自己的料理。"
          ],
          "answer": 0,
          "why": [
            "連起人物、行動與本幕重點。",
            "這是另一幕的事件。",
            "這不是本幕主要事件。"
          ],
          "hints": [
            "回想這一幕。",
            "連起人物和行動。",
            "選出整幕的重點。"
          ],
          "explanation": "巧文姐姐播放甩餅影片，同學看見餅皮拍打、拋起後變大變薄。",
          "refs": [
            {
              "para": 1,
              "sentences": [
                0,
                1
              ],
              "sha": [
                "1a283a08",
                "aeae66c2"
              ]
            },
            {
              "para": 2,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "c7faad5e",
                "83b74ad0",
                "c08d2367"
              ]
            },
            {
              "para": 2,
              "sentences": [
                3,
                4
              ],
              "sha": [
                "90d326d9",
                "ef4bb329"
              ]
            },
            {
              "para": 2,
              "sentences": [
                5,
                6,
                7
              ],
              "sha": [
                "ecc4de6d",
                "4314f9d9",
                "90f56fd2"
              ]
            },
            {
              "para": 2,
              "sentences": [
                8,
                9,
                10,
                11
              ],
              "sha": [
                "c1a19098",
                "7e4f3e62",
                "6c7452ac",
                "623f32df"
              ]
            }
          ],
          "summaryImages": [
            "sprites/summary-flatbread.webp",
            "sprites/summary-pasta.webp",
            "sprites/summary-sushi.webp"
          ]
        }
      ],
      "strategies": [],
      "timeline": [
        {
          "kind": "intro",
          "refs": [
            {
              "para": 1,
              "sentences": [
                0,
                1
              ],
              "sha": [
                "1a283a08",
                "aeae66c2"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 2,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "c7faad5e",
                "83b74ad0",
                "c08d2367"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "untilStep": 2,
          "imageIndex": 0
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 2,
              "sentences": [
                3,
                4
              ],
              "sha": [
                "90d326d9",
                "ef4bb329"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "untilStep": 3,
          "imageIndex": 0
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 2,
              "sentences": [
                5,
                6,
                7
              ],
              "sha": [
                "ecc4de6d",
                "4314f9d9",
                "90f56fd2"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "imageIndex": 0
        },
        {
          "kind": "result",
          "imageIndex": 0
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 2,
              "sentences": [
                8,
                9,
                10,
                11
              ],
              "sha": [
                "c1a19098",
                "7e4f3e62",
                "6c7452ac",
                "623f32df"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "question"
        }
      ],
      "meterRevealAt": {
        "para": 2,
        "n": 8
      }
    },
    {
      "id": "tasty-2",
      "act": 2,
      "title": "各式各樣的麵",
      "goal": "找蝴蝶造型的麵",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG4K07/",
      "art": {
        "images": [
          "pasta.webp"
        ],
        "aspect": [
          2400,
          1024
        ],
        "hotspots": {},
        "effects": {},
        "views": {
          "work": 0.5
        },
        "orientationFocus": {
          "landscape": 50,
          "portrait": 50
        },
        "readingZoom": false,
        "stepImages": [
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      "operation": {
        "type": "observe",
        "steps": [
          "butterfly",
          "wheel",
          "ear",
          "red",
          "white",
          "green"
        ],
        "objects": [
          {
            "action": "butterfly",
            "label": "找蝴蝶造型的麵",
            "x": 43,
            "y": 73,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 0,
            "toStep": 0,
            "sprite": "butterfly",
            "viewMotion": "approach"
          },
          {
            "action": "wheel",
            "label": "找車輪造型的麵",
            "x": 50,
            "y": 73,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 1,
            "toStep": 1,
            "sprite": "wheel",
            "viewMotion": "approach"
          },
          {
            "action": "ear",
            "label": "找貓耳朵造型的麵",
            "x": 57,
            "y": 73,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 2,
            "toStep": 2,
            "sprite": "ear",
            "viewMotion": "approach"
          },
          {
            "action": "red",
            "label": "拿紅醬配味道",
            "x": 50,
            "y": 86,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "dragToTarget",
            "observation": "",
            "fromStep": 3,
            "toStep": 3,
            "sprite": "red",
            "region": "red",
            "destination": [
              43,
              73
            ]
          },
          {
            "action": "white",
            "label": "拿白醬配味道",
            "x": 50,
            "y": 86,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "dragToTarget",
            "observation": "",
            "fromStep": 4,
            "toStep": 4,
            "sprite": "white",
            "region": "white",
            "destination": [
              50,
              73
            ]
          },
          {
            "action": "green",
            "label": "拿青醬配味道",
            "x": 50,
            "y": 86,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "dragToTarget",
            "observation": "",
            "fromStep": 5,
            "toStep": 5,
            "sprite": "green",
            "region": "green",
            "destination": [
              57,
              73
            ]
          },
          {
            "action": "taste-red",
            "label": "酸甜",
            "x": 43,
            "y": 73,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 3,
            "toStep": 5,
            "sprite": "spoon",
            "target": true,
            "cardLabel": "酸甜"
          },
          {
            "action": "taste-white",
            "label": "濃郁",
            "x": 50,
            "y": 73,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 3,
            "toStep": 5,
            "sprite": "spoon",
            "target": true,
            "cardLabel": "濃郁"
          },
          {
            "action": "taste-green",
            "label": "香氣",
            "x": 57,
            "y": 73,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 3,
            "toStep": 5,
            "sprite": "spoon",
            "target": true,
            "cardLabel": "香氣"
          }
        ],
        "silentObserve": true,
        "hideOnResult": true,
        "prompts": [
          "找蝴蝶造型的麵",
          "找車輪造型的麵",
          "找貓耳朵造型的麵",
          "把紅醬配上味道",
          "把白醬配上味道",
          "把青醬配上味道"
        ],
        "focus": [
          50,
          50,
          50,
          50,
          50,
          50,
          50
        ],
        "protectedRegions": [
          {
            "x": 34,
            "y": 26,
            "width": 13,
            "ratio": 0.9
          },
          {
            "x": 71,
            "y": 22,
            "width": 13,
            "ratio": 0.9
          }
        ],
        "regions": {
          "red": {
            "left": 40,
            "right": 46,
            "top": 66,
            "bottom": 80
          },
          "white": {
            "left": 47,
            "right": 53,
            "top": 66,
            "bottom": 80
          },
          "green": {
            "left": 54,
            "right": 60,
            "top": 66,
            "bottom": 80
          }
        },
        "retry": "再想想醬料的味道"
      },
      "meter": [
        {
          "state": 0,
          "level": 1
        },
        {
          "state": 1,
          "level": 1
        },
        {
          "state": 1,
          "level": 1
        },
        {
          "state": 1,
          "level": 1
        },
        {
          "state": 1,
          "level": 1
        },
        {
          "state": 1,
          "level": 1
        },
        {
          "state": 1,
          "level": 1
        }
      ],
      "beats": {
        "intro": [
          {
            "para": 3,
            "sentences": [
              0,
              1,
              2,
              3,
              4
            ],
            "sha": [
              "8fae5de6",
              "698c4d64",
              "b71fc004",
              "bc23868e",
              "25972e15"
            ]
          }
        ],
        "act": {
          "demo": false
        },
        "result": {
          "view": "work",
          "duration": 1800
        },
        "read": [
          {
            "para": 3,
            "sentences": [
              5
            ],
            "sha": [
              "0c6787cb"
            ]
          },
          {
            "para": 3,
            "sentences": [
              6
            ],
            "sha": [
              "4b2604cc"
            ]
          },
          {
            "para": 3,
            "sentences": [
              7,
              8,
              9,
              10,
              11,
              12,
              13
            ],
            "sha": [
              "3b07fee8",
              "bcd9ca43",
              "a72f81d4",
              "f134b9a6",
              "cb1aa502",
              "252ab72d",
              "738ef86c"
            ]
          },
          {
            "para": 3,
            "sentences": [
              14,
              15,
              16
            ],
            "sha": [
              "3974e720",
              "5cf01efa",
              "fc02cd2c"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "tasty-evidence-2",
          "refs": [
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2,
                3,
                4
              ],
              "sha": [
                "8fae5de6",
                "698c4d64",
                "b71fc004",
                "bc23868e",
                "25972e15"
              ]
            },
            {
              "para": 3,
              "sentences": [
                5
              ],
              "sha": [
                "0c6787cb"
              ]
            },
            {
              "para": 3,
              "sentences": [
                6
              ],
              "sha": [
                "4b2604cc"
              ]
            },
            {
              "para": 3,
              "sentences": [
                7,
                8,
                9,
                10,
                11,
                12,
                13
              ],
              "sha": [
                "3b07fee8",
                "bcd9ca43",
                "a72f81d4",
                "f134b9a6",
                "cb1aa502",
                "252ab72d",
                "738ef86c"
              ]
            },
            {
              "para": 3,
              "sentences": [
                14,
                15,
                16
              ],
              "sha": [
                "3974e720",
                "5cf01efa",
                "fc02cd2c"
              ]
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "tasty-summary-2",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "巧文姐姐介紹不同造型的義大利麵，也分享三種醬料的滋味。",
            "巧文姐姐帶同學動手做壽司，大家完成自己的料理。",
            "巧文姐姐分享探索文化的方式，同學從美食課認識各地文化。"
          ],
          "answer": 0,
          "why": [
            "連起人物、行動與本幕重點。",
            "這是另一幕的事件。",
            "這不是本幕主要事件。"
          ],
          "hints": [
            "回想這一幕。",
            "連起人物和行動。",
            "選出整幕的重點。"
          ],
          "explanation": "巧文姐姐介紹不同造型的義大利麵，也分享三種醬料的滋味。",
          "refs": [
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2,
                3,
                4
              ],
              "sha": [
                "8fae5de6",
                "698c4d64",
                "b71fc004",
                "bc23868e",
                "25972e15"
              ]
            },
            {
              "para": 3,
              "sentences": [
                5
              ],
              "sha": [
                "0c6787cb"
              ]
            },
            {
              "para": 3,
              "sentences": [
                6
              ],
              "sha": [
                "4b2604cc"
              ]
            },
            {
              "para": 3,
              "sentences": [
                7,
                8,
                9,
                10,
                11,
                12,
                13
              ],
              "sha": [
                "3b07fee8",
                "bcd9ca43",
                "a72f81d4",
                "f134b9a6",
                "cb1aa502",
                "252ab72d",
                "738ef86c"
              ]
            },
            {
              "para": 3,
              "sentences": [
                14,
                15,
                16
              ],
              "sha": [
                "3974e720",
                "5cf01efa",
                "fc02cd2c"
              ]
            }
          ],
          "summaryImages": [
            "sprites/summary-pasta.webp",
            "sprites/summary-sushi.webp",
            "sprites/summary-class.webp"
          ]
        }
      ],
      "strategies": [],
      "timeline": [
        {
          "kind": "intro",
          "refs": [
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2,
                3,
                4
              ],
              "sha": [
                "8fae5de6",
                "698c4d64",
                "b71fc004",
                "bc23868e",
                "25972e15"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "untilStep": 1,
          "imageIndex": 0
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 3,
              "sentences": [
                5
              ],
              "sha": [
                "0c6787cb"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "untilStep": 2,
          "imageIndex": 0
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 3,
              "sentences": [
                6
              ],
              "sha": [
                "4b2604cc"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "untilStep": 3,
          "imageIndex": 0
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 3,
              "sentences": [
                7,
                8,
                9,
                10,
                11,
                12,
                13
              ],
              "sha": [
                "3b07fee8",
                "bcd9ca43",
                "a72f81d4",
                "f134b9a6",
                "cb1aa502",
                "252ab72d",
                "738ef86c"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "imageIndex": 0
        },
        {
          "kind": "result",
          "imageIndex": 0
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 3,
              "sentences": [
                14,
                15,
                16
              ],
              "sha": [
                "3974e720",
                "5cf01efa",
                "fc02cd2c"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "question"
        }
      ]
    },
    {
      "id": "tasty-3",
      "act": 3,
      "title": "動手做壽司",
      "goal": "在竹簾上鋪醋飯",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG4K07/",
      "art": {
        "images": [
          "sushi.webp",
          "sushi-cut.webp",
          "sushi-done.webp"
        ],
        "aspect": [
          2400,
          1024
        ],
        "hotspots": {},
        "effects": {},
        "views": {
          "work": 0.5
        },
        "orientationFocus": {
          "landscape": 50,
          "portrait": 50
        },
        "readingZoom": false,
        "stepImages": [
          0,
          0,
          0,
          0,
          0
        ],
        "resultStartImage": 1,
        "resultImage": 2,
        "resultDelay": 1400
      },
      "operation": {
        "type": "observe",
        "steps": [
          "rice",
          "cucumber",
          "egg",
          "roll"
        ],
        "objects": [
          {
            "action": "finished-roll",
            "label": "捲好的壽司",
            "sprite": "sushi-roll",
            "x": 50,
            "y": 73,
            "width": 8,
            "ratio": 0.6,
            "angle": 0,
            "passive": true,
            "fromStep": 4,
            "toStep": 4
          },
          {
            "action": "rice",
            "label": "在竹簾上鋪醋飯",
            "x": 50,
            "y": 70,
            "width": 6,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 0,
            "toStep": 0,
            "sprite": "rice",
            "viewMotion": "approach"
          },
          {
            "action": "cucumber",
            "label": "放上小黃瓜",
            "x": 44,
            "y": 73,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 1,
            "toStep": 2,
            "sprite": "cucumber",
            "viewMotion": "approach",
            "hideWhenCompleted": true
          },
          {
            "action": "egg",
            "label": "放上玉子燒",
            "x": 56,
            "y": 73,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 1,
            "toStep": 2,
            "sprite": "egg",
            "viewMotion": "approach",
            "hideWhenCompleted": true
          },
          {
            "action": "floss",
            "label": "放上肉鬆",
            "x": 44,
            "y": 83,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 1,
            "toStep": 2,
            "sprite": "floss",
            "viewMotion": "approach",
            "hideWhenCompleted": true
          },
          {
            "action": "crab",
            "label": "放上蟹肉棒",
            "x": 56,
            "y": 83,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 1,
            "toStep": 2,
            "sprite": "crab",
            "viewMotion": "approach",
            "hideWhenCompleted": true
          },
          {
            "action": "roll",
            "label": "用竹簾捲起壽司",
            "x": 50,
            "y": 88,
            "width": 6,
            "ratio": 0.5,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "dragToTarget",
            "observation": "",
            "fromStep": 3,
            "toStep": 3,
            "sprite": "mat",
            "destination": [
              50,
              73
            ]
          },
          {
            "action": "roll-target",
            "label": "竹簾往上捲的位置",
            "x": 50,
            "y": 73,
            "width": 6,
            "ratio": 0.5,
            "angle": 0,
            "target": true,
            "fromStep": 3,
            "toStep": 3
          },
          {
            "action": "work-mat",
            "label": "竹簾上的醋飯",
            "sprite": "mat-rice",
            "x": 50,
            "y": 79,
            "width": 4,
            "ratio": 0.5,
            "angle": 0,
            "passive": true,
            "fromStep": 1,
            "toStep": 2
          }
        ],
        "silentObserve": true,
        "hideOnResult": true,
        "prompts": [
          "在竹簾上鋪醋飯",
          "選一種食材放上",
          "再選另一種食材",
          "拖竹簾往上捲起"
        ],
        "focus": [
          50,
          50,
          50,
          50,
          50
        ],
        "protectedRegions": [
          {
            "x": 34,
            "y": 26,
            "width": 13,
            "ratio": 0.9
          },
          {
            "x": 71,
            "y": 22,
            "width": 13,
            "ratio": 0.9
          }
        ],
        "collect": [
          "cucumber",
          "egg",
          "floss",
          "crab"
        ],
        "regions": {
          "target": {
            "left": 45,
            "right": 55,
            "top": 66,
            "bottom": 80
          }
        }
      },
      "meter": [
        {
          "state": 1,
          "level": 1
        },
        {
          "state": 2,
          "level": 1
        },
        {
          "state": 2,
          "level": 1
        },
        {
          "state": 2,
          "level": 1
        },
        {
          "state": 2,
          "level": 1
        }
      ],
      "beats": {
        "intro": [
          {
            "para": 4,
            "sentences": [
              0,
              1,
              2
            ],
            "sha": [
              "b0ae7278",
              "0ca4f7a1",
              "01f910e1"
            ]
          }
        ],
        "act": {
          "demo": false
        },
        "result": {
          "view": "work",
          "duration": 2400,
          "safetyReminder": "切壽司交給大人，畫面中由巧文姐姐完成。",
          "safetyDelay": 1600
        },
        "read": [
          {
            "para": 4,
            "sentences": [
              3
            ],
            "sha": [
              "13546237"
            ]
          },
          {
            "para": 4,
            "sentences": [
              4
            ],
            "sha": [
              "a9cbe7b9"
            ]
          },
          {
            "para": 4,
            "sentences": [
              5,
              6
            ],
            "sha": [
              "e4e092fb",
              "3a804188"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "tasty-evidence-3",
          "refs": [
            {
              "para": 4,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "b0ae7278",
                "0ca4f7a1",
                "01f910e1"
              ]
            },
            {
              "para": 4,
              "sentences": [
                3
              ],
              "sha": [
                "13546237"
              ]
            },
            {
              "para": 4,
              "sentences": [
                4
              ],
              "sha": [
                "a9cbe7b9"
              ]
            },
            {
              "para": 4,
              "sentences": [
                5,
                6
              ],
              "sha": [
                "e4e092fb",
                "3a804188"
              ]
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "tasty-summary-3",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "巧文姐姐帶同學動手做壽司，大家完成自己的料理。",
            "巧文姐姐分享探索文化的方式，同學從美食課認識各地文化。",
            "巧文姐姐播放甩餅影片，同學看見餅皮拍打、拋起後變大變薄。"
          ],
          "answer": 0,
          "why": [
            "連起人物、行動與本幕重點。",
            "這是另一幕的事件。",
            "這不是本幕主要事件。"
          ],
          "hints": [
            "回想這一幕。",
            "連起人物和行動。",
            "選出整幕的重點。"
          ],
          "explanation": "巧文姐姐帶同學動手做壽司，大家完成自己的料理。",
          "refs": [
            {
              "para": 4,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "b0ae7278",
                "0ca4f7a1",
                "01f910e1"
              ]
            },
            {
              "para": 4,
              "sentences": [
                3
              ],
              "sha": [
                "13546237"
              ]
            },
            {
              "para": 4,
              "sentences": [
                4
              ],
              "sha": [
                "a9cbe7b9"
              ]
            },
            {
              "para": 4,
              "sentences": [
                5,
                6
              ],
              "sha": [
                "e4e092fb",
                "3a804188"
              ]
            }
          ],
          "summaryImages": [
            "sprites/summary-sushi.webp",
            "sprites/summary-class.webp",
            "sprites/summary-flatbread.webp"
          ]
        }
      ],
      "strategies": [],
      "timeline": [
        {
          "kind": "intro",
          "refs": [
            {
              "para": 4,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "b0ae7278",
                "0ca4f7a1",
                "01f910e1"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "untilStep": 1,
          "imageIndex": 0
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 4,
              "sentences": [
                3
              ],
              "sha": [
                "13546237"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "untilStep": 3,
          "imageIndex": 0
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 4,
              "sentences": [
                4
              ],
              "sha": [
                "a9cbe7b9"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "imageIndex": 0
        },
        {
          "kind": "result",
          "imageIndex": 1
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 4,
              "sentences": [
                5,
                6
              ],
              "sha": [
                "e4e092fb",
                "3a804188"
              ]
            }
          ],
          "imageIndex": 2
        },
        {
          "kind": "question"
        }
      ]
    },
    {
      "id": "tasty-4",
      "act": 4,
      "title": "探索文化的方式",
      "goal": "文字卡分給讀書人",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG4K07/",
      "art": {
        "images": [
          "class.webp"
        ],
        "aspect": [
          2400,
          1024
        ],
        "hotspots": {},
        "effects": {},
        "views": {
          "work": 0.5
        },
        "orientationFocus": {
          "landscape": 50,
          "portrait": 50
        },
        "readingZoom": false,
        "stepImages": [
          0,
          0,
          0,
          0,
          0
        ]
      },
      "operation": {
        "type": "observe",
        "steps": [
          "book",
          "camera",
          "spoon",
          "favorite"
        ],
        "objects": [
          {
            "action": "book",
            "label": "文字卡分給讀書剪影",
            "x": 50,
            "y": 86,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "dragToTarget",
            "observation": "",
            "fromStep": 0,
            "toStep": 0,
            "sprite": "book",
            "region": "book",
            "destination": [
              43,
              73
            ]
          },
          {
            "action": "person-book",
            "label": "放到讀書人物剪影",
            "x": 43,
            "y": 73,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 0,
            "toStep": 0,
            "sprite": "silhouette-book",
            "target": true
          },
          {
            "action": "camera",
            "label": "照片卡分給攝影剪影",
            "x": 50,
            "y": 86,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "dragToTarget",
            "observation": "",
            "fromStep": 1,
            "toStep": 1,
            "sprite": "camera",
            "region": "camera",
            "destination": [
              50,
              73
            ]
          },
          {
            "action": "person-camera",
            "label": "放到攝影人物剪影",
            "x": 50,
            "y": 73,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 1,
            "toStep": 1,
            "sprite": "silhouette-camera",
            "target": true
          },
          {
            "action": "spoon",
            "label": "味覺卡分給品嘗剪影",
            "x": 50,
            "y": 86,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "dragToTarget",
            "observation": "",
            "fromStep": 2,
            "toStep": 2,
            "sprite": "spoon",
            "region": "spoon",
            "destination": [
              57,
              73
            ]
          },
          {
            "action": "person-spoon",
            "label": "放到品嘗人物剪影",
            "x": 57,
            "y": 73,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 2,
            "toStep": 2,
            "sprite": "silhouette-spoon",
            "target": true
          },
          {
            "action": "favorite",
            "label": "點巧文姐姐最喜歡的方式",
            "x": 50,
            "y": 73,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 3,
            "toStep": 3,
            "sprite": "spoon",
            "viewMotion": "approach"
          },
          {
            "action": "try-book",
            "label": "再想想姐姐的選擇",
            "x": 43,
            "y": 73,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 3,
            "toStep": 3,
            "sprite": "book",
            "returnOnTap": "聽聽姐姐說最喜歡什麼"
          },
          {
            "action": "try-camera",
            "label": "再想想姐姐的選擇",
            "x": 57,
            "y": 73,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 3,
            "toStep": 3,
            "sprite": "camera",
            "returnOnTap": "聽聽姐姐說最喜歡什麼"
          }
        ],
        "silentObserve": true,
        "hideOnResult": true,
        "prompts": [
          "文字卡分給讀書人",
          "照片卡分給攝影人",
          "味覺卡分給品嘗人",
          "點出姐姐喜歡的方式"
        ],
        "focus": [
          50,
          50,
          50,
          50,
          50
        ],
        "protectedRegions": [
          {
            "x": 34,
            "y": 26,
            "width": 13,
            "ratio": 0.9
          },
          {
            "x": 71,
            "y": 22,
            "width": 13,
            "ratio": 0.9
          }
        ],
        "regions": {
          "book": {
            "left": 40,
            "right": 46,
            "top": 66,
            "bottom": 80
          },
          "camera": {
            "left": 47,
            "right": 53,
            "top": 66,
            "bottom": 80
          },
          "spoon": {
            "left": 54,
            "right": 60,
            "top": 66,
            "bottom": 80
          }
        }
      },
      "meter": [
        {
          "state": 2,
          "level": 1
        },
        {
          "state": 2,
          "level": 1
        },
        {
          "state": 2,
          "level": 1
        },
        {
          "state": 3,
          "level": 1
        },
        {
          "state": 3,
          "level": 1
        }
      ],
      "beats": {
        "intro": [
          {
            "para": 5,
            "sentences": [
              0,
              1,
              2
            ],
            "sha": [
              "38570d5a",
              "58be13bf",
              "feeaf77f"
            ]
          }
        ],
        "act": {
          "demo": false
        },
        "result": {
          "view": "work",
          "duration": 1800
        },
        "read": [
          {
            "para": 5,
            "sentences": [
              3
            ],
            "sha": [
              "8a020a31"
            ]
          },
          {
            "para": 5,
            "sentences": [
              4
            ],
            "sha": [
              "3212c48e"
            ]
          },
          {
            "para": 6,
            "sentences": [
              0,
              1,
              2,
              3
            ],
            "sha": [
              "13f9ccd9",
              "69c9e7d5",
              "f379eb03",
              "d6a5593c"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "tasty-evidence-4",
          "refs": [
            {
              "para": 5,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "38570d5a",
                "58be13bf",
                "feeaf77f"
              ]
            },
            {
              "para": 5,
              "sentences": [
                3
              ],
              "sha": [
                "8a020a31"
              ]
            },
            {
              "para": 5,
              "sentences": [
                4
              ],
              "sha": [
                "3212c48e"
              ]
            },
            {
              "para": 6,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "13f9ccd9",
                "69c9e7d5",
                "f379eb03",
                "d6a5593c"
              ]
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "tasty-summary-4",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "巧文姐姐分享探索文化的方式，同學從美食課認識各地文化。",
            "巧文姐姐播放甩餅影片，同學看見餅皮拍打、拋起後變大變薄。",
            "巧文姐姐介紹不同造型的義大利麵，也分享三種醬料的滋味。"
          ],
          "answer": 0,
          "why": [
            "連起人物、行動與本幕重點。",
            "這是另一幕的事件。",
            "這不是本幕主要事件。"
          ],
          "hints": [
            "回想這一幕。",
            "連起人物和行動。",
            "選出整幕的重點。"
          ],
          "explanation": "巧文姐姐分享探索文化的方式，同學從美食課認識各地文化。",
          "refs": [
            {
              "para": 5,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "38570d5a",
                "58be13bf",
                "feeaf77f"
              ]
            },
            {
              "para": 5,
              "sentences": [
                3
              ],
              "sha": [
                "8a020a31"
              ]
            },
            {
              "para": 5,
              "sentences": [
                4
              ],
              "sha": [
                "3212c48e"
              ]
            },
            {
              "para": 6,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "13f9ccd9",
                "69c9e7d5",
                "f379eb03",
                "d6a5593c"
              ]
            }
          ],
          "summaryImages": [
            "sprites/summary-class.webp",
            "sprites/summary-flatbread.webp",
            "sprites/summary-pasta.webp"
          ]
        },
        {
          "id": "tasty-order",
          "type": "order",
          "operationType": "orderCards",
          "stem": "用連接詞排出姐姐分享的順序。",
          "options": [
            "首先：印度甩餅",
            "接著：義大利麵",
            "最後：壽司"
          ],
          "answer": [
            0,
            1,
            2
          ],
          "initialOrder": [
            2,
            0,
            1
          ],
          "lockOrderSelections": true,
          "why": [
            "依照課文分享順序。",
            "依照課文分享順序。",
            "依照課文分享順序。"
          ],
          "hints": [
            "找連接詞。",
            "回想先後順序。",
            "先甩餅，再麵，最後壽司。"
          ],
          "explanation": "連接詞把一堂課的分享串起來。",
          "refs": [
            {
              "para": 2,
              "sentences": [
                0,
                1
              ],
              "sha": [
                "c7faad5e",
                "83b74ad0"
              ]
            },
            {
              "para": 3,
              "sentences": [
                0,
                1
              ],
              "sha": [
                "8fae5de6",
                "698c4d64"
              ]
            },
            {
              "para": 4,
              "sentences": [
                1,
                2
              ],
              "sha": [
                "0ca4f7a1",
                "01f910e1"
              ]
            }
          ]
        }
      ],
      "strategies": [
        {
          "id": "tasty-theme",
          "type": "causeEffect",
          "prompt": "巧文姐姐最喜歡用什麼方式探索多元的文化？",
          "hint": "留意姐姐說最喜歡的方式。",
          "focus": 50,
          "options": [
            {
              "label": "透過味覺",
              "x": 50,
              "y": 57,
              "sprite": "spoon",
              "width": 3,
              "markerOffset": [
                0,
                10
              ],
              "refs": [
                {
                  "para": 5,
                  "sentences": [
                    4
                  ],
                  "sha": [
                    "3212c48e"
                  ]
                }
              ]
            },
            {
              "label": "用文字",
              "x": 43,
              "y": 57,
              "sprite": "book",
              "width": 3,
              "markerOffset": [
                0,
                10
              ],
              "refs": [
                {
                  "para": 5,
                  "sentences": [
                    2
                  ],
                  "sha": [
                    "feeaf77f"
                  ]
                }
              ]
            },
            {
              "label": "用照片",
              "x": 57,
              "y": 57,
              "sprite": "camera",
              "width": 3,
              "markerOffset": [
                0,
                10
              ],
              "refs": [
                {
                  "para": 5,
                  "sentences": [
                    3
                  ],
                  "sha": [
                    "8a020a31"
                  ]
                }
              ]
            }
          ],
          "answer": [
            0
          ],
          "explanation": "姐姐以品嘗美食來認識不同文化。",
          "refs": [
            {
              "para": 5,
              "sentences": [
                2,
                3,
                4
              ],
              "sha": [
                "feeaf77f",
                "8a020a31",
                "3212c48e"
              ]
            }
          ]
        }
      ],
      "timeline": [
        {
          "kind": "intro",
          "refs": [
            {
              "para": 5,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "38570d5a",
                "58be13bf",
                "feeaf77f"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "untilStep": 1,
          "imageIndex": 0
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 5,
              "sentences": [
                3
              ],
              "sha": [
                "8a020a31"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "untilStep": 2,
          "imageIndex": 0
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 5,
              "sentences": [
                4
              ],
              "sha": [
                "3212c48e"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "imageIndex": 0
        },
        {
          "kind": "result",
          "imageIndex": 0
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 6,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "13f9ccd9",
                "69c9e7d5",
                "f379eb03",
                "d6a5593c"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "strategy",
          "id": "tasty-theme"
        },
        {
          "kind": "question"
        }
      ]
    }
  ],
  "safetyReminderCount": 1
};
