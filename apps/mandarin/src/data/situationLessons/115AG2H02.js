// 原文只在正常解鎖後取用；此檔只存改寫、索引與雜湊。
export default {
  "schemaVersion": 1,
  "lessonId": "115AG2H02",
  "version": 1,
  "title": "彩色的天空",
  "gateTitle": "彩色的天空",
  "introduction": "看看雲朵卡，也看看我的心情。",
  "assetBase": "assets/situation/115AG2H02/",
  "summaryCardCount": 2,
  "paragraphCounts": [
    6,
    6,
    7,
    4
  ],
  "sentenceCount": 23,
  "excludedUnits": [
    {
      "para": 1,
      "sentences": [
        0
      ]
    }
  ],
  "storySentenceCount": 22,
  "source": {
    "text": "教師核定本機翰林二上第二課",
    "questions": "官方閱讀理解提問；題號見實作紀錄",
    "strategy": "情緒線索、因果、預測與排序摘要",
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
    "3:0": "",
    "3:1": "",
    "3:2": "",
    "3:3": "",
    "3:4": "",
    "3:5": "",
    "3:6": "我",
    "4:0": "",
    "4:1": "",
    "4:2": "",
    "4:3": ""
  },
  "ui": {
    "enter": "走進教室",
    "return": "回到教室",
    "speaker": "",
    "character": "我",
    "context": "用我的視角看雲朵卡和同學。",
    "safety": "只操作畫面中的物件。"
  },
  "meter": {
    "title": "我的心情",
    "subject": "我",
    "states": [
      "緊張",
      "緊張的心情消失了",
      "開心",
      "快樂得跳起舞來"
    ],
    "faces": [
      "😟",
      "🙂",
      "😊",
      "😄"
    ],
    "events": [
      {
        "para": 2,
        "n": 1,
        "state": 0,
        "level": 0
      },
      {
        "para": 3,
        "n": 4,
        "state": 1,
        "level": 1
      },
      {
        "para": 3,
        "n": 5,
        "state": 2,
        "level": 2
      },
      {
        "para": 4,
        "n": 3,
        "state": 3,
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
          3
        ],
        "sha": [
          "0ca4f7a1",
          "d477b404",
          "a468487e",
          "f4e849a1"
        ]
      }
    ]
  },
  "scenes": [
    {
      "id": "sky-1",
      "act": 1,
      "title": "空白的雲朵卡",
      "goal": "點點空白卡",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG2H02/",
      "art": {
        "images": [
          "desk.webp"
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
        "protectedRegions": [{"x":51,"y":17,"width":9,"ratio":1.2}],
        "silentObserve": true,
        "steps": [
          "look"
        ],
        "objects": [
          {
            "action": "look",
            "label": "空白雲朵卡",
            "sprite": null,
            "x": 50,
            "y": 76,
            "width": 18,
            "ratio": 1,
            "angle": 0,
            "hotspot": true
          },
          {
            "action": "sweat-icon",
            "label": "手心冒汗小圖示",
            "sprite": "sweat",
            "x": 24,
            "y": 82,
            "width": 5,
            "ratio": 1,
            "angle": 0,
            "passive": true
          }
        ],
        "prompts": [
          "點點空白卡",
          "看看結果"
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
              3
            ],
            "sha": [
              "a07f6bc4",
              "cc277f39",
              "c603c305"
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
              5
            ],
            "sha": [
              "491a1c80",
              "c903616c"
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
                3
              ],
              "sha": [
                "a07f6bc4",
                "cc277f39",
                "c603c305"
              ]
            },
            {
              "para": 1,
              "sentences": [
                4,
                5
              ],
              "sha": [
                "491a1c80",
                "c903616c"
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
            "☁️ 想了很久，卡片還空白。",
            "✏️ 拿到一枝鉛筆。"
          ],
          "answer": 0,
          "why": [
            "抓到這幕的重點。",
            "再看看這幕發生的事。"
          ],
          "hints": [
            "看看場景。",
            "想想發生的事。",
            "選出整幕重點。"
          ],
          "explanation": "想了很久，卡片還空白。",
          "refs": [
            {
              "para": 1,
              "sentences": [
                1,
                2,
                3
              ],
              "sha": [
                "a07f6bc4",
                "cc277f39",
                "c603c305"
              ]
            },
            {
              "para": 1,
              "sentences": [
                4,
                5
              ],
              "sha": [
                "491a1c80",
                "c903616c"
              ]
            }
          ],
          "summaryImages": [
            "sprites/cloud-blank.webp",
            "sprites/pencil.webp"
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
                3
              ],
              "sha": [
                "a07f6bc4",
                "cc277f39",
                "c603c305"
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
                5
              ],
              "sha": [
                "491a1c80",
                "c903616c"
              ]
            }
          ]
        },
        {
          "kind": "question"
        }
      ],
      "strategies": []
    },
    {
      "id": "sky-2",
      "act": 2,
      "title": "好緊張",
      "goal": "看看兩位同學",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG2H02/",
      "art": {
        "images": [
          "writing.webp",
          "look-down.webp"
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
          0,
          1
        ],
        "resultImage": 1
      },
      "operation": {
        "type": "observe",
        "silentObserve": true,
        "steps": [
          "left",
          "right"
        ],
        "objects": [
          {
            "action": "left",
            "label": "正在寫卡的左邊同學",
            "sprite": null,
            "x": 27,
            "y": 43,
            "width": 14,
            "ratio": 1,
            "angle": 0,
            "hotspot": true
          },
          {
            "action": "right",
            "label": "正在寫卡的右邊同學",
            "sprite": null,
            "x": 79,
            "y": 44,
            "width": 14,
            "ratio": 1,
            "angle": 0,
            "hotspot": true
          },
          {
            "action": "sweat-icon",
            "label": "手心冒汗小圖示",
            "sprite": "sweat",
            "x": 24,
            "y": 82,
            "width": 5,
            "ratio": 1,
            "angle": 0,
            "passive": true
          }
        ],
        "prompts": [
          "看看左邊同學",
          "看看右邊同學",
          "看看空白卡"
        ],
        "focus": [
          27,
          79,
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
        }
      ],
      "beats": {
        "intro": [
          {
            "para": 2,
            "sentences": [
              0
            ],
            "sha": [
              "cc39d9e9"
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
              5
            ],
            "sha": [
              "4075db82",
              "582d1d24",
              "32982184",
              "c3d30700",
              "cfeb8d83"
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
                0
              ],
              "sha": [
                "cc39d9e9"
              ]
            },
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
                "4075db82",
                "582d1d24",
                "32982184",
                "c3d30700",
                "cfeb8d83"
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
            "😟 不熟悉同學，我很緊張。",
            "☁️ 因為卡片太小而緊張。"
          ],
          "answer": 0,
          "why": [
            "抓到這幕的重點。",
            "再看看這幕發生的事。"
          ],
          "hints": [
            "看看場景。",
            "想想發生的事。",
            "選出整幕重點。"
          ],
          "explanation": "不熟悉同學，我很緊張。",
          "refs": [
            {
              "para": 2,
              "sentences": [
                0
              ],
              "sha": [
                "cc39d9e9"
              ]
            },
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
                "4075db82",
                "582d1d24",
                "32982184",
                "c3d30700",
                "cfeb8d83"
              ]
            }
          ],
          "summaryImages": [
            "writing.webp",
            "sprites/cloud-small.webp"
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
                0
              ],
              "sha": [
                "cc39d9e9"
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
                1,
                2,
                3,
                4,
                5
              ],
              "sha": [
                "4075db82",
                "582d1d24",
                "32982184",
                "c3d30700",
                "cfeb8d83"
              ]
            }
          ]
        },
        {
          "kind": "strategy",
          "id": "my-clues"
        },
        {
          "kind": "strategy",
          "id": "my-reason"
        },
        {
          "kind": "question"
        }
      ],
      "strategies": [
        {
          "id": "my-clues",
          "type": "emotionClue",
          "prompt": "找緊張的線索",
          "hint": "看看卡片和手",
          "meterTarget": "我",
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
                "4075db82",
                "582d1d24",
                "32982184",
                "c3d30700",
                "cfeb8d83"
              ]
            }
          ],
          "answer": [
            0,
            1
          ],
          "options": [
            {
              "label": "空白的卡片",
              "x": 50,
              "y": 76,
              "words": [
                "緊張"
              ],
              "states": [
                0
              ],
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
                    "4075db82",
                    "582d1d24",
                    "32982184",
                    "c3d30700",
                    "cfeb8d83"
                  ]
                }
              ]
            },
            {
              "label": "握緊的手",
              "x": 35,
              "y": 73,
              "words": [
                "緊張"
              ],
              "states": [
                0
              ],
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
                    "4075db82",
                    "582d1d24",
                    "32982184",
                    "c3d30700",
                    "cfeb8d83"
                  ]
                }
              ]
            }
          ]
        },
        {
          "id": "my-reason",
          "type": "causeEffect",
          "prompt": "我為什麼緊張？",
          "hint": "想想和同學熟嗎",
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
                "4075db82",
                "582d1d24",
                "32982184",
                "c3d30700",
                "cfeb8d83"
              ]
            }
          ],
          "answer": [
            0
          ],
          "result": [
            50,
            76
          ],
          "explanation": "剛到新班級，還不熟悉同學。",
          "options": [
            {
              "label": "和同學還不熟",
              "x": 79,
              "y": 26,
              "refs": [
                {
                  "para": 2,
                  "sentences": [
                    2,
                    3,
                    4
                  ],
                  "sha": [
                    "582d1d24",
                    "32982184",
                    "c3d30700"
                  ]
                }
              ],
              "face": {
                "width": 10,
                "height": 20
              },
              "markerOffset": [
                -10,
                0
              ]
            },
            {
              "label": "卡片太小",
              "x": 64,
              "y": 60,
              "refs": [
                {
                  "para": 1,
                  "sentences": [
                    2
                  ],
                  "sha": [
                    "cc277f39"
                  ]
                }
              ],
              "sprite": "cloud-small",
              "width": 8
            }
          ]
        }
      ]
    },
    {
      "id": "sky-3",
      "act": 3,
      "title": "下課了",
      "goal": "點筆寫卡片",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG2H02/",
      "art": {
        "images": [
          "friends.webp"
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
        "resultView": "work",
        "readingZoom": false,
        "resultZoom": false
      },
      "operation": {
        "type": "observe",
        "silentObserve": true,
        "focus": [
          50,
          50,
          50,
          50
        ],
        "steps": [
          "wave-left",
          "wave-right",
          "write"
        ],
        "objects": [
          {
            "action": "wave-left",
            "label": "向左邊同學揮揮手",
            "sprite": null,
            "x": 35,
            "y": 58,
            "width": 9,
            "ratio": 1,
            "angle": 0,
            "hotspot": true
          },
          {
            "action": "wave-right",
            "label": "向右邊同學揮揮手",
            "sprite": null,
            "x": 62,
            "y": 60,
            "width": 9,
            "ratio": 1,
            "angle": 0,
            "hotspot": true
          },
          {
            "action": "write",
            "label": "我的筆",
            "sprite": null,
            "x": 68,
            "y": 75,
            "width": 9,
            "ratio": 1,
            "angle": 0,
            "hotspot": true
          },
          {
            "action": "card",
            "label": "我的雲朵卡",
            "sprite": null,
            "x": 50,
            "y": 78,
            "width": 26,
            "ratio": 0.42,
            "angle": 0,
            "passive": true,
            "sourceCaption": {
              "refs": [
                {
                  "para": 3,
                  "sentences": [
                    6
                  ],
                  "sha": [
                    "4af58665"
                  ]
                }
              ],
              "afterAction": "write"
            },
            "hotspot": true
          }
        ],
        "prompts": [
          "向同學揮揮手",
          "再向另一位揮手",
          "點筆寫卡片",
          "看看結果"
        ],
        "keepCompleted": true,
        "showOnStrategy": true
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
          "state": 2,
          "level": 2
        },
        {
          "state": 2,
          "level": 2
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
              "a996d273",
              "cba4b713",
              "41baaf1a"
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
              5,
              6
            ],
            "sha": [
              "aed82bec",
              "19f9ae0f",
              "162be925",
              "4af58665"
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
                "a996d273",
                "cba4b713",
                "41baaf1a"
              ]
            },
            {
              "para": 3,
              "sentences": [
                3,
                4,
                5,
                6
              ],
              "sha": [
                "aed82bec",
                "19f9ae0f",
                "162be925",
                "4af58665"
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
            "😊 同學來說話，我安心寫卡。",
            "✏️ 同學只來借鉛筆。"
          ],
          "answer": 0,
          "why": [
            "抓到這幕的重點。",
            "再看看這幕發生的事。"
          ],
          "hints": [
            "看看場景。",
            "想想發生的事。",
            "選出整幕重點。"
          ],
          "explanation": "同學來說話，我安心寫卡。",
          "refs": [
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "a996d273",
                "cba4b713",
                "41baaf1a"
              ]
            },
            {
              "para": 3,
              "sentences": [
                3,
                4,
                5,
                6
              ],
              "sha": [
                "aed82bec",
                "19f9ae0f",
                "162be925",
                "4af58665"
              ]
            }
          ],
          "summaryImages": [
            "friends.webp",
            "sprites/pencil.webp"
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
                "a996d273",
                "cba4b713",
                "41baaf1a"
              ]
            }
          ]
        },
        {
          "kind": "strategy",
          "id": "classmates-predict"
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
                "aed82bec",
                "19f9ae0f",
                "162be925"
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
                6
              ],
              "sha": [
                "4af58665"
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
          "id": "classmates-predict",
          "type": "predict",
          "prompt": "同學來了，會發生什麼事？",
          "hint": "猜猜看就好",
          "refs": [
            {
              "para": 3,
              "sentences": [
                3,
                4,
                5,
                6
              ],
              "sha": [
                "aed82bec",
                "19f9ae0f",
                "162be925",
                "4af58665"
              ]
            }
          ],
          "options": [
            "💬 聊聊別的事",
            "🎲 邀我玩遊戲",
            "我不確定"
          ],
          "revealAt": {
            "para": 3,
            "n": 4
          }
        }
      ]
    },
    {
      "id": "sky-4",
      "act": 4,
      "title": "彩色的天空",
      "goal": "幫老師掛卡",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG2H02/",
      "art": {
        "images": [
          "wall.webp"
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
        "silentObserve": true,
        "steps": [
          "cloud"
        ],
        "objects": [
          {
            "action": "cloud",
            "label": "我的雲朵卡",
            "sprite": "cloud-written",
            "x": 50,
            "y": 79,
            "width": 25,
            "ratio": 0.72,
            "angle": 0,
            "destination": [
              53,
              24
            ],
            "destinationWidth": 16,
            "sourceCaption": {
              "refs": [
                {
                  "para": 3,
                  "sentences": [
                    6
                  ],
                  "sha": [
                    "4af58665"
                  ]
                }
              ]
            }
          },
          {
            "action": "wall-target",
            "label": "雲朵牆的空掛點",
            "sprite": null,
            "x": 53,
            "y": 24,
            "width": 10,
            "ratio": 1,
            "angle": 0,
            "hotspot": true,
            "target": true
          }
        ],
        "prompts": [
          "幫老師掛卡",
          "看看結果"
        ],
        "collect": [
          "cloud"
        ],
        "keepCompleted": true,
        "showOnStrategy": true,
        "regions": {
          "target": {
            "left": 48,
            "right": 58,
            "top": 16,
            "bottom": 32
          }
        },
        "retry": "移到掛點再放開"
      },
      "meter": [
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
            "para": 4,
            "sentences": [
              0,
              1,
              2,
              3
            ],
            "sha": [
              "0ca4f7a1",
              "d477b404",
              "a468487e",
              "f4e849a1"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "evidence",
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
                "0ca4f7a1",
                "d477b404",
                "a468487e",
                "f4e849a1"
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
            "☁️ 掛起雲朵卡，我很快樂。",
            "✏️ 大家收起鉛筆。"
          ],
          "answer": 0,
          "why": [
            "抓到這幕的重點。",
            "再看看這幕發生的事。"
          ],
          "hints": [
            "看看場景。",
            "想想發生的事。",
            "選出整幕重點。"
          ],
          "explanation": "掛起雲朵卡，我很快樂。",
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
                "0ca4f7a1",
                "d477b404",
                "a468487e",
                "f4e849a1"
              ]
            }
          ],
          "summaryImages": [
            "wall.webp",
            "sprites/pencil.webp"
          ]
        },
        {
          "id": "story-order",
          "type": "order",
          "operationType": "orderCards",
          "lockOrderSelections": true,
          "stem": "把故事排一排",
          "options": [
            "☁️ 想不出新希望",
            "😟 好緊張",
            "💬 同學來說話",
            "✏️ 寫出新希望"
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
            "先看空白卡。",
            "再想同學來了。",
            "最後寫好卡片。"
          ],
          "explanation": "想想卡片和心情怎麼改變。",
          "refs": [
            {
              "para": 1,
              "sentences": [
                1,
                2,
                3
              ],
              "sha": [
                "a07f6bc4",
                "cc277f39",
                "c603c305"
              ]
            },
            {
              "para": 1,
              "sentences": [
                4,
                5
              ],
              "sha": [
                "491a1c80",
                "c903616c"
              ]
            },
            {
              "para": 2,
              "sentences": [
                0
              ],
              "sha": [
                "cc39d9e9"
              ]
            },
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
                "4075db82",
                "582d1d24",
                "32982184",
                "c3d30700",
                "cfeb8d83"
              ]
            },
            {
              "para": 3,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "a996d273",
                "cba4b713",
                "41baaf1a"
              ]
            },
            {
              "para": 3,
              "sentences": [
                3,
                4,
                5,
                6
              ],
              "sha": [
                "aed82bec",
                "19f9ae0f",
                "162be925",
                "4af58665"
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
                "0ca4f7a1",
                "d477b404",
                "a468487e",
                "f4e849a1"
              ]
            }
          ]
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
              "para": 4,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "0ca4f7a1",
                "d477b404",
                "a468487e",
                "f4e849a1"
              ]
            }
          ]
        },
        {
          "kind": "question"
        }
      ],
      "strategies": []
    }
  ]
};
