// 只存改寫、索引與雜湊；原文留在正常密碼門後。
export default {
  "schemaVersion": 1,
  "lessonId": "115AG2H03",
  "version": 1,
  "title": "國王做新衣",
  "gateTitle": "國王做新衣",
  "introduction": "跟著國王一起做衣服。",
  "assetBase": "assets/situation/115AG2H03/",
  "summaryCardCount": 2,
  "paragraphCounts": [
    6,
    9,
    9,
    5
  ],
  "sentenceCount": 29,
  "excludedUnits": [
    {
      "para": 1,
      "sentences": [
        0
      ]
    }
  ],
  "storySentenceCount": 28,
  "source": {
    "text": "教師核定本機翰林二上第三課",
    "questions": "官方閱讀理解提問；題號見實作紀錄",
    "strategy": "情緒線索、預測、因果與排序摘要",
    "checked": "2026-10-23"
  },
  "speakers": {
    "1:1": "",
    "1:2": "",
    "1:3": "",
    "1:4": "",
    "1:5": "",
    "2:0": "",
    "2:1": "",
    "2:2": "",
    "2:3": "",
    "2:4": "",
    "2:5": "",
    "2:6": "",
    "2:7": "大臣",
    "2:8": "大臣",
    "3:0": "",
    "3:1": "",
    "3:2": "",
    "3:3": "",
    "3:4": "",
    "3:5": "",
    "3:6": "",
    "3:7": "",
    "3:8": "",
    "4:0": "",
    "4:1": "",
    "4:2": "",
    "4:3": "",
    "4:4": ""
  },
  "ui": {
    "enter": "走進城堡",
    "return": "回到城堡",
    "speaker": "",
    "character": "國王",
    "context": "跟著國王和大臣做衣服。",
    "safety": "只操作畫面中的物件。"
  },
  "meter": {
    "title": "國王的心情",
    "subject": "國王",
    "states": [
      "心情不好",
      "滿意",
      "驚喜",
      "越做越高興",
      "開心"
    ],
    "faces": [
      "😟",
      "🙂",
      "😮",
      "😄",
      "😊"
    ],
    "events": [
      {
        "para": 1,
        "n": 5,
        "state": 0,
        "level": 0
      },
      {
        "para": 2,
        "n": 5,
        "state": 1,
        "level": 1
      },
      {
        "para": 3,
        "n": 3,
        "state": 2,
        "level": 2
      },
      {
        "para": 3,
        "n": 5,
        "state": 3,
        "level": 3
      },
      {
        "para": 4,
        "n": 3,
        "state": 4,
        "level": 3
      }
    ]
  },
  "review": [],
  "ending": {
    "title": "故事讀完了",
    "refs": [
      {
        "para": 4,
        "sentences": [
          0,
          1,
          2,
          3,
          4
        ],
        "sha": [
          "51ba757c",
          "31995966",
          "a419371e",
          "b0df0625",
          "c8c221b9"
        ]
      }
    ]
  },
  "scenes": [
    {
      "id": "king-1",
      "act": 1,
      "title": "愛穿新衣的國王",
      "goal": "點點空衣架",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG2H03/",
      "art": {
        "images": [
          "wardrobe.webp",
          "wardrobe-sad.webp"
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
        "stepImages": [
          0,
          1
        ],
        "resultImage": 1,
        "expressionOverlays": {
          "wardrobe-sad.webp": "sad-overlay.webp"
        }
      },
      "operation": {
        "type": "observe",
        "silentObserve": true,
        "steps": [
          "hanger"
        ],
        "objects": [
          {
            "action": "hanger",
            "label": "空衣架",
            "sprite": null,
            "x": 58.5,
            "y": 41,
            "width": 9,
            "ratio": 1,
            "angle": 0,
            "hotspot": true
          }
        ],
        "prompts": [
          "點點空衣架",
          "看看國王"
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
        }
      ],
      "beats": {
        "intro": [
          {
            "para": 1,
            "sentences": [
              1,
              2,
              3,
              4
            ],
            "sha": [
              "55a1f570",
              "c0a66bc2",
              "19551c92",
              "2d3605a1"
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
              5
            ],
            "sha": [
              "23af9f5c"
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
              "55f59451",
              "ff51c53b",
              "d64d3ca5"
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
                1,
                2,
                3,
                4
              ],
              "sha": [
                "55a1f570",
                "c0a66bc2",
                "19551c92",
                "2d3605a1"
              ]
            },
            {
              "para": 1,
              "sentences": [
                5
              ],
              "sha": [
                "23af9f5c"
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
                "55f59451",
                "ff51c53b",
                "d64d3ca5"
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
          "stem": "這幕的重點是？",
          "options": [
            "😟 沒新衣，國王不開心。",
            "👕 國王天天有新衣穿。"
          ],
          "answer": 0,
          "why": [
            "抓到這幕的重點。",
            "這件事沒有發生。"
          ],
          "hints": [
            "看看國王。",
            "想想發生的事。",
            "選出整幕重點。"
          ],
          "explanation": "沒新衣，國王不開心。",
          "refs": [
            {
              "para": 1,
              "sentences": [
                1,
                2,
                3,
                4
              ],
              "sha": [
                "55a1f570",
                "c0a66bc2",
                "19551c92",
                "2d3605a1"
              ]
            },
            {
              "para": 1,
              "sentences": [
                5
              ],
              "sha": [
                "23af9f5c"
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
                "55f59451",
                "ff51c53b",
                "d64d3ca5"
              ]
            }
          ],
          "summaryImages": [
            "wardrobe-sad.webp",
            "sprites/shirt-blue.webp"
          ]
        }
      ],
      "timeline": [
        {
          "kind": "intro",
          "refs": [
            {
              "para": 1,
              "sentences": [
                1,
                2,
                3,
                4
              ],
              "sha": [
                "55a1f570",
                "c0a66bc2",
                "19551c92",
                "2d3605a1"
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
                5
              ],
              "sha": [
                "23af9f5c"
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
                "55f59451",
                "ff51c53b",
                "d64d3ca5"
              ]
            }
          ]
        },
        {
          "kind": "strategy",
          "id": "king-face"
        },
        {
          "kind": "question"
        }
      ],
      "strategies": [
        {
          "id": "king-face",
          "type": "emotionClue",
          "prompt": "找國王的表情",
          "hint": "再看看他的臉",
          "meterTarget": "國王",
          "refs": [
            {
              "para": 1,
              "sentences": [
                4,
                5
              ],
              "sha": [
                "2d3605a1",
                "23af9f5c"
              ]
            }
          ],
          "options": [
            {
              "label": "國王的臉",
              "x": 43,
              "y": 33,
              "face": {
                "width": 8,
                "height": 16
              },
              "markerOffset": [
                7,
                0
              ],
              "words": [
                "心情不好"
              ],
              "states": [
                0
              ],
              "refs": [
                {
                  "para": 1,
                  "sentences": [
                    4,
                    5
                  ],
                  "sha": [
                    "2d3605a1",
                    "23af9f5c"
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
    },
    {
      "id": "king-2",
      "act": 2,
      "title": "大臣的新衣",
      "goal": "拿出舊衣服",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG2H03/",
      "art": {
        "images": [
          "hall.webp"
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
        "hideOnResult": true,
        "silentObserve": true,
        "keepCompleted": true,
        "focus": [
          82,
          50
        ],
        "steps": [
          "old"
        ],
        "objects": [
          {
            "action": "old",
            "label": "拿出舊衣服",
            "sprite": "old-shirt",
            "x": 82,
            "y": 55,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "destination": [
              52,
              60
            ]
          }
        ],
        "prompts": [
          "拿出舊衣服",
          "看看大臣"
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
        }
      ],
      "beats": {
        "intro": [
          {
            "para": 2,
            "sentences": [
              3,
              4,
              5
            ],
            "sha": [
              "ebf316ce",
              "70bb68d3",
              "7acb3f85"
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
              6,
              7,
              8
            ],
            "sha": [
              "5a39112d",
              "a8393c3a",
              "32020c68"
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
                3,
                4,
                5
              ],
              "sha": [
                "ebf316ce",
                "70bb68d3",
                "7acb3f85"
              ]
            },
            {
              "para": 2,
              "sentences": [
                6,
                7,
                8
              ],
              "sha": [
                "5a39112d",
                "a8393c3a",
                "32020c68"
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
          "stem": "這幕的重點是？",
          "options": [
            "👕 大臣有個好方法。",
            "🧺 大臣把舊衣服丟掉。"
          ],
          "answer": 0,
          "why": [
            "抓到這幕的重點。",
            "這件事沒有發生。"
          ],
          "hints": [
            "看看國王。",
            "想想發生的事。",
            "選出整幕重點。"
          ],
          "explanation": "大臣有個好方法。",
          "refs": [
            {
              "para": 2,
              "sentences": [
                3,
                4,
                5
              ],
              "sha": [
                "ebf316ce",
                "70bb68d3",
                "7acb3f85"
              ]
            },
            {
              "para": 2,
              "sentences": [
                6,
                7,
                8
              ],
              "sha": [
                "5a39112d",
                "a8393c3a",
                "32020c68"
              ]
            }
          ],
          "summaryImages": [
            "hall.webp",
            "sprites/old-shirt.webp"
          ]
        }
      ],
      "timeline": [
        {
          "kind": "intro",
          "refs": [
            {
              "para": 2,
              "sentences": [
                3,
                4,
                5
              ],
              "sha": [
                "ebf316ce",
                "70bb68d3",
                "7acb3f85"
              ]
            }
          ]
        },
        {
          "kind": "strategy",
          "id": "new-clothes"
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
                6,
                7,
                8
              ],
              "sha": [
                "5a39112d",
                "a8393c3a",
                "32020c68"
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
          "id": "new-clothes",
          "type": "predict",
          "prompt": "大臣會怎麼變出新衣？",
          "hint": "先猜猜看",
          "refs": [
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "3ba275b4",
                "ffa5853d",
                "150ab7d0"
              ]
            }
          ],
          "options": [
            "✨ 可能用魔法",
            "🎨 可能想別的辦法",
            "我不確定"
          ],
          "revealAt": {
            "para": 3,
            "n": 2
          }
        }
      ]
    },
    {
      "id": "king-3",
      "act": 3,
      "title": "一起改衣服",
      "goal": "剪袖子加衣領",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG2H03/",
      "art": {
        "images": [
          "worktable.webp",
          "worktable-cut.webp",
          "worktable-happy.webp"
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
        "resultImage": 2,
        "stepImages": [
          0,
          1,
          2
        ],
        "expressionOverlays": {
          "worktable-cut.webp": "surprise-overlay.webp",
          "worktable-happy.webp": "happy-overlay.webp"
        }
      },
      "operation": {
        "type": "dragToTarget",
        "keepCompleted": true,
        "showOnStrategy": true,
        "steps": [
          "scissors",
          "collar"
        ],
        "prompts": [
          "拖剪刀改袖子",
          "把新衣領放上",
          "改好衣服了"
        ],
        "retry": "放到亮框裡",
        "regions": {
          "target": {
            "left": 43,
            "right": 57,
            "top": 61,
            "bottom": 81
          },
          "sleeve": {
            "left": 39,
            "right": 49,
            "top": 63,
            "bottom": 79
          },
          "neck": {
            "left": 47,
            "right": 56,
            "top": 59,
            "bottom": 70
          }
        },
        "objects": [
          {
            "action": "scissors",
            "label": "剪刀",
            "sprite": "scissors",
            "x": 40,
            "y": 83,
            "width": 10,
            "ratio": 1,
            "angle": 0,
            "region": "sleeve",
            "fromStep": 0,
            "toStep": 0,
            "destination": [
              44,
              70
            ]
          },
          {
            "action": "collar",
            "label": "新衣領",
            "sprite": "collar",
            "x": 60,
            "y": 83,
            "width": 10,
            "ratio": 1,
            "angle": 0,
            "region": "neck",
            "fromStep": 1,
            "toStep": 1,
            "destination": [
              51,
              65
            ],
            "destinationWidth": 8
          },
          {
            "action": "sleeve-target",
            "label": "袖子目標格",
            "sprite": null,
            "x": 44,
            "y": 70,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "target": true,
            "hotspot": true,
            "region": "sleeve",
            "fromStep": 0,
            "toStep": 0
          },
          {
            "action": "neck-target",
            "label": "衣領目標格",
            "sprite": null,
            "x": 51,
            "y": 65,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "target": true,
            "hotspot": true,
            "region": "neck",
            "fromStep": 1,
            "consumedBy": "collar"
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
          "level": 2
        },
        {
          "state": 3,
          "level": 3
        }
      ],
      "beats": {
        "intro": [
          {
            "para": 3,
            "sentences": [
              0,
              1,
              2
            ],
            "sha": [
              "3ba275b4",
              "ffa5853d",
              "150ab7d0"
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
              3,
              4,
              5
            ],
            "sha": [
              "5adb27ea",
              "58ba6582",
              "3601e920"
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
                0,
                1,
                2
              ],
              "sha": [
                "3ba275b4",
                "ffa5853d",
                "150ab7d0"
              ]
            },
            {
              "para": 3,
              "sentences": [
                3,
                4,
                5
              ],
              "sha": [
                "5adb27ea",
                "58ba6582",
                "3601e920"
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
          "stem": "這幕的重點是？",
          "options": [
            "✂️ 一起改衣服很高興。",
            "🪝 國王只把衣服掛起來。"
          ],
          "answer": 0,
          "why": [
            "抓到這幕的重點。",
            "這件事沒有發生。"
          ],
          "hints": [
            "看看國王。",
            "想想發生的事。",
            "選出整幕重點。"
          ],
          "explanation": "一起改衣服很高興。",
          "refs": [
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "3ba275b4",
                "ffa5853d",
                "150ab7d0"
              ]
            },
            {
              "para": 3,
              "sentences": [
                3,
                4,
                5
              ],
              "sha": [
                "5adb27ea",
                "58ba6582",
                "3601e920"
              ]
            }
          ],
          "summaryImages": [
            "worktable-happy.webp",
            "sprites/hanger.webp"
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
                0,
                1,
                2
              ],
              "sha": [
                "3ba275b4",
                "ffa5853d",
                "150ab7d0"
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
              "para": 3,
              "sentences": [
                3,
                4,
                5
              ],
              "sha": [
                "5adb27ea",
                "58ba6582",
                "3601e920"
              ]
            }
          ]
        },
        {
          "kind": "strategy",
          "id": "happy-cause"
        },
        {
          "kind": "question"
        }
      ],
      "strategies": [
        {
          "id": "happy-cause",
          "type": "causeEffect",
          "prompt": "國王為什麼越做越高興？",
          "hint": "想想他在做什麼",
          "refs": [
            {
              "para": 3,
              "sentences": [
                3,
                4,
                5
              ],
              "sha": [
                "5adb27ea",
                "58ba6582",
                "3601e920"
              ]
            }
          ],
          "options": [
            {
              "label": "✂️ 一起動手改衣",
              "x": 50,
              "y": 69,
              "refs": [
                {
                  "para": 3,
                  "sentences": [
                    4,
                    5
                  ],
                  "sha": [
                    "58ba6582",
                    "3601e920"
                  ]
                }
              ]
            },
            {
              "label": "👑 戴著王冠",
              "x": 38,
              "y": 20,
              "refs": [
                {
                  "para": 3,
                  "sentences": [
                    3,
                    4,
                    5
                  ],
                  "sha": [
                    "5adb27ea",
                    "58ba6582",
                    "3601e920"
                  ]
                }
              ]
            }
          ],
          "answer": [
            0
          ],
          "result": [
            40,
            32
          ],
          "explanation": "國王也動手改衣服。"
        }
      ]
    },
    {
      "id": "king-4",
      "act": 4,
      "title": "分享快樂",
      "goal": "送衣服給大家",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG2H03/",
      "art": {
        "images": [
          "courtyard.webp"
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
        "type": "dragToTarget",
        "keepCompleted": true,
        "showOnStrategy": true,
        "guide": false,
        "steps": [
          "blue",
          "coral",
          "green"
        ],
        "collect": [
          "blue",
          "coral",
          "green"
        ],
        "prompts": [
          "送衣服給大家",
          "送衣服給大家",
          "送衣服給大家",
          "大家收到衣服"
        ],
        "retry": "送到一位居民身上",
        "regions": {
          "target": {
            "left": 49,
            "right": 59,
            "top": 48,
            "bottom": 78
          },
          "blue": {
            "left": 49,
            "right": 59,
            "top": 48,
            "bottom": 78
          },
          "coral": {
            "left": 60,
            "right": 68,
            "top": 48,
            "bottom": 78
          },
          "green": {
            "left": 69,
            "right": 77,
            "top": 48,
            "bottom": 78
          }
        },
        "objects": [
          {
            "action": "blue",
            "label": "藍色衣服",
            "sprite": "shirt-blue",
            "x": 44,
            "y": 86,
            "width": 10,
            "ratio": 1,
            "angle": 0,
            "region": "blue",
            "destination": [
              54,
              65
            ],
            "destinationWidth": 11
          },
          {
            "action": "coral",
            "label": "珊瑚色衣服",
            "sprite": "shirt-coral",
            "x": 52,
            "y": 86,
            "width": 10,
            "ratio": 1,
            "angle": 0,
            "region": "coral",
            "destination": [
              63,
              65
            ],
            "destinationWidth": 11
          },
          {
            "action": "green",
            "label": "綠色衣服",
            "sprite": "shirt-green",
            "x": 60,
            "y": 86,
            "width": 10,
            "ratio": 1,
            "angle": 0,
            "region": "green",
            "destination": [
              72,
              65
            ],
            "destinationWidth": 11
          },
          {
            "action": "person-blue",
            "label": "捲髮居民收衣格",
            "sprite": null,
            "x": 54,
            "y": 65,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "target": true,
            "hotspot": true,
            "region": "blue",
            "consumedBy": "blue"
          },
          {
            "action": "person-coral",
            "label": "長者收衣格",
            "sprite": null,
            "x": 63,
            "y": 65,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "target": true,
            "hotspot": true,
            "region": "coral",
            "consumedBy": "coral"
          },
          {
            "action": "person-green",
            "label": "長髮居民收衣格",
            "sprite": null,
            "x": 72,
            "y": 65,
            "width": 12,
            "ratio": 1,
            "angle": 0,
            "target": true,
            "hotspot": true,
            "region": "green",
            "consumedBy": "green"
          }
        ]
      },
      "meter": [
        {
          "state": 3,
          "level": 3
        },
        {
          "state": 4,
          "level": 3
        },
        {
          "state": 4,
          "level": 3
        },
        {
          "state": 4,
          "level": 3
        }
      ],
      "beats": {
        "intro": [
          {
            "para": 3,
            "sentences": [
              6,
              7,
              8
            ],
            "sha": [
              "67fac93b",
              "28635b13",
              "6862571b"
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
              4
            ],
            "sha": [
              "51ba757c",
              "31995966",
              "a419371e",
              "b0df0625",
              "c8c221b9"
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
                6,
                7,
                8
              ],
              "sha": [
                "67fac93b",
                "28635b13",
                "6862571b"
              ]
            },
            {
              "para": 4,
              "sentences": [
                0,
                1,
                2,
                3,
                4
              ],
              "sha": [
                "51ba757c",
                "31995966",
                "a419371e",
                "b0df0625",
                "c8c221b9"
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
          "stem": "這幕的重點是？",
          "options": [
            "🎁 國王把衣服送給大家。",
            "🪝 國王把衣服掛回衣櫃。"
          ],
          "answer": 0,
          "why": [
            "抓到這幕的重點。",
            "這件事沒有發生。"
          ],
          "hints": [
            "看看國王。",
            "想想發生的事。",
            "選出整幕重點。"
          ],
          "explanation": "國王把衣服送給大家。",
          "refs": [
            {
              "para": 3,
              "sentences": [
                6,
                7,
                8
              ],
              "sha": [
                "67fac93b",
                "28635b13",
                "6862571b"
              ]
            },
            {
              "para": 4,
              "sentences": [
                0,
                1,
                2,
                3,
                4
              ],
              "sha": [
                "51ba757c",
                "31995966",
                "a419371e",
                "b0df0625",
                "c8c221b9"
              ]
            }
          ],
          "summaryImages": [
            "courtyard.webp",
            "sprites/hanger.webp"
          ]
        },
        {
          "id": "story-order",
          "lockOrderSelections": true,
          "type": "order",
          "operationType": "orderCards",
          "stem": "排出故事的先後",
          "options": [
            "😟 沒新衣心情不好",
            "👕 大臣送新衣",
            "✂️ 一起改舊衣",
            "🎁 送衣服給大家"
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
            "先找一開始。",
            "再想大臣的方法。",
            "最後衣服給誰？"
          ],
          "explanation": "故事排好了。",
          "refs": [
            {
              "para": 1,
              "sentences": [
                4,
                5
              ],
              "sha": [
                "2d3605a1",
                "23af9f5c"
              ]
            },
            {
              "para": 2,
              "sentences": [
                3,
                4,
                5
              ],
              "sha": [
                "ebf316ce",
                "70bb68d3",
                "7acb3f85"
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
                8
              ],
              "sha": [
                "3ba275b4",
                "ffa5853d",
                "150ab7d0",
                "5adb27ea",
                "58ba6582",
                "3601e920",
                "67fac93b",
                "28635b13",
                "6862571b"
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
                6,
                7,
                8
              ],
              "sha": [
                "67fac93b",
                "28635b13",
                "6862571b"
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
                4
              ],
              "sha": [
                "51ba757c",
                "31995966",
                "a419371e",
                "b0df0625",
                "c8c221b9"
              ]
            }
          ]
        },
        {
          "kind": "question"
        }
      ]
    }
  ]
};
