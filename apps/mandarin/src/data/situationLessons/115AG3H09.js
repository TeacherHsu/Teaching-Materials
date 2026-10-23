// 原文只在正常解鎖後於記憶體取用；此檔僅存依據索引與雜湊。
export default {
  "schemaVersion": 1,
  "lessonId": "115AG3H09",
  "version": 1,
  "title": "古道上的發現",
  "gateTitle": "阿塱壹古道",
  "introduction": "跟著全家與導遊，走進山海之間，找出古道上的發現。",
  "assetBase": "assets/situation/115AG3H09/",
  "paragraphCounts": [
    4,
    14,
    19,
    4
  ],
  "sentenceCount": 41,
  "storySentenceCount": 41,
  "excludedUnits": [],
  "speakers": {
    "1:0": "",
    "1:1": "",
    "1:2": "",
    "1:3": "",
    "2:0": "",
    "2:1": "",
    "2:2": "",
    "2:3": "",
    "2:4": "弟弟",
    "2:5": "弟弟",
    "2:6": "",
    "2:7": "",
    "2:8": "",
    "2:9": "",
    "2:10": "",
    "2:11": "",
    "2:12": "",
    "2:13": "",
    "3:0": "",
    "3:1": "",
    "3:2": "",
    "3:3": "",
    "3:4": "",
    "3:5": "",
    "3:6": "",
    "3:7": "",
    "3:8": "",
    "3:9": "",
    "3:10": "",
    "3:11": "",
    "3:12": "",
    "3:13": "",
    "3:14": "導遊",
    "3:15": "導遊",
    "3:16": "導遊",
    "3:17": "導遊",
    "3:18": "導遊",
    "4:0": "",
    "4:1": "",
    "4:2": "",
    "4:3": ""
  },
  "source": {
    "text": "教師核定本機來源與正式密文核對",
    "questions": "官方題號對應見實作紀錄",
    "strategy": "預測、摹寫、因果與遊記排序",
    "checked": "2026-10-23"
  },
  "ui": {
    "enter": "走進古道",
    "return": "回到場景",
    "speaker": "",
    "character": "我",
    "context": "我只以第一人稱手部出現；插畫為閱讀示意。",
    "safety": "只操作畫面中的物件。"
  },
  "meter": {
    "title": "古道上的發現",
    "subject": "古道",
    "states": [
      "交通要道",
      "林投樹的果實",
      "木棧道",
      "海天一色",
      "南田石"
    ],
    "faces": [
      "🥾",
      "🌿",
      "🪵",
      "🌊",
      "📷"
    ],
    "events": [
      {
        "para": 1,
        "n": 3,
        "state": 0,
        "level": 1
      },
      {
        "para": 2,
        "n": 10,
        "state": 1,
        "level": 1
      },
      {
        "para": 2,
        "n": 13,
        "state": 2,
        "level": 1
      },
      {
        "para": 3,
        "n": 1,
        "state": 3,
        "level": 1
      },
      {
        "para": 3,
        "n": 15,
        "state": 4,
        "level": 1
      }
    ]
  },
  "review": [
    [
      "沿路發現",
      "跟著遊記的順序回想山路、果實、棧道、大海與石頭。"
    ],
    [
      "留下美景",
      "用照片記住美景，把石頭留在原地。"
    ]
  ],
  "ending": {
    "title": "全家沿古道走過山海，拍照留下旅程的發現。",
    "refs": [
      {
        "para": 4,
        "sentences": [
          0,
          1,
          2,
          3
        ],
        "sha": [
          "34a8e6b8",
          "46b4a922",
          "6a8bbaf0",
          "5086bd43"
        ]
      }
    ]
  },
  "scenes": [
    {
      "id": "alangyi-1",
      "act": 1,
      "title": "沿山路找發現",
      "goal": "點腳印跟上導遊",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG3H09/",
      "art": {
        "images": [
          "trail.webp",
          "fruit.webp"
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
          1,
          1
        ]
      },
      "operation": {
        "type": "observe",
        "steps": [
          "foot-1",
          "foot-2",
          "foot-3",
          "fruit"
        ],
        "objects": [
          {
            "action": "foot-1",
            "label": "踩第1個腳印",
            "x": 48,
            "y": 89,
            "width": 3,
            "ratio": 1.6,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 0,
            "toStep": 0,
            "sprite": "footprint",
            "viewMotion": "approach"
          },
          {
            "action": "foot-2",
            "label": "踩第2個腳印",
            "x": 55,
            "y": 87,
            "width": 3,
            "ratio": 1.6,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 1,
            "toStep": 1,
            "sprite": "footprint",
            "viewMotion": "approach"
          },
          {
            "action": "foot-3",
            "label": "踩第3個腳印",
            "x": 59,
            "y": 82,
            "width": 3,
            "ratio": 1.6,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 2,
            "toStep": 2,
            "sprite": "footprint",
            "viewMotion": "approach"
          },
          {
            "action": "fruit",
            "label": "看清樹叢上的果實",
            "x": 49,
            "y": 70,
            "width": 5,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 3,
            "toStep": 3,
            "viewMotion": "approach"
          }
        ],
        "silentObserve": true,
        "hideOnResult": true,
        "prompts": [
          "點第一個腳印",
          "點第二個腳印",
          "點第三個腳印",
          "點樹叢果實"
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
            "x": 43,
            "y": 28,
            "width": 6,
            "ratio": 1
          },
          {
            "x": 57,
            "y": 28,
            "width": 6,
            "ratio": 1
          }
        ]
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
          "state": 1,
          "level": 1
        }
      ],
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
              "5bf0f68d",
              "26253f92",
              "f679ae2e",
              "8d242ccb"
            ]
          },
          {
            "para": 2,
            "sentences": [
              0
            ],
            "sha": [
              "395434ee"
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
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8,
              9,
              10
            ],
            "sha": [
              "d51f0c47",
              "9622e114",
              "7e9e025f",
              "b557c412",
              "17604013",
              "5ecdce63",
              "4c19ab31",
              "598715cf",
              "95aff9c7",
              "85e3e144"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "alangyi-evidence-1",
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
                "5bf0f68d",
                "26253f92",
                "f679ae2e",
                "8d242ccb"
              ]
            },
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
                10
              ],
              "sha": [
                "395434ee",
                "d51f0c47",
                "9622e114",
                "7e9e025f",
                "b557c412",
                "17604013",
                "5ecdce63",
                "4c19ab31",
                "598715cf",
                "95aff9c7",
                "85e3e144"
              ]
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "alangyi-summary-1",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "全家跟導遊走山路，發現像鳳梨的林投果。",
            "全家走下木棧道，看見大海。",
            "爸爸媽媽帶孩子在海岸疊石頭。"
          ],
          "answer": 0,
          "why": [
            "把人物和這一幕的發現連起來。",
            "這張圖的事件不是本幕重點。",
            "這張圖的事件不是本幕重點。"
          ],
          "hints": [
            "想想大家走到哪裡。",
            "找出這一幕的新發現。",
            "選出人物和事件都有的卡。"
          ],
          "explanation": "全家跟導遊走山路，發現像鳳梨的林投果。",
          "summaryImages": [
            "sprites/summary-fruit.webp",
            "sprites/summary-boardwalk.webp",
            "sprites/summary-stones.webp"
          ],
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
                "5bf0f68d",
                "26253f92",
                "f679ae2e",
                "8d242ccb"
              ]
            },
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
                10
              ],
              "sha": [
                "395434ee",
                "d51f0c47",
                "9622e114",
                "7e9e025f",
                "b557c412",
                "17604013",
                "5ecdce63",
                "4c19ab31",
                "598715cf",
                "95aff9c7",
                "85e3e144"
              ]
            }
          ]
        }
      ],
      "strategies": [
        {
          "id": "fruit-predict",
          "type": "predict",
          "prompt": "那會是什麼？",
          "options": [
            "鳳梨",
            "別的果實",
            "我不確定"
          ],
          "hint": "先猜猜，再看課文。",
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
                10
              ],
              "sha": [
                "b557c412",
                "17604013",
                "5ecdce63",
                "4c19ab31",
                "598715cf",
                "95aff9c7",
                "85e3e144"
              ]
            }
          ],
          "revealAt": {
            "para": 2,
            "n": 10
          }
        }
      ],
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
                "5bf0f68d",
                "26253f92",
                "f679ae2e",
                "8d242ccb"
              ]
            },
            {
              "para": 2,
              "sentences": [
                0
              ],
              "sha": [
                "395434ee"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "untilStep": 3
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 2,
              "sentences": [
                1,
                2,
                3,
                4,
                5
              ],
              "sha": [
                "d51f0c47",
                "9622e114",
                "7e9e025f",
                "b557c412",
                "17604013"
              ]
            }
          ],
          "imageIndex": 1
        },
        {
          "kind": "strategy",
          "id": "fruit-predict"
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 2,
              "sentences": [
                6,
                7,
                8,
                9
              ],
              "sha": [
                "5ecdce63",
                "4c19ab31",
                "598715cf",
                "95aff9c7"
              ]
            }
          ],
          "imageIndex": 1
        },
        {
          "kind": "act"
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 2,
              "sentences": [
                10
              ],
              "sha": [
                "85e3e144"
              ]
            }
          ],
          "imageIndex": 1
        },
        {
          "kind": "result"
        },
        {
          "kind": "question"
        }
      ],
      "meterRevealAt": {
        "para": 1,
        "n": 3
      }
    },
    {
      "id": "alangyi-2",
      "act": 2,
      "title": "樹叢後面的路",
      "goal": "點縫隙找路",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG3H09/",
      "art": {
        "images": [
          "gap.webp",
          "boardwalk.webp",
          "sea.webp"
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
          1,
          1,
          1,
          1,
          1,
          2
        ]
      },
      "operation": {
        "type": "observe",
        "steps": [
          "gap",
          "stair-1",
          "stair-2",
          "stair-3",
          "stair-4",
          "stair-5"
        ],
        "objects": [
          {
            "action": "gap",
            "label": "點樹叢縫隙找路",
            "x": 50,
            "y": 56,
            "width": 5,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 0,
            "toStep": 0,
            "viewMotion": "approach"
          },
          {
            "action": "stair-1",
            "label": "走木棧道第1階",
            "x": 50,
            "y": 48,
            "width": 7,
            "ratio": 0.32,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 1,
            "toStep": 1,
            "minIntervalMs": 600,
            "intervalGroup": "boardwalk",
            "gentlePrompt": "小心，一步一步走",
            "viewMotion": "approach"
          },
          {
            "action": "stair-2",
            "label": "走木棧道第2階",
            "x": 50,
            "y": 55,
            "width": 7,
            "ratio": 0.32,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 2,
            "toStep": 2,
            "minIntervalMs": 600,
            "intervalGroup": "boardwalk",
            "gentlePrompt": "小心，一步一步走",
            "viewMotion": "approach"
          },
          {
            "action": "stair-3",
            "label": "走木棧道第3階",
            "x": 50,
            "y": 62,
            "width": 7,
            "ratio": 0.32,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 3,
            "toStep": 3,
            "minIntervalMs": 600,
            "intervalGroup": "boardwalk",
            "gentlePrompt": "小心，一步一步走",
            "viewMotion": "approach"
          },
          {
            "action": "stair-4",
            "label": "走木棧道第4階",
            "x": 50,
            "y": 69,
            "width": 7,
            "ratio": 0.32,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 4,
            "toStep": 4,
            "minIntervalMs": 600,
            "intervalGroup": "boardwalk",
            "gentlePrompt": "小心，一步一步走",
            "viewMotion": "approach"
          },
          {
            "action": "stair-5",
            "label": "走木棧道第5階",
            "x": 50,
            "y": 76,
            "width": 7,
            "ratio": 0.32,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 5,
            "toStep": 5,
            "minIntervalMs": 600,
            "intervalGroup": "boardwalk",
            "gentlePrompt": "小心，一步一步走",
            "viewMotion": "approach"
          }
        ],
        "silentObserve": true,
        "hideOnResult": true,
        "prompts": [
          "點樹叢縫隙",
          "一步一步點木階",
          "一步一步點木階",
          "一步一步點木階",
          "一步一步點木階",
          "一步一步點木階"
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
            "x": 43,
            "y": 28,
            "width": 6,
            "ratio": 1
          },
          {
            "x": 57,
            "y": 28,
            "width": 6,
            "ratio": 1
          }
        ]
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
        },
        {
          "state": 2,
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
            "para": 2,
            "sentences": [
              11,
              12
            ],
            "sha": [
              "8a68d76f",
              "28145e01"
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
              13
            ],
            "sha": [
              "4c25d560"
            ]
          },
          {
            "para": 3,
            "sentences": [
              0,
              1
            ],
            "sha": [
              "e4bc5e6e",
              "f0f1d02e"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "alangyi-evidence-2",
          "refs": [
            {
              "para": 2,
              "sentences": [
                11,
                12,
                13
              ],
              "sha": [
                "8a68d76f",
                "28145e01",
                "4c25d560"
              ]
            },
            {
              "para": 3,
              "sentences": [
                0,
                1
              ],
              "sha": [
                "e4bc5e6e",
                "f0f1d02e"
              ]
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "alangyi-summary-2",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "全家發現木棧道，小心走下後看見大海。",
            "全家看見像鳳梨的林投果。",
            "爸爸媽媽帶孩子在海岸疊石頭。"
          ],
          "answer": 0,
          "why": [
            "把人物和這一幕的發現連起來。",
            "這張圖的事件不是本幕重點。",
            "這張圖的事件不是本幕重點。"
          ],
          "hints": [
            "想想大家走到哪裡。",
            "找出這一幕的新發現。",
            "選出人物和事件都有的卡。"
          ],
          "explanation": "全家發現木棧道，小心走下後看見大海。",
          "summaryImages": [
            "sprites/summary-boardwalk.webp",
            "sprites/summary-fruit.webp",
            "sprites/summary-stones.webp"
          ],
          "refs": [
            {
              "para": 2,
              "sentences": [
                11,
                12,
                13
              ],
              "sha": [
                "8a68d76f",
                "28145e01",
                "4c25d560"
              ]
            },
            {
              "para": 3,
              "sentences": [
                0,
                1
              ],
              "sha": [
                "e4bc5e6e",
                "f0f1d02e"
              ]
            }
          ]
        }
      ],
      "strategies": [],
      "timeline": [
        {
          "kind": "intro",
          "refs": [
            {
              "para": 2,
              "sentences": [
                11,
                12
              ],
              "sha": [
                "8a68d76f",
                "28145e01"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "untilStep": 1
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 2,
              "sentences": [
                13
              ],
              "sha": [
                "4c25d560"
              ]
            },
            {
              "para": 3,
              "sentences": [
                0
              ],
              "sha": [
                "e4bc5e6e"
              ]
            }
          ],
          "imageIndex": 1
        },
        {
          "kind": "act"
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 3,
              "sentences": [
                1
              ],
              "sha": [
                "f0f1d02e"
              ]
            }
          ],
          "imageIndex": 2
        },
        {
          "kind": "result"
        },
        {
          "kind": "question"
        }
      ]
    },
    {
      "id": "alangyi-3",
      "act": 3,
      "title": "海水的顏色與聲音",
      "goal": "依深到淺點色卡",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG3H09/",
      "art": {
        "images": [
          "sea.webp"
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
          "blue-1",
          "blue-2",
          "blue-3",
          "blue-4",
          "blue-5",
          "wave"
        ],
        "objects": [
          {
            "action": "blue-1",
            "label": "第1張色卡：最深藍",
            "x": 54,
            "y": 63,
            "width": 3.2,
            "ratio": 0.65,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 0,
            "toStep": 4,
            "sprite": "blue-1",
            "viewMotion": "approach",
            "destination": [
              42,
              46
            ],
            "destinationWidth": 3,
            "successCount": 1
          },
          {
            "action": "blue-2",
            "label": "第2張色卡：深藍",
            "x": 46,
            "y": 63,
            "width": 3.2,
            "ratio": 0.65,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 0,
            "toStep": 4,
            "sprite": "blue-2",
            "viewMotion": "approach",
            "destination": [
              46,
              46
            ],
            "destinationWidth": 3,
            "successCount": 2
          },
          {
            "action": "blue-3",
            "label": "第3張色卡：中藍",
            "x": 58,
            "y": 63,
            "width": 3.2,
            "ratio": 0.65,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 0,
            "toStep": 4,
            "sprite": "blue-3",
            "viewMotion": "approach",
            "destination": [
              50,
              46
            ],
            "destinationWidth": 3,
            "successCount": 3
          },
          {
            "action": "blue-4",
            "label": "第4張色卡：淺藍",
            "x": 50,
            "y": 63,
            "width": 3.2,
            "ratio": 0.65,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 0,
            "toStep": 4,
            "sprite": "blue-4",
            "viewMotion": "approach",
            "destination": [
              54,
              46
            ],
            "destinationWidth": 3,
            "successCount": 4
          },
          {
            "action": "blue-5",
            "label": "第5張色卡：最淺藍",
            "x": 42,
            "y": 63,
            "width": 3.2,
            "ratio": 0.65,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 0,
            "toStep": 4,
            "sprite": "blue-5",
            "viewMotion": "approach",
            "destination": [
              58,
              46
            ],
            "destinationWidth": 3,
            "successCount": 5
          },
          {
            "action": "wave",
            "label": "點白色浪花聽浪聲",
            "x": 50,
            "y": 57,
            "width": 10,
            "ratio": 0.5,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 5,
            "toStep": 5,
            "viewMotion": "coastalWave"
          }
        ],
        "silentObserve": true,
        "hideOnResult": true,
        "prompts": [
          "依深到淺點色卡",
          "依深到淺點色卡",
          "依深到淺點色卡",
          "依深到淺點色卡",
          "依深到淺點色卡",
          "點浪花聽浪聲"
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
            "x": 43,
            "y": 28,
            "width": 6,
            "ratio": 1
          },
          {
            "x": 57,
            "y": 28,
            "width": 6,
            "ratio": 1
          }
        ],
        "retry": "從剩下最深的藍開始"
      },
      "meter": [
        {
          "state": 3,
          "level": 1
        },
        {
          "state": 3,
          "level": 1
        },
        {
          "state": 3,
          "level": 1
        },
        {
          "state": 3,
          "level": 1
        },
        {
          "state": 3,
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
            "para": 3,
            "sentences": [
              2,
              3
            ],
            "sha": [
              "d9fca26f",
              "825651e1"
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
              4,
              5,
              6,
              7
            ],
            "sha": [
              "55214f8e",
              "732d4ecb",
              "3fb8071a",
              "3101fcd3"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "alangyi-evidence-3",
          "refs": [
            {
              "para": 3,
              "sentences": [
                2,
                3,
                4,
                5,
                6,
                7
              ],
              "sha": [
                "d9fca26f",
                "825651e1",
                "55214f8e",
                "732d4ecb",
                "3fb8071a",
                "3101fcd3"
              ]
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "alangyi-summary-3",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "全家看深淺藍色的大海，聽風聲和浪聲。",
            "全家在山路看見林投果。",
            "爸爸媽媽帶孩子在海岸疊石頭。"
          ],
          "answer": 0,
          "why": [
            "把人物和這一幕的發現連起來。",
            "這張圖的事件不是本幕重點。",
            "這張圖的事件不是本幕重點。"
          ],
          "hints": [
            "想想大家走到哪裡。",
            "找出這一幕的新發現。",
            "選出人物和事件都有的卡。"
          ],
          "explanation": "全家看深淺藍色的大海，聽風聲和浪聲。",
          "summaryImages": [
            "sprites/summary-sea.webp",
            "sprites/summary-fruit.webp",
            "sprites/summary-stones.webp"
          ],
          "refs": [
            {
              "para": 3,
              "sentences": [
                2,
                3,
                4,
                5,
                6,
                7
              ],
              "sha": [
                "d9fca26f",
                "825651e1",
                "55214f8e",
                "732d4ecb",
                "3fb8071a",
                "3101fcd3"
              ]
            }
          ]
        },
        {
          "id": "sound-writing",
          "type": "choice",
          "operationType": "chooseCard",
          "stem": "哪一句寫出聲音？",
          "options": [
            "浪花像唱歌一樣輕輕響。",
            "海水從深藍變成淺藍。"
          ],
          "answer": 0,
          "why": [
            "用唱歌來描寫聽見的浪聲。",
            "這個選項寫的是看見的顏色。"
          ],
          "hints": [
            "想想耳朵聽見什麼。",
            "找和唱歌有關的寫法。",
            "顏色是用眼睛看的。"
          ],
          "explanation": "把海浪聲寫成歌聲，讓讀者像在海邊聆聽。",
          "refs": [
            {
              "para": 3,
              "sentences": [
                2,
                3,
                4,
                5,
                6,
                7
              ],
              "sha": [
                "d9fca26f",
                "825651e1",
                "55214f8e",
                "732d4ecb",
                "3fb8071a",
                "3101fcd3"
              ]
            }
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
                2,
                3
              ],
              "sha": [
                "d9fca26f",
                "825651e1"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "untilStep": 5
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 3,
              "sentences": [
                4,
                5
              ],
              "sha": [
                "55214f8e",
                "732d4ecb"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act"
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 3,
              "sentences": [
                6,
                7
              ],
              "sha": [
                "3fb8071a",
                "3101fcd3"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "result"
        },
        {
          "kind": "question"
        }
      ]
    },
    {
      "id": "alangyi-4",
      "act": 4,
      "title": "把美景留在海岸",
      "goal": "點原地石頭疊好",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG3H09/",
      "art": {
        "images": [
          "stones.webp"
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
          0,
          0,
          0
        ]
      },
      "operation": {
        "type": "observe",
        "steps": [
          "stone-1",
          "stone-2",
          "stone-3",
          "stone-4",
          "stone-5",
          "stone-6",
          "stone-7",
          "photo"
        ],
        "objects": [
          {
            "action": "stone-1",
            "label": "疊原地第1顆石頭",
            "x": 45,
            "y": 84,
            "width": 7,
            "ratio": 0.48,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 0,
            "toStep": 8,
            "sprite": "stone-1",
            "destination": [
              53,
              84
            ],
            "viewMotion": "approach",
            "successCount": 1
          },
          {
            "action": "stone-2",
            "label": "疊原地第2顆石頭",
            "x": 45,
            "y": 84,
            "width": 6.5,
            "ratio": 0.48,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 1,
            "toStep": 8,
            "sprite": "stone-2",
            "destination": [
              53,
              79.5
            ],
            "viewMotion": "approach",
            "successCount": 2
          },
          {
            "action": "stone-3",
            "label": "疊原地第3顆石頭",
            "x": 45,
            "y": 84,
            "width": 6,
            "ratio": 0.48,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 2,
            "toStep": 8,
            "sprite": "stone-3",
            "destination": [
              53,
              75
            ],
            "viewMotion": "approach",
            "successCount": 3
          },
          {
            "action": "stone-4",
            "label": "疊原地第4顆石頭",
            "x": 45,
            "y": 84,
            "width": 5.5,
            "ratio": 0.48,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 3,
            "toStep": 8,
            "sprite": "stone-4",
            "destination": [
              53,
              70.5
            ],
            "viewMotion": "approach",
            "successCount": 4
          },
          {
            "action": "stone-5",
            "label": "疊原地第5顆石頭",
            "x": 45,
            "y": 84,
            "width": 5,
            "ratio": 0.48,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 4,
            "toStep": 8,
            "sprite": "stone-5",
            "destination": [
              53,
              66
            ],
            "viewMotion": "approach",
            "successCount": 5
          },
          {
            "action": "stone-6",
            "label": "疊原地第6顆石頭",
            "x": 45,
            "y": 84,
            "width": 4.5,
            "ratio": 0.48,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 5,
            "toStep": 8,
            "sprite": "stone-6",
            "destination": [
              53,
              61.5
            ],
            "viewMotion": "approach",
            "successCount": 6
          },
          {
            "action": "stone-7",
            "label": "疊原地第7顆石頭",
            "x": 45,
            "y": 84,
            "width": 4,
            "ratio": 0.48,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 6,
            "toStep": 8,
            "sprite": "stone-7",
            "destination": [
              53,
              57
            ],
            "viewMotion": "approach",
            "successCount": 7
          },
          {
            "action": "photo",
            "label": "選擇拍照留下美景",
            "x": 43,
            "y": 72,
            "width": 5,
            "ratio": 0.8,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 7,
            "toStep": 7,
            "sprite": "camera",
            "viewMotion": "cameraFlash"
          },
          {
            "action": "take-home",
            "label": "選擇把南田石帶回家",
            "x": 59,
            "y": 72,
            "width": 5,
            "ratio": 0.5,
            "angle": 0,
            "grounded": true,
            "hotspot": true,
            "gesture": "observe",
            "observation": "",
            "fromStep": 7,
            "toStep": 7,
            "sprite": "stone-3",
            "returnOnTap": "導遊說：只能拍照，不能帶走"
          }
        ],
        "silentObserve": true,
        "hideOnResult": false,
        "prompts": [
          "點原地石頭疊好",
          "點原地石頭疊好",
          "點原地石頭疊好",
          "點原地石頭疊好",
          "點原地石頭疊好",
          "點原地石頭疊好",
          "點原地石頭疊好",
          "選拍照或帶回家"
        ],
        "focus": [
          50,
          50,
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
            "x": 43,
            "y": 28,
            "width": 6,
            "ratio": 1
          },
          {
            "x": 57,
            "y": 28,
            "width": 6,
            "ratio": 1
          }
        ]
      },
      "meter": [
        {
          "state": 3,
          "level": 1
        },
        {
          "state": 3,
          "level": 1
        },
        {
          "state": 3,
          "level": 1
        },
        {
          "state": 3,
          "level": 1
        },
        {
          "state": 3,
          "level": 1
        },
        {
          "state": 3,
          "level": 1
        },
        {
          "state": 3,
          "level": 1
        },
        {
          "state": 4,
          "level": 1
        },
        {
          "state": 4,
          "level": 1
        }
      ],
      "beats": {
        "intro": [
          {
            "para": 3,
            "sentences": [
              8,
              9,
              10
            ],
            "sha": [
              "430383ee",
              "94916f31",
              "27d7adf9"
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
              11,
              12,
              13,
              14,
              15,
              16,
              17,
              18
            ],
            "sha": [
              "552dd821",
              "44621546",
              "d03cd07a",
              "eeada6cc",
              "4ff770cb",
              "e71fbc8d",
              "c891f484",
              "f6def692"
            ]
          },
          {
            "para": 4,
            "sentences": [
              0,
              1,
              2,
              3
            ],
            "sha": [
              "34a8e6b8",
              "46b4a922",
              "6a8bbaf0",
              "5086bd43"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "alangyi-evidence-4",
          "refs": [
            {
              "para": 3,
              "sentences": [
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15,
                16,
                17,
                18
              ],
              "sha": [
                "430383ee",
                "94916f31",
                "27d7adf9",
                "552dd821",
                "44621546",
                "d03cd07a",
                "eeada6cc",
                "4ff770cb",
                "e71fbc8d",
                "c891f484",
                "f6def692"
              ]
            },
            {
              "para": 4,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "34a8e6b8",
                "46b4a922",
                "6a8bbaf0",
                "5086bd43"
              ]
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "alangyi-summary-4",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "爸媽帶孩子疊南田石，全家拍照並留下美景。",
            "全家沿山路看見林投果。",
            "全家一步一步走下木棧道。"
          ],
          "answer": 0,
          "why": [
            "把人物和這一幕的發現連起來。",
            "這張圖的事件不是本幕重點。",
            "這張圖的事件不是本幕重點。"
          ],
          "hints": [
            "想想大家走到哪裡。",
            "找出這一幕的新發現。",
            "選出人物和事件都有的卡。"
          ],
          "explanation": "爸媽帶孩子疊南田石，全家拍照並留下美景。",
          "summaryImages": [
            "sprites/summary-stones.webp",
            "sprites/summary-fruit.webp",
            "sprites/summary-boardwalk.webp"
          ],
          "refs": [
            {
              "para": 3,
              "sentences": [
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15,
                16,
                17,
                18
              ],
              "sha": [
                "430383ee",
                "94916f31",
                "27d7adf9",
                "552dd821",
                "44621546",
                "d03cd07a",
                "eeada6cc",
                "4ff770cb",
                "e71fbc8d",
                "c891f484",
                "f6def692"
              ]
            },
            {
              "para": 4,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "34a8e6b8",
                "46b4a922",
                "6a8bbaf0",
                "5086bd43"
              ]
            }
          ]
        },
        {
          "id": "journey-order",
          "type": "order",
          "operationType": "orderCards",
          "stem": "把古道上的五件事排好",
          "options": [
            "走山路",
            "看到林投果",
            "走下木棧道",
            "看海天一色",
            "疊南田石"
          ],
          "answer": [
            0,
            1,
            2,
            3,
            4
          ],
          "initialOrder": [
            3,
            0,
            4,
            1,
            2
          ],
          "lockOrderSelections": true,
          "why": [
            "回想沿路先後發生的事。",
            "回想沿路先後發生的事。",
            "回想沿路先後發生的事。",
            "回想沿路先後發生的事。",
            "回想沿路先後發生的事。"
          ],
          "hints": [
            "先走山路。",
            "木棧道後才看見海。",
            "最後在海岸疊石頭。"
          ],
          "explanation": "沿路的發現串起全家的古道旅程。",
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
                11,
                12,
                13
              ],
              "sha": [
                "395434ee",
                "d51f0c47",
                "9622e114",
                "7e9e025f",
                "b557c412",
                "17604013",
                "5ecdce63",
                "4c19ab31",
                "598715cf",
                "95aff9c7",
                "85e3e144",
                "8a68d76f",
                "28145e01",
                "4c25d560"
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
                13,
                14,
                15,
                16,
                17,
                18
              ],
              "sha": [
                "e4bc5e6e",
                "f0f1d02e",
                "d9fca26f",
                "825651e1",
                "55214f8e",
                "732d4ecb",
                "3fb8071a",
                "3101fcd3",
                "430383ee",
                "94916f31",
                "27d7adf9",
                "552dd821",
                "44621546",
                "d03cd07a",
                "eeada6cc",
                "4ff770cb",
                "e71fbc8d",
                "c891f484",
                "f6def692"
              ]
            },
            {
              "para": 4,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "34a8e6b8",
                "46b4a922",
                "6a8bbaf0",
                "5086bd43"
              ]
            }
          ]
        }
      ],
      "strategies": [
        {
          "id": "stone-care",
          "type": "causeEffect",
          "prompt": "為什麼南田石只能拍照，不能帶走？",
          "hint": "想想留下石頭會怎樣。",
          "focus": 50,
          "options": [
            {
              "label": "美石、美景才能長久",
              "x": 44,
              "y": 40,
              "sprite": "coast-card",
              "width": 6,
              "markerOffset": [
                0,
                13
              ],
              "refs": [
                {
                  "para": 3,
                  "sentences": [
                    14,
                    15,
                    16,
                    17,
                    18
                  ],
                  "sha": [
                    "eeada6cc",
                    "4ff770cb",
                    "e71fbc8d",
                    "c891f484",
                    "f6def692"
                  ]
                }
              ]
            },
            {
              "label": "石頭太重拿不動",
              "x": 56,
              "y": 40,
              "sprite": "heavy-card",
              "width": 6,
              "markerOffset": [
                0,
                13
              ],
              "refs": [
                {
                  "para": 3,
                  "sentences": [
                    9,
                    10,
                    11,
                    12,
                    13,
                    14,
                    15,
                    16,
                    17,
                    18
                  ],
                  "sha": [
                    "94916f31",
                    "27d7adf9",
                    "552dd821",
                    "44621546",
                    "d03cd07a",
                    "eeada6cc",
                    "4ff770cb",
                    "e71fbc8d",
                    "c891f484",
                    "f6def692"
                  ]
                }
              ]
            }
          ],
          "answer": [
            0
          ],
          "explanation": "讓石頭留在原地，後來的人也能欣賞完整的海岸。",
          "refs": [
            {
              "para": 3,
              "sentences": [
                14,
                15,
                16,
                17,
                18
              ],
              "sha": [
                "eeada6cc",
                "4ff770cb",
                "e71fbc8d",
                "c891f484",
                "f6def692"
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
              "para": 3,
              "sentences": [
                8,
                9,
                10
              ],
              "sha": [
                "430383ee",
                "94916f31",
                "27d7adf9"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "untilStep": 7
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 3,
              "sentences": [
                11,
                12,
                13,
                14,
                15
              ],
              "sha": [
                "552dd821",
                "44621546",
                "d03cd07a",
                "eeada6cc",
                "4ff770cb"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act"
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 3,
              "sentences": [
                16,
                17,
                18
              ],
              "sha": [
                "e71fbc8d",
                "c891f484",
                "f6def692"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "strategy",
          "id": "stone-care"
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 4,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "34a8e6b8",
                "46b4a922",
                "6a8bbaf0",
                "5086bd43"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "result"
        },
        {
          "kind": "question"
        }
      ],
      "meterRevealAt": {
        "para": 3,
        "n": 15
      }
    }
  ]
};
