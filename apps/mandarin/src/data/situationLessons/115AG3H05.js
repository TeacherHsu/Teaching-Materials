// 僅存教師核定改寫、索引與雜湊；原文留在正式密碼門後。
export default {
  "schemaVersion": 1,
  "lessonId": "115AG3H05",
  "version": 1,
  "title": "為梨花撐傘",
  "gateTitle": "為梨花撐傘",
  "introduction": "跟著翁先生觀察梨園，一起試試保護梨花的方法。",
  "assetBase": "assets/situation/115AG3H05/",
  "paragraphCounts": [
    14,
    11,
    12,
    7
  ],
  "sentenceCount": 44,
  "source": {
    "text": "教師核定本機翰林三上第五課，正文四段",
    "questions": "官方閱讀理解提問；題號見實作紀錄",
    "strategy": "因果、程序、預測、情緒線索與摘要",
    "checked": "2026-10-23"
  },
  "ui": {
    "enter": "走進梨園",
    "return": "回到梨園",
    "speaker": "旁白",
    "character": "翁先生",
    "context": "跟著翁先生一起試，插畫是閱讀示意。",
    "safety": "只操作畫面中的物件。"
  },
  "meter": {
    "title": "梨花狀況",
    "subject": "梨花",
    "labels": [
      "淋雨腐爛",
      "撐著小雨傘",
      "結出的果實比較多"
    ],
    "states": [
      "淋雨而腐爛",
      "撐著小雨傘",
      "果實"
    ],
    "faces": [
      "🌧️",
      "☂️",
      "🍐"
    ],
    "stateEvidence": [
      {
        "refs": [
          {
            "para": 1,
            "sentences": [
              5
            ],
            "sha": [
              "c9c4b1bc"
            ]
          }
        ],
        "parts": [
          "淋雨",
          "腐爛"
        ]
      },
      {
        "refs": [
          {
            "para": 2,
            "sentences": [
              6
            ],
            "sha": [
              "de9d884b"
            ]
          }
        ],
        "parts": [
          "撐著小雨傘"
        ]
      },
      {
        "refs": [
          {
            "para": 2,
            "sentences": [
              10
            ],
            "sha": [
              "f47f2969"
            ]
          }
        ],
        "parts": [
          "結出的果實",
          "比",
          "多"
        ]
      }
    ]
  },
  "review": [
    [
      "遇到問題",
      "觀察雨水對花朵的影響。"
    ],
    [
      "試出方法",
      "比較有保護和沒保護的收成。"
    ],
    [
      "繼續改良",
      "讓固定工具的步驟更方便。"
    ]
  ],
  "ending": {
    "title": "把問題、方法與改良連起來",
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
          6
        ],
        "sha": [
          "a68f48df",
          "cd072ea7",
          "429d4a33",
          "51ba757c",
          "4f673c45",
          "308f856e",
          "fe1b47d8"
        ]
      }
    ]
  },
  "scenes": [
    {
      "id": "pear-1",
      "act": 1,
      "title": "細雨中的梨園",
      "goal": "點三朵淋濕的梨花",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG3H05/",
      "art": {
        "images": [
          "rain.webp",
          "rain-result.webp"
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
        "resultZoom": false,
        "expressionStates": {
          "淋雨而腐爛": {
            "rain-result.webp": "worry-overlay.webp"
          }
        },
        "resultImage": 1
      },
      "operation": {
        "type": "observe",
        "silentObserve": true,
        "keepCompleted": true,
        "steps": [
          "wet-1",
          "wet-2",
          "wet-3"
        ],
        "collect": [
          "wet-1",
          "wet-2",
          "wet-3"
        ],
        "objects": [
          {
            "action": "wet-1",
            "label": "觀察淋雨的梨花",
            "sprite": "flower-dry",
            "x": 43,
            "y": 65,
            "width": 6,
            "ratio": 0.9775280898876404,
            "angle": 0,
            "usedFade": false,
            "observation": "",
            "completedSprite": "flower-wet",
            "grounded": true
          },
          {
            "action": "wet-2",
            "label": "觀察淋雨的梨花",
            "sprite": "flower-dry",
            "x": 50,
            "y": 65,
            "width": 6,
            "ratio": 0.9775280898876404,
            "angle": 0,
            "usedFade": false,
            "observation": "",
            "completedSprite": "flower-wet",
            "grounded": true
          },
          {
            "action": "wet-3",
            "label": "觀察淋雨的梨花",
            "sprite": "flower-dry",
            "x": 57,
            "y": 65,
            "width": 6,
            "ratio": 0.9775280898876404,
            "angle": 0,
            "usedFade": false,
            "observation": "",
            "completedSprite": "flower-wet",
            "grounded": true
          }
        ]
      },
      "meter": [
        {
          "state": 0,
          "level": 0
        },
        {
          "state": 0,
          "level": 0
        },
        {
          "state": 0,
          "level": 0
        },
        {
          "state": 0,
          "level": 0
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
              3,
              4
            ],
            "sha": [
              "8052b5ae",
              "01c83749",
              "34e25cd5",
              "862cdccd",
              "78283687"
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
            "para": 1,
            "sentences": [
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
              "c9c4b1bc",
              "06d84fe5",
              "011e16bf",
              "b8caac26",
              "53152f74",
              "2343460e",
              "c34a58f0",
              "fd75f010",
              "b9faa3aa"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "evidence",
          "refs": [
            {
              "para": 1,
              "sentences": [
                0,
                1,
                2,
                3,
                4
              ],
              "sha": [
                "8052b5ae",
                "01c83749",
                "34e25cd5",
                "862cdccd",
                "78283687"
              ]
            },
            {
              "para": 1,
              "sentences": [
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
                "c9c4b1bc",
                "06d84fe5",
                "011e16bf",
                "b8caac26",
                "53152f74",
                "2343460e",
                "c34a58f0",
                "fd75f010",
                "b9faa3aa"
              ]
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "summary-1",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "kind": "摘要",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "雨水損傷梨花，翁先生為收成發愁。",
            "梨子很受歡迎。",
            "翁先生只是在欣賞雨景。"
          ],
          "answer": 0,
          "why": [
            "抓住原因與結果。",
            "這是細節，還沒說出整幕重點。",
            "再把發生的事情連起來。"
          ],
          "hints": [
            "想想遇到什麼問題。",
            "想想方法帶來的結果。",
            "找能說出整幕重點的圖卡。"
          ],
          "explanation": "雨水損傷梨花，翁先生為收成發愁。",
          "refs": [
            {
              "para": 1,
              "sentences": [
                0,
                1,
                2,
                3,
                4
              ],
              "sha": [
                "8052b5ae",
                "01c83749",
                "34e25cd5",
                "862cdccd",
                "78283687"
              ]
            },
            {
              "para": 1,
              "sentences": [
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
                "c9c4b1bc",
                "06d84fe5",
                "011e16bf",
                "b8caac26",
                "53152f74",
                "2343460e",
                "c34a58f0",
                "fd75f010",
                "b9faa3aa"
              ]
            }
          ],
          "summaryImages": [
            "rain.webp",
            "rain.webp",
            "rain.webp"
          ]
        }
      ],
      "strategies": [
        {
          "id": "worry",
          "type": "emotionClue",
          "prompt": "找翁先生煩心的線索",
          "hint": "再看看他的眉頭。",
          "meterTarget": "翁先生",
          "refs": [
            {
              "para": 1,
              "sentences": [
                8,
                9,
                10,
                11,
                12,
                13
              ],
              "sha": [
                "b8caac26",
                "53152f74",
                "2343460e",
                "c34a58f0",
                "fd75f010",
                "b9faa3aa"
              ]
            }
          ],
          "options": [
            {
              "label": "皺起眉頭的翁先生",
              "x": 59.5,
              "y": 34,
              "face": {
                "width": 8,
                "height": 23
              },
              "markerOffset": [
                9,
                0
              ],
              "words": [
                "煩心"
              ],
              "refs": [
                {
                  "para": 1,
                  "sentences": [
                    8,
                    9,
                    10,
                    11,
                    12,
                    13
                  ],
                  "sha": [
                    "b8caac26",
                    "53152f74",
                    "2343460e",
                    "c34a58f0",
                    "fd75f010",
                    "b9faa3aa"
                  ]
                }
              ]
            }
          ],
          "answer": [
            0
          ]
        },
        {
          "id": "rain-cause",
          "type": "causeEffect",
          "prompt": "梨花為何受損？",
          "hint": "再找找畫面中的線索。",
          "refs": [
            {
              "para": 1,
              "sentences": [
                3,
                4,
                5,
                6
              ],
              "sha": [
                "862cdccd",
                "78283687",
                "c9c4b1bc",
                "06d84fe5"
              ]
            }
          ],
          "options": [
            {
              "label": "落在花上的雨滴",
              "x": 48,
              "y": 60,
              "refs": [
            {
              "para": 1,
              "sentences": [
                3,
                4,
                5,
                6
              ],
              "sha": [
                "862cdccd",
                "78283687",
                "c9c4b1bc",
                "06d84fe5"
              ]
            }
          ]
            },
            {
              "label": "翁先生的斗笠",
              "x": 79,
              "y": 22,
              "refs": [
            {
              "para": 1,
              "sentences": [
                3,
                4,
                5,
                6
              ],
              "sha": [
                "862cdccd",
                "78283687",
                "c9c4b1bc",
                "06d84fe5"
              ]
            }
          ]
            }
          ],
          "answer": [
            0
          ],
          "result": [
            50,
            65
          ],
          "explanation": "雨落在梨花上，會影響花朵和收成。"
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
                3,
                4
              ],
              "sha": [
                "8052b5ae",
                "01c83749",
                "34e25cd5",
                "862cdccd",
                "78283687"
              ]
            }
          ]
        },
        {
          "kind": "act"
        },
        {
          "kind": "result",
          "imageIndex": 1
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 1,
              "sentences": [
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
                "c9c4b1bc",
                "06d84fe5",
                "011e16bf",
                "b8caac26",
                "53152f74",
                "2343460e",
                "c34a58f0",
                "fd75f010",
                "b9faa3aa"
              ]
            }
          ],
          "imageIndex": 1
        },
        {
          "kind": "strategy",
          "id": "worry",
          "imageIndex": 1
        },
        {
          "kind": "strategy",
          "id": "rain-cause",
          "imageIndex": 1
        },
        {
          "kind": "question"
        }
      ]
    },
    {
      "id": "pear-2",
      "act": 2,
      "title": "空碗的新用法",
      "goal": "先把空碗倒過來",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG3H05/",
      "art": {
        "images": [
          "bowl.webp"
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
        "resultZoom": false
      },
      "operation": {
        "type": "observe",
        "silentObserve": true,
        "keepCompleted": true,
        "steps": [
          "bowl",
          "stick",
          "tie"
        ],
        "prompts": [
          "先把空碗倒過來",
          "插上竹筷子",
          "用膠帶和線綁好",
          "看看花旁的小雨傘"
        ],
        "retry": "先完成目前這一步。",
        "objects": [
          {
            "action": "bowl",
            "label": "把素面空碗倒過來",
            "sprite": "bowl",
            "x": 43,
            "y": 81,
            "width": 10,
            "ratio": 0.9337606837606838,
            "angle": 0,
            "toStep": 0,
            "grounded": true
          },
          {
            "action": "stick",
            "label": "插上竹筷子",
            "sprite": "chopsticks",
            "x": 50,
            "y": 81,
            "width": 7,
            "ratio": 0.9443254817987152,
            "angle": 0,
            "toStep": 1,
            "grounded": true
          },
          {
            "action": "tie",
            "label": "用膠帶和線綁在花旁",
            "sprite": "tape-thread",
            "x": 57,
            "y": 81,
            "width": 8,
            "ratio": 0.95,
            "angle": 0,
            "toStep": 2,
            "grounded": true
          },
          {
            "action": "sheltered",
            "label": "已組裝的小雨傘",
            "sprite": "bowl-umbrella",
            "x": 50,
            "y": 59,
            "width": 13,
            "ratio": 0.9742489270386266,
            "angle": 0,
            "passive": true,
            "fromStep": 3,
            "grounded": true
          },
          {
            "action": "inverted-layer",
            "label": "倒過來的空碗",
            "sprite": "bowl-inverted",
            "x": 50,
            "y": 52,
            "width": 13,
            "ratio": 0.9828693790149893,
            "angle": 0,
            "passive": true,
            "fromStep": 1,
            "toStep": 2,
            "grounded": true
          },
          {
            "action": "stick-layer",
            "label": "支撐空碗的竹筷子",
            "sprite": "chopsticks",
            "x": 50,
            "y": 65,
            "width": 6,
            "ratio": 0.9443254817987152,
            "angle": -35,
            "passive": true,
            "fromStep": 2,
            "toStep": 2,
            "grounded": true
          }
        ],
        "focus": [
          50,
          50,
          50,
          50
        ]
      },
      "meter": [
        {
          "state": 0,
          "level": 0
        },
        {
          "state": 0,
          "level": 0
        },
        {
          "state": 0,
          "level": 0
        },
        {
          "state": 1,
          "level": 1
        }
      ],
      "beats": {
        "intro": [
          {
            "para": 2,
            "sentences": [
              0,
              1,
              2
            ],
            "sha": [
              "ebf316ce",
              "f4d12e8b",
              "b689e251"
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
              3,
              4,
              5,
              6,
              7
            ],
            "sha": [
              "284402d0",
              "3f5e770c",
              "03672f38",
              "de9d884b",
              "d9e43a35"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "evidence",
          "refs": [
            {
              "para": 2,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "ebf316ce",
                "f4d12e8b",
                "b689e251"
              ]
            },
            {
              "para": 2,
              "sentences": [
                3,
                4,
                5,
                6,
                7
              ],
              "sha": [
                "284402d0",
                "3f5e770c",
                "03672f38",
                "de9d884b",
                "d9e43a35"
              ]
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "summary-2",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "kind": "摘要",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "翁先生把空碗、竹筷、膠帶和線做成遮雨工具。",
            "吃完泡麵就完成了工作。",
            "只放一個空碗就能固定在花旁。"
          ],
          "answer": 0,
          "why": [
            "抓住原因與結果。",
            "這是細節，還沒說出整幕重點。",
            "再把發生的事情連起來。"
          ],
          "hints": [
            "想想遇到什麼問題。",
            "想想方法帶來的結果。",
            "找能說出整幕重點的圖卡。"
          ],
          "explanation": "翁先生把空碗、竹筷、膠帶和線做成遮雨工具。",
          "refs": [
            {
              "para": 2,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "ebf316ce",
                "f4d12e8b",
                "b689e251"
              ]
            },
            {
              "para": 2,
              "sentences": [
                3,
                4,
                5,
                6,
                7
              ],
              "sha": [
                "284402d0",
                "3f5e770c",
                "03672f38",
                "de9d884b",
                "d9e43a35"
              ]
            }
          ],
          "summaryImages": [
            "bowl.webp",
            "bowl.webp",
            "bowl.webp"
          ]
        }
      ],
      "strategies": [
        {
          "id": "bowl-predict",
          "type": "predict",
          "prompt": "他會用空碗做什麼？",
          "hint": "可以先猜一猜。",
          "options": [
            "拿來保護梨花",
            "繼續裝東西",
            "我不確定"
          ],
          "refs": [
            {
              "para": 2,
              "sentences": [
                3,
                4,
                5,
                6,
                7
              ],
              "sha": [
                "284402d0",
                "3f5e770c",
                "03672f38",
                "de9d884b",
                "d9e43a35"
              ]
            }
          ],
          "revealAt": {
            "para": 2,
            "n": 3
          }
        }
      ],
      "timeline": [
        {
          "kind": "intro",
          "refs": [
            {
              "para": 2,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "ebf316ce",
                "f4d12e8b",
                "b689e251"
              ]
            }
          ]
        },
        {
          "kind": "strategy",
          "id": "bowl-predict"
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
                3,
                4,
                5,
                6,
                7
              ],
              "sha": [
                "284402d0",
                "3f5e770c",
                "03672f38",
                "de9d884b",
                "d9e43a35"
              ]
            }
          ]
        },
        {
          "kind": "question"
        }
      ]
    },
    {
      "id": "pear-3",
      "act": 3,
      "title": "那一年的收成",
      "goal": "點結果較多的梨樹",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG3H05/",
      "art": {
        "images": [
          "harvest.webp"
        ],
        "aspect": [
          2400,
          1024
        ],
        "hotspots": {},
        "effects": {},
        "views": {
          "work": 0.29
        },
        "orientationFocus": {
          "landscape": 50,
          "portrait": 29
        },
        "readingZoom": false,
        "resultZoom": false
      },
      "operation": {
        "type": "observe",
        "silentObserve": true,
        "steps": [
          "protected",
          "unprotected"
        ],
        "prompts": [
          "點結果較多的梨樹",
          "再看沒撐傘的梨樹",
          "比較兩棵樹的收成"
        ],
        "retry": "先找結果較多的樹。",
        "focus": [
          29,
          70,
          50
        ],
        "objects": [
          {
            "action": "protected",
            "label": "曾撐傘、結果較多的梨樹",
            "x": 29,
            "y": 49,
            "width": 7,
            "ratio": 1,
            "angle": 0,
            "hotspot": true,
            "observation": "",
            "grounded": true
          },
          {
            "action": "unprotected",
            "label": "沒有撐傘、結果較少的梨樹",
            "x": 70,
            "y": 49,
            "width": 7,
            "ratio": 1,
            "angle": 0,
            "hotspot": true,
            "observation": "",
            "grounded": true
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
          "level": 3
        },
        {
          "state": 2,
          "level": 3
        }
      ],
      "beats": {
        "intro": [],
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
              8,
              9,
              10
            ],
            "sha": [
              "7b59582c",
              "1f9c90e0",
              "f47f2969"
            ]
          },
          {
            "para": 3,
            "sentences": [
              0,
              1,
              2,
              3
            ],
            "sha": [
              "8e1ee9f3",
              "0d060f9f",
              "6ac7dde7",
              "46a99bd9"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "evidence",
          "refs": [
            {
              "para": 2,
              "sentences": [
                8,
                9,
                10
              ],
              "sha": [
                "7b59582c",
                "1f9c90e0",
                "f47f2969"
              ]
            },
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "8e1ee9f3",
                "0d060f9f",
                "6ac7dde7",
                "46a99bd9"
              ]
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "summary-3",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "kind": "摘要",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "保護梨花的辦法有效，其他梨農也跟著學。",
            "所有梨樹的收成都一樣多。",
            "梨農只關心樹的外形。"
          ],
          "answer": 0,
          "why": [
            "抓住原因與結果。",
            "這是細節，還沒說出整幕重點。",
            "再把發生的事情連起來。"
          ],
          "hints": [
            "想想遇到什麼問題。",
            "想想方法帶來的結果。",
            "找能說出整幕重點的圖卡。"
          ],
          "explanation": "保護梨花的辦法有效，其他梨農也跟著學。",
          "refs": [
            {
              "para": 2,
              "sentences": [
                8,
                9,
                10
              ],
              "sha": [
                "7b59582c",
                "1f9c90e0",
                "f47f2969"
              ]
            },
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "8e1ee9f3",
                "0d060f9f",
                "6ac7dde7",
                "46a99bd9"
              ]
            }
          ],
          "summaryImages": [
            "harvest.webp",
            "harvest.webp",
            "harvest.webp"
          ]
        }
      ],
      "strategies": [
        {
          "id": "more-fruit",
          "type": "causeEffect",
          "prompt": "為何學這個方法？",
          "hint": "再找找畫面中的線索。",
          "refs": [
            {
              "para": 2,
              "sentences": [
                9,
                10
              ],
              "sha": [
                "1f9c90e0",
                "f47f2969"
              ]
            },
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "8e1ee9f3",
                "0d060f9f",
                "6ac7dde7",
                "46a99bd9"
              ]
            }
          ],
          "options": [
            {
              "label": "撐傘、結果比較多的梨樹",
              "x": 35,
              "y": 40,
              "refs": [
            {
              "para": 2,
              "sentences": [
                9,
                10
              ],
              "sha": [
                "1f9c90e0",
                "f47f2969"
              ]
            },
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "8e1ee9f3",
                "0d060f9f",
                "6ac7dde7",
                "46a99bd9"
              ]
            }
          ]
            },
            {
              "label": "沒撐傘的梨樹",
              "x": 85,
              "y": 45,
              "refs": [
            {
              "para": 2,
              "sentences": [
                9,
                10
              ],
              "sha": [
                "1f9c90e0",
                "f47f2969"
              ]
            },
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "8e1ee9f3",
                "0d060f9f",
                "6ac7dde7",
                "46a99bd9"
              ]
            }
          ]
            }
          ],
          "answer": [
            0
          ],
          "result": [
            70,
            49
          ],
          "explanation": "比較收成，能看出這個方法確實有效。"
        }
      ],
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
              "para": 2,
              "sentences": [
                8,
                9,
                10
              ],
              "sha": [
                "7b59582c",
                "1f9c90e0",
                "f47f2969"
              ]
            },
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "8e1ee9f3",
                "0d060f9f",
                "6ac7dde7",
                "46a99bd9"
              ]
            }
          ]
        },
        {
          "kind": "strategy",
          "id": "more-fruit"
        },
        {
          "kind": "question"
        }
      ]
    },
    {
      "id": "pear-4",
      "act": 4,
      "title": "更方便的小雨傘",
      "goal": "點花枝夾上小雨傘",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG3H05/",
      "art": {
        "images": [
          "umbrellas.webp",
          "bowl.webp"
        ],
        "aspect": [
          2400,
          1024
        ],
        "hotspots": {},
        "effects": {},
        "views": {
          "work": 0.5,
          "wide": 0.5
        },
        "orientationFocus": {
          "landscape": 50,
          "portrait": 50
        },
        "readingZoom": false,
        "resultZoom": false,
        "viewScales": {
          "work": 1.15,
          "wide": 1
        }
      },
      "operation": {
        "type": "observe",
        "silentObserve": true,
        "keepCompleted": true,
        "steps": [
          "clip-1",
          "clip-2",
          "clip-3"
        ],
        "collect": [
          "clip-1",
          "clip-2",
          "clip-3"
        ],
        "prompts": [
          "點花枝夾上小雨傘",
          "再夾一朵",
          "再夾一朵",
          "一夾就固定好了"
        ],
        "objects": [
          {
            "action": "clip-1",
            "label": "夾上小雨傘",
            "sprite": "flower-dry",
            "x": 39,
            "y": 68,
            "width": 8,
            "ratio": 0.9775280898876404,
            "angle": 0,
            "completedSprite": "clip-umbrella",
            "observation": "",
            "grounded": true
          },
          {
            "action": "clip-2",
            "label": "夾上小雨傘",
            "sprite": "flower-dry",
            "x": 49,
            "y": 68,
            "width": 8,
            "ratio": 0.9775280898876404,
            "angle": 0,
            "completedSprite": "clip-umbrella",
            "observation": "",
            "grounded": true
          },
          {
            "action": "clip-3",
            "label": "夾上小雨傘",
            "sprite": "flower-dry",
            "x": 61,
            "y": 68,
            "width": 8,
            "ratio": 0.9775280898876404,
            "angle": 0,
            "completedSprite": "clip-umbrella",
            "observation": "",
            "grounded": true
          }
        ],
        "focus": [
          49,
          49,
          49,
          49
        ]
      },
      "meter": [
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
              4,
              5,
              6,
              7
            ],
            "sha": [
              "34e25cd5",
              "b38d0efe",
              "d000e47f",
              "851c571a"
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
              8,
              9,
              10,
              11
            ],
            "sha": [
              "d749af6b",
              "29d5d32e",
              "41c3750f",
              "9bb50bb1"
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
              6
            ],
            "sha": [
              "a68f48df",
              "cd072ea7",
              "429d4a33",
              "51ba757c",
              "4f673c45",
              "308f856e",
              "fe1b47d8"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "evidence",
          "refs": [
            {
              "para": 3,
              "sentences": [
                4,
                5,
                6,
                7
              ],
              "sha": [
                "34e25cd5",
                "b38d0efe",
                "d000e47f",
                "851c571a"
              ]
            },
            {
              "para": 3,
              "sentences": [
                8,
                9,
                10,
                11
              ],
              "sha": [
                "d749af6b",
                "29d5d32e",
                "41c3750f",
                "9bb50bb1"
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
                6
              ],
              "sha": [
                "a68f48df",
                "cd072ea7",
                "429d4a33",
                "51ba757c",
                "4f673c45",
                "308f856e",
                "fe1b47d8"
              ]
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "summary-4",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "kind": "摘要",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "先解決遮雨問題，再改良固定方式，操作更省時。",
            "改良只為了換一種顏色。",
            "梨農不再需要照顧梨花。"
          ],
          "answer": 0,
          "why": [
            "抓住原因與結果。",
            "這是細節，還沒說出整幕重點。",
            "再把發生的事情連起來。"
          ],
          "hints": [
            "想想遇到什麼問題。",
            "想想方法帶來的結果。",
            "找能說出整幕重點的圖卡。"
          ],
          "explanation": "先解決遮雨問題，再改良固定方式，操作更省時。",
          "refs": [
            {
              "para": 3,
              "sentences": [
                4,
                5,
                6,
                7
              ],
              "sha": [
                "34e25cd5",
                "b38d0efe",
                "d000e47f",
                "851c571a"
              ]
            },
            {
              "para": 3,
              "sentences": [
                8,
                9,
                10,
                11
              ],
              "sha": [
                "d749af6b",
                "29d5d32e",
                "41c3750f",
                "9bb50bb1"
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
                6
              ],
              "sha": [
                "a68f48df",
                "cd072ea7",
                "429d4a33",
                "51ba757c",
                "4f673c45",
                "308f856e",
                "fe1b47d8"
              ]
            }
          ],
          "summaryImages": [
            "umbrellas.webp",
            "umbrellas.webp",
            "umbrellas.webp"
          ]
        }
      ],
      "strategies": [
        {
          "id": "improve",
          "type": "causeEffect",
          "prompt": "為什麼要改良？",
          "hint": "再找找畫面中的線索。",
          "refs": [
            {
              "para": 3,
              "sentences": [
                5,
                6,
                7
              ],
              "sha": [
                "b38d0efe",
                "d000e47f",
                "851c571a"
              ]
            }
          ],
          "options": [
            {
              "label": "又貼膠帶又綁線，很花時間",
              "x": 28,
              "y": 14,
              "refs": [
            {
              "para": 3,
              "sentences": [
                5,
                6,
                7
              ],
              "sha": [
                "b38d0efe",
                "d000e47f",
                "851c571a"
              ]
            }
          ]
            },
            {
              "label": "小雨傘不夠漂亮",
              "x": 62,
              "y": 14,
              "refs": [
            {
              "para": 3,
              "sentences": [
                5,
                6,
                7
              ],
              "sha": [
                "b38d0efe",
                "d000e47f",
                "851c571a"
              ]
            }
          ]
            }
          ],
          "answer": [
            0
          ],
          "result": [
            50,
            63
          ],
          "explanation": "原先固定要做好幾個步驟，改用夾子更省時。"
        }
      ],
      "timeline": [
        {
          "kind": "intro",
          "refs": [
            {
              "para": 3,
              "sentences": [
                4,
                5,
                6,
                7
              ],
              "sha": [
                "34e25cd5",
                "b38d0efe",
                "d000e47f",
                "851c571a"
              ]
            }
          ],
          "imageIndex": 1
        },
        {
          "kind": "strategy",
          "id": "improve",
          "imageIndex": 1
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
                8,
                9,
                10,
                11
              ],
              "sha": [
                "d749af6b",
                "29d5d32e",
                "41c3750f",
                "9bb50bb1"
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
                6
              ],
              "sha": [
                "a68f48df",
                "cd072ea7",
                "429d4a33",
                "51ba757c",
                "4f673c45",
                "308f856e",
                "fe1b47d8"
              ]
            }
          ]
        },
        {
          "kind": "question"
        }
      ],
      "readViews": {
        "4:5": "wide"
      }
    }
  ],
  "speakers": {
    "1:0": "",
    "1:1": "",
    "1:2": "",
    "1:3": "",
    "1:4": "",
    "1:5": "",
    "1:6": "",
    "1:7": "",
    "1:8": "",
    "1:9": "",
    "1:10": "",
    "1:11": "翁先生",
    "1:12": "翁先生",
    "1:13": "翁先生",
    "2:0": "",
    "2:1": "",
    "2:2": "",
    "2:3": "",
    "2:4": "",
    "2:5": "",
    "2:6": "",
    "2:7": "",
    "2:8": "",
    "2:9": "",
    "2:10": "",
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
    "4:0": "",
    "4:1": "",
    "4:2": "",
    "4:3": "",
    "4:4": "",
    "4:5": "",
    "4:6": ""
  }
};
