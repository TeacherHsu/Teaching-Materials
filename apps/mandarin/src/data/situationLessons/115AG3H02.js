// 只存改寫、句索引與雜湊；原文留在正常密碼門後。
export default {
  "schemaVersion": 1,
  "lessonId": "115AG3H02",
  "version": 1,
  "title": "妙用便利貼",
  "gateTitle": "妙用便利貼",
  "introduction": "跟著小真，用圖示安排生活。",
  "assetBase": "assets/situation/115AG3H02/",
  "paragraphCounts": [
    9,
    10,
    8,
    6
  ],
  "sentenceCount": 33,
  "source": {
    "text": "教師核定本機翰林三上第二課",
    "questions": "官方閱讀理解提問；題號見實作紀錄",
    "strategy": "因果、預測、情緒線索與摘要",
    "checked": "2026-10-23"
  },
  "ui": {
    "enter": "走進小真的家",
    "return": "回到小真的家",
    "speaker": "旁白",
    "character": "小真",
    "context": "圖示是操作示意，沒有代寫便條內容。",
    "safety": "只操作畫面中的物件。"
  },
  "meter": {
    "title": "小真的生活",
    "subject": "小真",
    "states": [
      "忘東忘西",
      "準時出門",
      "有次序"
    ],
    "labels": [
      "忘東忘西",
      "準時出門",
      "做事有次序"
    ],
    "faces": [
      "🎒",
      "⏰",
      "✅"
    ],
    "stateEvidence": [
      {
        "refs": [
          {
            "para": 1,
            "sentences": [
              2
            ],
            "sha": [
              "cb57514d"
            ]
          }
        ],
        "parts": [
          "忘東忘西"
        ]
      },
      {
        "refs": [
          {
            "para": 2,
            "sentences": [
              3
            ],
            "sha": [
              "37280970"
            ]
          }
        ],
        "parts": [
          "準時出門"
        ]
      },
      {
        "refs": [
          {
            "para": 3,
            "sentences": [
              3
            ],
            "sha": [
              "506b1934"
            ]
          }
        ],
        "parts": [
          "做事",
          "有次序"
        ]
      }
    ]
  },
  "review": [
    [
      "記住事情",
      "用圖示提醒。"
    ],
    [
      "安排先後",
      "完成後打勾。"
    ],
    [
      "提醒家人",
      "把便條貼在明顯處。"
    ]
  ],
  "ending": {
    "title": "把小真的改變連成故事",
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
          7
        ],
        "sha": [
          "54f8624c",
          "5c5d3970",
          "4c4806ed",
          "506b1934",
          "666e50f9",
          "85cf8ca9",
          "bfdd027e",
          "212c92fe"
        ]
      }
    ]
  },
  "scenes": [
    {
      "id": "sticky-1",
      "act": 1,
      "title": "凌亂的書桌",
      "goal": "找三樣忘記的東西",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG3H02/",
      "art": {
        "images": [
          "desk.webp"
        ],
        "aspect": [
          960,
          960
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
              "935b030e",
              "f0642ba9",
              "cb57514d",
              "da7652e2"
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
              4,
              5,
              6,
              7,
              8
            ],
            "sha": [
              "d749af6b",
              "2a961d05",
              "9b59f598",
              "faed2708",
              "b69f9667"
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
                3
              ],
              "sha": [
                "935b030e",
                "f0642ba9",
                "cb57514d",
                "da7652e2"
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
                "d749af6b",
                "2a961d05",
                "9b59f598",
                "faed2708",
                "b69f9667"
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
            "小真忘記事情，爸爸建議用便利貼。",
            "小真只是換了書包。",
            "小真已經不用提醒。"
          ],
          "answer": 0,
          "why": [
            "抓住方法和改變。",
            "這沒有說出整幕重點。",
            "再把發生的事連起來。"
          ],
          "hints": [
            "想想遇到的問題。",
            "想想使用的方法。",
            "找能說出改變的圖卡。"
          ],
          "explanation": "小真忘記事情，爸爸建議用便利貼。",
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
                "935b030e",
                "f0642ba9",
                "cb57514d",
                "da7652e2"
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
                "d749af6b",
                "2a961d05",
                "9b59f598",
                "faed2708",
                "b69f9667"
              ]
            }
          ],
          "summaryImages": [
            "desk.webp",
            "desk.webp",
            "desk.webp"
          ]
        }
      ],
      "operation": {
        "type": "observe",
        "silentObserve": true,
        "keepCompleted": true,
        "steps": [
          "homework",
          "bag",
          "bottle"
        ],
        "collect": [
          "homework",
          "bag",
          "bottle"
        ],
        "objects": [
          {
            "action": "homework",
            "label": "作業",
            "sprite": "homework",
            "x": 38,
            "y": 68,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": ""
          },
          {
            "action": "bag",
            "label": "書包",
            "sprite": "bag",
            "x": 50,
            "y": 68,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": ""
          },
          {
            "action": "bottle",
            "label": "水壺",
            "sprite": "bottle",
            "x": 62,
            "y": 68,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": ""
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
                "935b030e",
                "f0642ba9",
                "cb57514d",
                "da7652e2"
              ]
            }
          ]
        },
        {
          "kind": "act"
        },
        {
          "kind": "strategy",
          "id": "forget-cause"
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
                "d749af6b",
                "2a961d05",
                "9b59f598",
                "faed2708",
                "b69f9667"
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
          "id": "forget-cause",
          "type": "causeEffect",
          "prompt": "為何常忘記事情？",
          "hint": "想想她記不住什麼。",
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
                "935b030e",
                "f0642ba9",
                "cb57514d",
                "da7652e2"
              ]
            }
          ],
          "options": [
            {
              "label": "記不住待辦的作業",
              "x": 38,
              "y": 68,
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
                    "935b030e",
                    "f0642ba9",
                    "cb57514d",
                    "da7652e2"
                  ]
                }
              ]
            },
            {
              "label": "裝東西的書包",
              "x": 50,
              "y": 68,
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
                    "935b030e",
                    "f0642ba9",
                    "cb57514d",
                    "da7652e2"
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
            32
          ],
          "explanation": "要做的事記不住，需要提醒。"
        }
      ]
    },
    {
      "id": "sticky-2",
      "act": 2,
      "title": "夜晚先安排",
      "goal": "依序貼圖示任務卡",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG3H02/",
      "art": {
        "images": [
          "night.webp"
        ],
        "aspect": [
          960,
          960
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
              "d6f23cbf",
              "f29da9b7",
              "e72dd35e"
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
              "37280970",
              "22aec81d",
              "f5c098ca",
              "64fec3bd",
              "a3e85dac"
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
                "d6f23cbf",
                "f29da9b7",
                "e72dd35e"
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
                "37280970",
                "22aec81d",
                "f5c098ca",
                "64fec3bd",
                "a3e85dac"
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
            "小真用便利貼和鬧鐘安排明早。",
            "小真只在欣賞鬧鐘。",
            "小真把明早的事留到出門才想。"
          ],
          "answer": 0,
          "why": [
            "抓住方法和改變。",
            "這沒有說出整幕重點。",
            "再把發生的事連起來。"
          ],
          "hints": [
            "想想遇到的問題。",
            "想想使用的方法。",
            "找能說出改變的圖卡。"
          ],
          "explanation": "小真用便利貼和鬧鐘安排明早。",
          "refs": [
            {
              "para": 2,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "d6f23cbf",
                "f29da9b7",
                "e72dd35e"
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
                "37280970",
                "22aec81d",
                "f5c098ca",
                "64fec3bd",
                "a3e85dac"
              ]
            }
          ],
          "summaryImages": [
            "night.webp",
            "night.webp",
            "night.webp"
          ]
        }
      ],
      "operation": {
        "type": "observe",
        "silentObserve": true,
        "keepCompleted": true,
        "steps": [
          "brush",
          "uniform",
          "bag",
          "sheet",
          "alarm"
        ],
        "objects": [
          {
            "action": "brush",
            "label": "刷牙圖示",
            "sprite": "brush",
            "x": 38,
            "y": 76,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "gesture": "dragToTarget",
            "destination": [
              43,
              48
            ],
            "region": "brush",
            "toStep": 3
          },
          {
            "action": "uniform",
            "label": "制服圖示",
            "sprite": "uniform",
            "x": 50,
            "y": 76,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "gesture": "dragToTarget",
            "destination": [
              50,
              48
            ],
            "region": "uniform",
            "toStep": 3
          },
          {
            "action": "bag",
            "label": "書包圖示",
            "sprite": "bag",
            "x": 62,
            "y": 76,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "gesture": "dragToTarget",
            "destination": [
              57,
              48
            ],
            "region": "bag",
            "toStep": 3
          },
          {
            "action": "sheet",
            "label": "把便利貼貼到書桌前",
            "sprite": "sheet",
            "x": 50,
            "y": 50,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "gesture": "dragToTarget",
            "destination": [
              60,
              28
            ],
            "region": "wall",
            "fromStep": 3
          },
          {
            "action": "alarm",
            "label": "撥鬧鐘指針",
            "sprite": "clock",
            "x": 50,
            "y": 65,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "gesture": "rotateClock",
            "fromStep": 4
          },
          {
            "action": "target-brush",
            "label": "便利貼第1格",
            "consumedBy": "brush",
            "sprite": null,
            "x": 43,
            "y": 48,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "target": true,
            "hotspot": true,
            "toStep": 2
          },
          {
            "action": "target-uniform",
            "label": "便利貼第2格",
            "consumedBy": "uniform",
            "sprite": null,
            "x": 50,
            "y": 48,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "target": true,
            "hotspot": true,
            "toStep": 2
          },
          {
            "action": "target-bag",
            "label": "便利貼第3格",
            "consumedBy": "bag",
            "sprite": null,
            "x": 57,
            "y": 48,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "target": true,
            "hotspot": true,
            "toStep": 2
          },
          {
            "action": "wall-target",
            "label": "書桌前",
            "sprite": null,
            "x": 60,
            "y": 28,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "target": true,
            "hotspot": true,
            "fromStep": 3,
            "toStep": 3
          }
        ],
        "regions": {
          "brush": {
            "left": 39,
            "right": 47,
            "top": 40,
            "bottom": 57
          },
          "uniform": {
            "left": 46,
            "right": 54,
            "top": 40,
            "bottom": 57
          },
          "bag": {
            "left": 53,
            "right": 61,
            "top": 40,
            "bottom": 57
          },
          "wall": {
            "left": 52,
            "right": 68,
            "top": 20,
            "bottom": 38
          }
        },
        "retry": "先刷牙，再穿衣背書包。",
        "prompts": [
          "先貼牙刷圖示",
          "再貼制服圖示",
          "再貼書包圖示",
          "貼到書桌前",
          "撥針到七點前",
          "準備好了"
        ],
        "focus": [
          50,
          50,
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
                "d6f23cbf",
                "f29da9b7",
                "e72dd35e"
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
                3,
                4,
                5,
                6,
                7
              ],
              "sha": [
                "37280970",
                "22aec81d",
                "f5c098ca",
                "64fec3bd",
                "a3e85dac"
              ]
            }
          ]
        },
        {
          "kind": "strategy",
          "id": "tomorrow"
        },
        {
          "kind": "question"
        }
      ],
      "strategies": [
        {
          "id": "tomorrow",
          "type": "predict",
          "prompt": "明天能準時出門嗎？",
          "hint": "先猜猜，再讀下去。",
          "refs": [
            {
              "para": 2,
              "sentences": [
                8,
                9
              ],
              "sha": [
                "74a995a3",
                "9e20ad81"
              ]
            }
          ],
          "options": [
            "可能來得及",
            "可能還要提醒",
            "我不確定"
          ],
          "revealAt": {
            "para": 2,
            "n": 9
          }
        }
      ]
    },
    {
      "id": "sticky-3",
      "act": 3,
      "title": "第二天早上",
      "goal": "依圖示完成並打勾",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG3H02/",
      "art": {
        "images": [
          "morning.webp"
        ],
        "aspect": [
          960,
          960
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
              9
            ],
            "sha": [
              "74a995a3",
              "9e20ad81"
            ]
          },
          {
            "para": 3,
            "sentences": [
              0,
              1
            ],
            "sha": [
              "54f8624c",
              "5c5d3970"
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
                9
              ],
              "sha": [
                "74a995a3",
                "9e20ad81"
              ]
            },
            {
              "para": 3,
              "sentences": [
                0,
                1
              ],
              "sha": [
                "54f8624c",
                "5c5d3970"
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
            "便利貼幫助小真準時，全家順利出門。",
            "便利貼讓小真更晚出門。",
            "小真只把物品換了位置。"
          ],
          "answer": 0,
          "why": [
            "抓住方法和改變。",
            "這沒有說出整幕重點。",
            "再把發生的事連起來。"
          ],
          "hints": [
            "想想遇到的問題。",
            "想想使用的方法。",
            "找能說出改變的圖卡。"
          ],
          "explanation": "便利貼幫助小真準時，全家順利出門。",
          "refs": [
            {
              "para": 2,
              "sentences": [
                8,
                9
              ],
              "sha": [
                "74a995a3",
                "9e20ad81"
              ]
            },
            {
              "para": 3,
              "sentences": [
                0,
                1
              ],
              "sha": [
                "54f8624c",
                "5c5d3970"
              ]
            }
          ],
          "summaryImages": [
            "morning.webp",
            "morning.webp",
            "morning.webp"
          ]
        }
      ],
      "operation": {
        "type": "observe",
        "silentObserve": true,
        "keepCompleted": true,
        "steps": [
          "brush",
          "uniform",
          "bag"
        ],
        "objects": [
          {
            "action": "brush",
            "label": "完成刷牙",
            "sprite": "brush",
            "x": 38,
            "y": 61,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "completedSprite": "brush-checked"
          },
          {
            "action": "uniform",
            "label": "穿好制服",
            "sprite": "uniform",
            "x": 50,
            "y": 61,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "completedSprite": "uniform-checked"
          },
          {
            "action": "bag",
            "label": "背好書包",
            "sprite": "bag",
            "x": 62,
            "y": 61,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "completedSprite": "bag-checked"
          }
        ],
        "retry": "先依圖示順序完成。",
        "prompts": [
          "刷牙後打勾",
          "穿制服後打勾",
          "背書包後打勾",
          "三件事完成了"
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
                9
              ],
              "sha": [
                "74a995a3",
                "9e20ad81"
              ]
            },
            {
              "para": 3,
              "sentences": [
                0,
                1
              ],
              "sha": [
                "54f8624c",
                "5c5d3970"
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
      "id": "sticky-4",
      "act": 4,
      "title": "提醒家人的便條",
      "goal": "把便條貼上冰箱",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG3H02/",
      "art": {
        "images": [
          "fridge.webp"
        ],
        "aspect": [
          960,
          960
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
      "beats": {
        "intro": [
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
              "4c4806ed",
              "506b1934",
              "666e50f9",
              "85cf8ca9",
              "bfdd027e",
              "212c92fe"
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
            "para": 4,
            "sentences": [
              0,
              1,
              2,
              3,
              4,
              5
            ],
            "sha": [
              "e2c258e7",
              "6cab8d7b",
              "5e743bce",
              "29c72a45",
              "2894372e",
              "5c5d20c9"
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
                2,
                3,
                4,
                5,
                6,
                7
              ],
              "sha": [
                "4c4806ed",
                "506b1934",
                "666e50f9",
                "85cf8ca9",
                "bfdd027e",
                "212c92fe"
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
                5
              ],
              "sha": [
                "e2c258e7",
                "6cab8d7b",
                "5e743bce",
                "29c72a45",
                "2894372e",
                "5c5d20c9"
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
            "小真做事有次序，也能提醒家人。",
            "小真只想裝飾冰箱。",
            "爸爸看見便條很生氣。"
          ],
          "answer": 0,
          "why": [
            "抓住方法和改變。",
            "這沒有說出整幕重點。",
            "再把發生的事連起來。"
          ],
          "hints": [
            "想想遇到的問題。",
            "想想使用的方法。",
            "找能說出改變的圖卡。"
          ],
          "explanation": "小真做事有次序，也能提醒家人。",
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
                "4c4806ed",
                "506b1934",
                "666e50f9",
                "85cf8ca9",
                "bfdd027e",
                "212c92fe"
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
                5
              ],
              "sha": [
                "e2c258e7",
                "6cab8d7b",
                "5e743bce",
                "29c72a45",
                "2894372e",
                "5c5d20c9"
              ]
            }
          ],
          "summaryImages": [
            "fridge.webp",
            "fridge.webp",
            "fridge.webp"
          ]
        },
        {
          "id": "story-order",
          "type": "order",
          "operationType": "orderCards",
          "stem": "把小真的改變排一排",
          "options": [
            "忘記事情",
            "用便利貼安排",
            "準時出門",
            "提醒家人"
          ],
          "answer": [
            0,
            1,
            2,
            3
          ],
          "initialOrder": [
            2,
            0,
            3,
            1
          ],
          "why": [
            "依故事先後排列。",
            "依故事先後排列。",
            "依故事先後排列。",
            "依故事先後排列。"
          ],
          "hints": [
            "先找遇到的問題。",
            "再找使用的方法。",
            "最後能提醒家人。"
          ],
          "explanation": "先遇到問題，再用方法，最後看見改變。",
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
                "935b030e",
                "f0642ba9",
                "cb57514d",
                "da7652e2",
                "d749af6b",
                "2a961d05",
                "9b59f598",
                "faed2708",
                "b69f9667"
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
                9
              ],
              "sha": [
                "d6f23cbf",
                "f29da9b7",
                "e72dd35e",
                "37280970",
                "22aec81d",
                "f5c098ca",
                "64fec3bd",
                "a3e85dac",
                "74a995a3",
                "9e20ad81"
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
                7
              ],
              "sha": [
                "54f8624c",
                "5c5d3970",
                "4c4806ed",
                "506b1934",
                "666e50f9",
                "85cf8ca9",
                "bfdd027e",
                "212c92fe"
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
                5
              ],
              "sha": [
                "e2c258e7",
                "6cab8d7b",
                "5e743bce",
                "29c72a45",
                "2894372e",
                "5c5d20c9"
              ]
            }
          ]
        }
      ],
      "operation": {
        "type": "dragToTarget",
        "keepCompleted": true,
        "showOnStrategy": true,
        "steps": [
          "note"
        ],
        "collect": [
          "note"
        ],
        "objects": [
          {
            "action": "note",
            "label": "小真寫的便條",
            "sprite": "note",
            "x": 42,
            "y": 72,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "gesture": "dragToTarget",
            "destination": [
              50,
              48
            ]
          },
          {
            "action": "fridge-target",
            "label": "冰箱",
            "sprite": null,
            "x": 50,
            "y": 48,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "target": true,
            "hotspot": true
          }
        ],
        "regions": {
          "target": {
            "left": 43,
            "right": 57,
            "top": 35,
            "bottom": 60
          }
        },
        "retry": "移到冰箱門上再放開。"
      },
      "meter": [
        {
          "state": 2,
          "level": 2
        },
        {
          "state": 2,
          "level": 2
        }
      ],
      "timeline": [
        {
          "kind": "intro",
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
                "4c4806ed",
                "506b1934",
                "666e50f9",
                "85cf8ca9",
                "bfdd027e",
                "212c92fe"
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
              "para": 4,
              "sentences": [
                0,
                1,
                2,
                3,
                4,
                5
              ],
              "sha": [
                "e2c258e7",
                "6cab8d7b",
                "5e743bce",
                "29c72a45",
                "2894372e",
                "5c5d20c9"
              ]
            }
          ]
        },
        {
          "kind": "strategy",
          "id": "dad-smile"
        },
        {
          "kind": "question"
        }
      ],
      "strategies": [
        {
          "id": "dad-smile",
          "type": "emotionClue",
          "prompt": "找爸爸的表情",
          "hint": "再看看他的臉。",
          "meterTarget": "爸爸",
          "refs": [
            {
              "para": 4,
              "sentences": [
                4,
                5
              ],
              "sha": [
                "2894372e",
                "5c5d20c9"
              ]
            }
          ],
          "options": [
            {
              "label": "爸爸的笑臉",
              "x": 73,
              "y": 25,
              "face": {
                "width": 17,
                "height": 23
              },
              "markerOffset": [
                12,
                0
              ],
              "words": [
                "不由得笑了"
              ],
              "refs": [
                {
                  "para": 4,
                  "sentences": [
                    4,
                    5
                  ],
                  "sha": [
                    "2894372e",
                    "5c5d20c9"
                  ]
                }
              ]
            }
          ],
          "answer": [
            0
          ]
        }
      ]
    }
  ]
};
