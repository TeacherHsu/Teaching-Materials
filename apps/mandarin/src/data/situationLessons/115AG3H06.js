// 教師核定改寫、索引與雜湊；原文、題本與密碼不入repo。
export default {
  "schemaVersion": 1,
  "lessonId": "115AG3H06",
  "version": 1,
  "title": "小鉛筆大學問",
  "gateTitle": "小鉛筆大學問",
  "introduction": "走進明亮的工廠，跟著機器看材料如何變成鉛筆。",
  "assetBase": "assets/situation/115AG3H06/",
  "paragraphCounts": [
    2,
    4,
    1,
    7,
    12,
    1,
    5,
    5,
    3
  ],
  "sentenceCount": 40,
  "storySentenceCount": 38,
  "excludedUnits": [
    {
      "para": 3,
      "sentences": [
        0
      ]
    },
    {
      "para": 6,
      "sentences": [
        0
      ]
    }
  ],
  "source": {
    "text": "教師核定本機翰林三上第六課；小標不朗讀",
    "questions": "官方閱讀理解提問；題號僅記於實作紀錄",
    "strategy": "說明文：預測、因果、比較、製作順序與摘要",
    "checked": "2026-10-23"
  },
  "ui": {
    "enter": "參觀鉛筆工廠",
    "return": "回到工廠",
    "speaker": "旁白",
    "character": "鉛筆",
    "context": "我參觀鉛筆工廠；插畫是閱讀示意。",
    "safety": "只操作畫面中的按鈕與材料。"
  },
  "meter": {
    "title": "鉛筆變身進度",
    "subject": "鉛筆",
    "states": [
      "石墨和黏土",
      "光滑、油亮",
      "筆芯三明治",
      "一枝枝的筆桿",
      "閃亮亮的鉛筆"
    ],
    "labels": [
      "石墨和黏土",
      "光滑、油亮的筆芯",
      "筆芯三明治",
      "一枝枝的筆桿",
      "閃亮亮的鉛筆"
    ],
    "faces": [
      "🪨",
      "✏️",
      "🪵",
      "🪵",
      "✏️"
    ],
    "stateEvidence": [
      {
        "refs": [
          {
            "para": 4,
            "sentences": [
              1
            ],
            "sha": [
              "ea9e6161"
            ]
          }
        ],
        "parts": [
          "石墨和黏土"
        ]
      },
      {
        "refs": [
          {
            "para": 4,
            "sentences": [
              3
            ],
            "sha": [
              "254a5da2"
            ]
          }
        ],
        "parts": [
          "筆芯",
          "光滑、油亮"
        ]
      },
      {
        "refs": [
          {
            "para": 5,
            "sentences": [
              6
            ],
            "sha": [
              "40720bf1"
            ]
          }
        ],
        "parts": [
          "筆芯三明治"
        ]
      },
      {
        "refs": [
          {
            "para": 5,
            "sentences": [
              8
            ],
            "sha": [
              "c37e0cbc"
            ]
          }
        ],
        "parts": [
          "一枝枝的筆桿"
        ]
      },
      {
        "refs": [
          {
            "para": 5,
            "sentences": [
              11
            ],
            "sha": [
              "f899f849"
            ]
          }
        ],
        "parts": [
          "閃亮亮的鉛筆"
        ]
      }
    ],
    "read": {
      "para": 2,
      "n": 2,
      "state": 0,
      "level": 0
    }
  },
  "summaryCardCount": 2,
  "review": [
    [
      "製作順序",
      "觀察每一步如何接上下一步。"
    ],
    [
      "比較種類",
      "從使用方式與筆芯材料比較鉛筆。"
    ]
  ],
  "ending": {
    "title": "把鉛筆製作順序說清楚",
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
          "947f9206",
          "ea9e6161",
          "bcee7a81",
          "254a5da2",
          "1575665f",
          "f00572fc",
          "d4309fd1"
        ]
      },
      {
        "para": 5,
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
          "c732e0d4",
          "e9cb7a31",
          "b897c592",
          "eb9031ff",
          "8fae5de6",
          "6fb610a3",
          "40720bf1",
          "0ca4f7a1",
          "c37e0cbc",
          "89663ac7",
          "ab213a89",
          "f899f849"
        ]
      },
      {
        "para": 7,
        "sentences": [
          0,
          1,
          2,
          3,
          4
        ],
        "sha": [
          "29b9408e",
          "9a5fbe0d",
          "64544e54",
          "d2e7fc3f",
          "d14ced35"
        ]
      },
      {
        "para": 8,
        "sentences": [
          0,
          1,
          2,
          3,
          4
        ],
        "sha": [
          "34ab9b69",
          "068f0047",
          "62a5d8b3",
          "fe529bac",
          "eac56423"
        ]
      },
      {
        "para": 9,
        "sentences": [
          0,
          1,
          2
        ],
        "sha": [
          "e59032ca",
          "65e472dc",
          "2eab2e28"
        ]
      }
    ]
  },
  "scenes": [
    {
      "id": "pencil-1",
      "act": 1,
      "title": "書包裡的鉛筆",
      "goal": "點兩處鉛筆字跡",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG3H06/",
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
        "silentObserve": true,
        "keepCompleted": true,
        "steps": [
          "book",
          "workbook"
        ],
        "objects": [
          {
            "action": "book",
            "label": "找課本上的鉛筆痕跡",
            "x": 44,
            "y": 58,
            "width": 5,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "hotspot": true
          },
          {
            "action": "workbook",
            "label": "找作業上的鉛筆痕跡",
            "x": 56,
            "y": 58,
            "width": 5,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "hotspot": true
          },
          {
            "action": "desk-pencil",
            "label": "桌上的普通鉛筆",
            "x": 50,
            "y": 65,
            "width": 10,
            "ratio": 0.1852589641434263,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "pencil",
            "passive": true,
            "fromStep": 2
          }
        ],
        "focus": [
          50,
          50
        ],
        "collect": [
          "book",
          "workbook"
        ],
        "prompts": [
          "點課本或作業字跡",
          "再點另一處字跡"
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
            "para": 1,
            "sentences": [
              0,
              1
            ],
            "sha": [
              "f1484ce7",
              "77fc1a92"
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
              2,
              3
            ],
            "sha": [
              "186d08dc",
              "90f2353c",
              "3987eaeb",
              "7d5c640c"
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
                1
              ],
              "sha": [
                "f1484ce7",
                "77fc1a92"
              ]
            },
            {
              "para": 2,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "186d08dc",
                "90f2353c",
                "3987eaeb",
                "7d5c640c"
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
            "鉛筆的原料：石墨、黏土和木頭。",
            "桌上有一枝普通鉛筆。"
          ],
          "summaryImages": [
            "sprites/materials.webp",
            "sprites/pencil.webp"
          ],
          "answer": 0,
          "why": [
            "把材料、步驟和結果連起來了。",
            "圖中是細節，再找整幕的重點。"
          ],
          "hints": [
            "回想這一幕。",
            "看看操作後的改變。",
            "找能說出整幕重點的圖卡。"
          ],
          "explanation": "鉛筆的原料：石墨、黏土和木頭。",
          "refs": [
            {
              "para": 1,
              "sentences": [
                0,
                1
              ],
              "sha": [
                "f1484ce7",
                "77fc1a92"
              ]
            },
            {
              "para": 2,
              "sentences": [
                0,
                1,
                2,
                3
              ],
              "sha": [
                "186d08dc",
                "90f2353c",
                "3987eaeb",
                "7d5c640c"
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
              "para": 1,
              "sentences": [
                0,
                1
              ],
              "sha": [
                "f1484ce7",
                "77fc1a92"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "strategy",
          "id": "materials-predict",
          "imageIndex": 0
        },
        {
          "kind": "openBag",
          "refs": [
            {
              "para": 1,
              "sentences": [
                0,
                1
              ],
              "sha": [
                "f1484ce7",
                "77fc1a92"
              ]
            }
          ],
          "prompt": "打開書包找線索",
          "label": "打開書包",
          "openedMessage": "看看課本和作業",
          "object": {
            "x": 50,
            "y": 38,
            "width": 17,
            "sprite": "bag",
            "opening": false
          }
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
                0,
                1,
                2,
                3
              ],
              "sha": [
                "186d08dc",
                "90f2353c",
                "3987eaeb",
                "7d5c640c"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "question"
        }
      ],
      "strategies": [
        {
          "id": "materials-predict",
          "type": "predict",
          "prompt": "鉛筆是用什麼做的？",
          "hint": "先選你的想法",
          "options": [
            "鉛",
            "石墨、黏土和木頭",
            "我不確定"
          ],
          "revealAt": {
            "para": 2,
            "n": 2
          },
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
                "186d08dc",
                "90f2353c",
                "3987eaeb",
                "7d5c640c"
              ]
            }
          ]
        }
      ],
      "meterRevealAt": {
        "para": 2,
        "n": 2
      }
    },
    {
      "id": "pencil-2",
      "act": 2,
      "title": "做筆芯",
      "goal": "把材料放進混合槽",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG3H06/",
      "art": {
        "images": [
          "mixing.webp"
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
        "keepCompleted": true,
        "steps": [
          "graphite",
          "clay",
          "mix"
        ],
        "objects": [
          {
            "action": "graphite",
            "label": "放入石墨",
            "x": 44,
            "y": 62,
            "width": 6,
            "ratio": 0.7951070336391437,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "graphite",
            "gesture": "dragToTarget",
            "destination": [
              49,
              25
            ],
            "toStep": 1
          },
          {
            "action": "clay",
            "label": "放入黏土",
            "x": 56,
            "y": 62,
            "width": 6,
            "ratio": 0.8322368421052632,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "clay",
            "gesture": "dragToTarget",
            "destination": [
              51,
              25
            ],
            "toStep": 1
          },
          {
            "action": "mix",
            "label": "按混合加工鈕",
            "x": 59.3,
            "y": 37.4,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "hotspot": true,
            "gesture": "observe",
            "fromStep": 2,
            "toStep": 2,
            "viewMotion": "machineProcess",
            "machineRegion": {
              "x": 50,
              "y": 28,
              "width": 12,
              "height": 22
            }
          },
          {
            "action": "tank",
            "label": "混合槽入口",
            "x": 50,
            "y": 25,
            "width": 8,
            "ratio": 0.35,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "hotspot": true,
            "target": true,
            "toStep": 1
          },
          {
            "action": "finished-core",
            "label": "加工後的筆芯",
            "x": 50,
            "y": 62,
            "width": 14,
            "ratio": 0.4265129682997118,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "core",
            "passive": true,
            "fromStep": 3
          }
        ],
        "focus": [
          50,
          50,
          52
        ],
        "regions": {
          "target": {
            "left": 46,
            "right": 54,
            "top": 19,
            "bottom": 31
          }
        },
        "collect": [
          "graphite",
          "clay"
        ],
        "groups": [
          {
            "from": 0,
            "to": 2
          },
          {
            "from": 2,
            "to": 3
          }
        ],
        "prompts": [
          "拖材料進混合槽",
          "放入另一種材料",
          "按加工鈕做筆芯"
        ],
        "retry": "先放入兩種材料"
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
          "level": 0
        }
      ],
      "beats": {
        "intro": [
          {
            "para": 4,
            "sentences": [
              0,
              1
            ],
            "sha": [
              "947f9206",
              "ea9e6161"
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
              2,
              3,
              4,
              5,
              6
            ],
            "sha": [
              "bcee7a81",
              "254a5da2",
              "1575665f",
              "f00572fc",
              "d4309fd1"
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
                1
              ],
              "sha": [
                "947f9206",
                "ea9e6161"
              ]
            },
            {
              "para": 4,
              "sentences": [
                2,
                3,
                4,
                5,
                6
              ],
              "sha": [
                "bcee7a81",
                "254a5da2",
                "1575665f",
                "f00572fc",
                "d4309fd1"
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
            "混合加工材料，做出筆芯。",
            "石墨是製作筆芯的材料。"
          ],
          "summaryImages": [
            "sprites/core.webp",
            "sprites/graphite.webp"
          ],
          "answer": 0,
          "why": [
            "把材料、步驟和結果連起來了。",
            "圖中是細節，再找整幕的重點。"
          ],
          "hints": [
            "回想這一幕。",
            "看看操作後的改變。",
            "找能說出整幕重點的圖卡。"
          ],
          "explanation": "混合加工材料，做出筆芯。",
          "refs": [
            {
              "para": 4,
              "sentences": [
                0,
                1
              ],
              "sha": [
                "947f9206",
                "ea9e6161"
              ]
            },
            {
              "para": 4,
              "sentences": [
                2,
                3,
                4,
                5,
                6
              ],
              "sha": [
                "bcee7a81",
                "254a5da2",
                "1575665f",
                "f00572fc",
                "d4309fd1"
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
              "para": 4,
              "sentences": [
                0,
                1
              ],
              "sha": [
                "947f9206",
                "ea9e6161"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "act",
          "untilStep": 2
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 4,
              "sentences": [
                2
              ],
              "sha": [
                "bcee7a81"
              ]
            }
          ],
          "imageIndex": 0
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
                3,
                4,
                5,
                6
              ],
              "sha": [
                "254a5da2",
                "1575665f",
                "f00572fc",
                "d4309fd1"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "strategy",
          "id": "wood-cause",
          "imageIndex": 0
        },
        {
          "kind": "question"
        }
      ],
      "strategies": [
        {
          "id": "wood-cause",
          "type": "causeEffect",
          "prompt": "為何用木板包住筆芯？",
          "hint": "想想直接拿筆芯寫",
          "focus": 50,
          "refs": [
            {
              "para": 4,
              "sentences": [
                4,
                5,
                6
              ],
              "sha": [
                "1575665f",
                "f00572fc",
                "d4309fd1"
              ]
            }
          ],
          "answer": [
            0,
            1
          ],
          "options": [
            {
              "label": "筆芯容易斷裂",
              "x": 44,
              "y": 48,
              "sprite": "broken-core",
              "width": 5,
              "markerOffset": [
                0,
                10
              ],
              "refs": [
                {
                  "para": 4,
                  "sentences": [
                    4,
                    5
                  ],
                  "sha": [
                    "1575665f",
                    "f00572fc"
                  ]
                }
              ]
            },
            {
              "label": "手會變黑",
              "x": 50,
              "y": 48,
              "sprite": "dirty-hand",
              "width": 5,
              "markerOffset": [
                0,
                10
              ],
              "refs": [
                {
                  "para": 4,
                  "sentences": [
                    4,
                    5,
                    6
                  ],
                  "sha": [
                    "1575665f",
                    "f00572fc",
                    "d4309fd1"
                  ]
                }
              ]
            },
            {
              "label": "讓鉛筆變香",
              "x": 56,
              "y": 48,
              "sprite": "perfume",
              "width": 5,
              "markerOffset": [
                0,
                10
              ],
              "refs": [
                {
                  "para": 4,
                  "sentences": [
                    4,
                    5,
                    6
                  ],
                  "sha": [
                    "1575665f",
                    "f00572fc",
                    "d4309fd1"
                  ]
                }
              ]
            }
          ],
          "result": [
            50,
            63
          ],
          "explanation": "木板保護脆弱筆芯，也避免手直接碰到筆芯。"
        }
      ]
    },
    {
      "id": "pencil-3",
      "act": 3,
      "title": "筆芯三明治",
      "goal": "依序組裝木板筆芯",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG3H06/",
      "art": {
        "images": [
          "assembly.webp"
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
        "keepCompleted": true,
        "steps": [
          "groove",
          "insert",
          "glue"
        ],
        "objects": [
          {
            "action": "groove",
            "label": "按鈕刻凹槽",
            "x": 50,
            "y": 54,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "hotspot": true,
            "gesture": "observe",
            "viewMotion": "machineProcess",
            "machineRegion": {
              "x": 50,
              "y": 35,
              "width": 12,
              "height": 24
            }
          },
          {
            "action": "insert",
            "label": "把筆芯放入凹槽",
            "fromStep": 1,
            "x": 39,
            "y": 65,
            "width": 6,
            "ratio": 0.4265129682997118,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "core",
            "gesture": "dragToTarget",
            "destination": [
              50,
              65
            ],
            "toStep": 1
          },
          {
            "action": "glue",
            "label": "蓋上另一片木板黏合",
            "fromStep": 2,
            "x": 61,
            "y": 65,
            "width": 6,
            "ratio": 0.4371584699453552,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "board-plain",
            "gesture": "dragToTarget",
            "destination": [
              50,
              65
            ],
            "toStep": 2
          },
          {
            "action": "slot",
            "label": "木板凹槽放置區",
            "x": 50,
            "y": 65,
            "width": 8,
            "ratio": 0.35,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "hotspot": true,
            "target": true,
            "toStep": 2
          },
          {
            "action": "plain-board",
            "label": "未刻槽的木板",
            "x": 50,
            "y": 65,
            "width": 10,
            "ratio": 0.4371584699453552,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "board-plain",
            "passive": true,
            "toStep": 0
          },
          {
            "action": "grooved-board",
            "label": "刻槽後的木板",
            "x": 50,
            "y": 65,
            "width": 10,
            "ratio": 0.4861878453038674,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "board-grooved",
            "passive": true,
            "fromStep": 1,
            "toStep": 2
          },
          {
            "action": "inserted-core",
            "label": "凹槽中的筆芯",
            "x": 50,
            "y": 64,
            "width": 9,
            "ratio": 0.4265129682997118,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "core",
            "passive": true,
            "fromStep": 2,
            "toStep": 2
          },
          {
            "action": "glue-bottle",
            "label": "黏合用膠水",
            "x": 60,
            "y": 51,
            "width": 4,
            "ratio": 2.079754601226994,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "glue",
            "passive": true,
            "toStep": 2
          },
          {
            "action": "sandwich-result",
            "label": "黏合後的筆芯三明治",
            "x": 50,
            "y": 65,
            "width": 16,
            "ratio": 0.2493368700265252,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "sandwich",
            "passive": true,
            "fromStep": 3
          }
        ],
        "focus": [
          50,
          45,
          55,
          50
        ],
        "regions": {
          "target": {
            "left": 46,
            "right": 54,
            "top": 60,
            "bottom": 70
          }
        },
        "prompts": [
          "先按鈕刻凹槽",
          "把筆芯放進凹槽",
          "蓋木板黏合"
        ],
        "retry": "先刻凹槽，筆芯才放得進去",
        "retryByStep": [
          "先刻凹槽，筆芯才放得進去",
          "先放筆芯，再蓋上木板",
          "蓋上另一片木板就能黏合"
        ]
      },
      "meter": [
        {
          "state": 1,
          "level": 0
        },
        {
          "state": 1,
          "level": 0
        },
        {
          "state": 1,
          "level": 0
        },
        {
          "state": 2,
          "level": 0
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
            "para": 5,
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
              "c732e0d4",
              "e9cb7a31",
              "b897c592",
              "eb9031ff",
              "8fae5de6",
              "6fb610a3",
              "40720bf1"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "evidence",
          "refs": [
            {
              "para": 5,
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
                "c732e0d4",
                "e9cb7a31",
                "b897c592",
                "eb9031ff",
                "8fae5de6",
                "6fb610a3",
                "40720bf1"
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
            "刻槽、放筆芯，再黏合木板。",
            "桌上放著一瓶膠水。"
          ],
          "summaryImages": [
            "sprites/sandwich.webp",
            "sprites/glue.webp"
          ],
          "answer": 0,
          "why": [
            "把材料、步驟和結果連起來了。",
            "圖中是細節，再找整幕的重點。"
          ],
          "hints": [
            "回想這一幕。",
            "看看操作後的改變。",
            "找能說出整幕重點的圖卡。"
          ],
          "explanation": "刻槽、放筆芯，再黏合木板。",
          "refs": [
            {
              "para": 5,
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
                "c732e0d4",
                "e9cb7a31",
                "b897c592",
                "eb9031ff",
                "8fae5de6",
                "6fb610a3",
                "40720bf1"
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
              "para": 5,
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
                "c732e0d4",
                "e9cb7a31",
                "b897c592",
                "eb9031ff",
                "8fae5de6",
                "6fb610a3",
                "40720bf1"
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
      "id": "pencil-4",
      "act": 4,
      "title": "閃亮亮的鉛筆",
      "goal": "按鈕切桿再上色",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG3H06/",
      "art": {
        "images": [
          "finishing.webp"
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
        "keepCompleted": true,
        "steps": [
          "cut",
          "paint",
          "erase"
        ],
        "objects": [
          {
            "action": "cut",
            "label": "按機器切割鈕",
            "x": 35,
            "y": 52,
            "width": 4,
            "ratio": 1,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "hotspot": true,
            "gesture": "observe",
            "viewMotion": "machineCut",
            "machineRegion": {
              "x": 50,
              "y": 35,
              "width": 18,
              "height": 22
            }
          },
          {
            "action": "paint",
            "label": "選紅色替筆桿上色",
            "x": 57,
            "y": 66,
            "width": 6,
            "ratio": 0.7146814404432132,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "paint",
            "gesture": "tap",
            "fromStep": 1,
            "toStep": 1
          },
          {
            "action": "erase",
            "label": "替其中一枝加橡皮擦",
            "x": 44,
            "y": 70,
            "width": 4,
            "ratio": 0.6404109589041096,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "eraser",
            "gesture": "dragToTarget",
            "fromStep": 2,
            "toStep": 2,
            "destination": [56, 66]
          },
          {
            "action": "eraser-slot",
            "label": "其中一枝鉛筆的尾端",
            "x": 56,
            "y": 66,
            "width": 5,
            "ratio": 0.35,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "hotspot": true,
            "target": true,
            "fromStep": 2,
            "toStep": 2
          },
          {
            "action": "barrels",
            "label": "切割後的筆桿",
            "x": 47,
            "y": 66,
            "width": 8,
            "ratio": 0.6339522546419099,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "barrel",
            "passive": true,
            "fromStep": 1,
            "toStep": 1
          },
          {
            "action": "painted-pencil",
            "label": "上色完成的鉛筆",
            "x": 50,
            "y": 66,
            "width": 14,
            "ratio": 0.1144578313253012,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "painted-pencil",
            "passive": true,
            "fromStep": 2,
            "toStep": 2
          },
          {
            "action": "pencil-final",
            "label": "加上橡皮擦的紅鉛筆",
            "x": 46,
            "y": 66,
            "width": 9,
            "ratio": 0.11746987951807229,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "pencil-eraser",
            "passive": true,
            "fromStep": 3
          },
          {
            "action": "mechanical-view",
            "label": "自動鉛筆",
            "x": 54,
            "y": 66,
            "width": 6,
            "ratio": 0.22506393861892582,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "mechanical",
            "passive": true,
            "fromStep": 3
          },
          {
            "action": "colored-view",
            "label": "色鉛筆",
            "x": 60,
            "y": 66,
            "width": 5,
            "ratio": 0.5057803468208093,
            "angle": 0,
            "grounded": true,
            "observation": "",
            "sprite": "colored",
            "passive": true,
            "fromStep": 3
          }
        ],
        "focus": [
          40,
          52,
          50,
          53
        ],
        "regions": {
          "target": {
            "left": 53,
            "right": 59,
            "top": 61,
            "bottom": 71
          }
        },
        "prompts": [
          "按鈕讓機器切筆桿",
          "選紅色替筆桿上色",
          "替一枝鉛筆加橡皮擦"
        ],
        "retry": "先完成前一步"
      },
      "meter": [
        {
          "state": 2,
          "level": 0
        },
        {
          "state": 3,
          "level": 0
        },
        {
          "state": 3,
          "level": 0
        },
        {
          "state": 4,
          "level": 0
        }
      ],
      "beats": {
        "intro": [
          {
            "para": 5,
            "sentences": [
              7,
              8,
              9,
              10,
              11
            ],
            "sha": [
              "0ca4f7a1",
              "c37e0cbc",
              "89663ac7",
              "ab213a89",
              "f899f849"
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
            "para": 7,
            "sentences": [
              0,
              1,
              2,
              3,
              4
            ],
            "sha": [
              "29b9408e",
              "9a5fbe0d",
              "64544e54",
              "d2e7fc3f",
              "d14ced35"
            ]
          },
          {
            "para": 8,
            "sentences": [
              0,
              1,
              2,
              3,
              4
            ],
            "sha": [
              "34ab9b69",
              "068f0047",
              "62a5d8b3",
              "fe529bac",
              "eac56423"
            ]
          },
          {
            "para": 9,
            "sentences": [
              0,
              1,
              2
            ],
            "sha": [
              "e59032ca",
              "65e472dc",
              "2eab2e28"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "evidence",
          "refs": [
            {
              "para": 5,
              "sentences": [
                7,
                8,
                9,
                10,
                11
              ],
              "sha": [
                "0ca4f7a1",
                "c37e0cbc",
                "89663ac7",
                "ab213a89",
                "f899f849"
              ]
            },
            {
              "para": 7,
              "sentences": [
                0,
                1,
                2,
                3,
                4
              ],
              "sha": [
                "29b9408e",
                "9a5fbe0d",
                "64544e54",
                "d2e7fc3f",
                "d14ced35"
              ]
            },
            {
              "para": 8,
              "sentences": [
                0,
                1,
                2,
                3,
                4
              ],
              "sha": [
                "34ab9b69",
                "068f0047",
                "62a5d8b3",
                "fe529bac",
                "eac56423"
              ]
            },
            {
              "para": 9,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "e59032ca",
                "65e472dc",
                "2eab2e28"
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
            "切桿、上色，完成普通鉛筆。",
            "有些鉛筆會裝上橡皮擦。"
          ],
          "summaryImages": [
            "finishing.webp",
            "sprites/eraser.webp"
          ],
          "answer": 0,
          "why": [
            "把材料、步驟和結果連起來了。",
            "圖中是細節，再找整幕的重點。"
          ],
          "hints": [
            "回想這一幕。",
            "看看操作後的改變。",
            "找能說出整幕重點的圖卡。"
          ],
          "explanation": "切桿、上色，完成普通鉛筆。",
          "refs": [
            {
              "para": 5,
              "sentences": [
                7,
                8,
                9,
                10,
                11
              ],
              "sha": [
                "0ca4f7a1",
                "c37e0cbc",
                "89663ac7",
                "ab213a89",
                "f899f849"
              ]
            },
            {
              "para": 7,
              "sentences": [
                0,
                1,
                2,
                3,
                4
              ],
              "sha": [
                "29b9408e",
                "9a5fbe0d",
                "64544e54",
                "d2e7fc3f",
                "d14ced35"
              ]
            },
            {
              "para": 8,
              "sentences": [
                0,
                1,
                2,
                3,
                4
              ],
              "sha": [
                "34ab9b69",
                "068f0047",
                "62a5d8b3",
                "fe529bac",
                "eac56423"
              ]
            },
            {
              "para": 9,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "e59032ca",
                "65e472dc",
                "2eab2e28"
              ]
            }
          ]
        },
        {
          "id": "pencil-compare",
          "type": "choice",
          "operationType": "chooseCard",
          "kind": "比較",
          "stem": "哪組比較符合課文？",
          "options": [
            "自動鉛筆按出筆芯；色鉛筆加顏料，不加石墨。",
            "自動鉛筆要削木頭；色鉛筆只加石墨。",
            "兩種都靠木板一直往外推出筆芯。"
          ],
          "answer": 0,
          "why": [
            "抓住兩種鉛筆各自的特點。",
            "再比較按壓方式與筆芯材料。",
            "把外形和製作材料分開想。"
          ],
          "hints": [
            "先比較怎麼露出筆芯。",
            "再比較筆芯的材料。",
            "回想兩種鉛筆的不同。"
          ],
          "explanation": "自動鉛筆靠按壓；色鉛筆靠顏料呈現顏色。",
          "refs": [
            {
              "para": 7,
              "sentences": [
                0,
                1,
                2,
                3,
                4
              ],
              "sha": [
                "29b9408e",
                "9a5fbe0d",
                "64544e54",
                "d2e7fc3f",
                "d14ced35"
              ]
            },
            {
              "para": 8,
              "sentences": [
                0,
                1,
                2,
                3,
                4
              ],
              "sha": [
                "34ab9b69",
                "068f0047",
                "62a5d8b3",
                "fe529bac",
                "eac56423"
              ]
            }
          ]
        },
        {
          "id": "pencil-order",
          "type": "order",
          "operationType": "orderCards",
          "kind": "排序",
          "stem": "把鉛筆製作步驟排好",
          "options": [
            "混合材料做筆芯",
            "木板刻凹槽",
            "放入筆芯",
            "膠水黏合木板",
            "切成筆桿再上色"
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
            1,
            4,
            0,
            2
          ],
          "lockOrderSelections": true,
          "why": [
            "想想材料如何一步步變成鉛筆。"
          ],
          "hints": [
            "先做好筆芯。",
            "先有凹槽才能放筆芯。",
            "黏合後才切桿上色。"
          ],
          "explanation": "依照材料、刻槽、放入、黏合與加工的順序。",
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
                "947f9206",
                "ea9e6161",
                "bcee7a81",
                "254a5da2"
              ]
            },
            {
              "para": 5,
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
                "c732e0d4",
                "e9cb7a31",
                "b897c592",
                "eb9031ff",
                "8fae5de6",
                "6fb610a3",
                "40720bf1",
                "0ca4f7a1",
                "c37e0cbc",
                "89663ac7",
                "ab213a89",
                "f899f849"
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
                7,
                8,
                9,
                10,
                11
              ],
              "sha": [
                "0ca4f7a1",
                "c37e0cbc",
                "89663ac7",
                "ab213a89",
                "f899f849"
              ]
            }
          ],
          "imageIndex": 0
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
              "para": 7,
              "sentences": [
                0,
                1,
                2,
                3,
                4
              ],
              "sha": [
                "29b9408e",
                "9a5fbe0d",
                "64544e54",
                "d2e7fc3f",
                "d14ced35"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 8,
              "sentences": [
                0,
                1,
                2,
                3,
                4
              ],
              "sha": [
                "34ab9b69",
                "068f0047",
                "62a5d8b3",
                "fe529bac",
                "eac56423"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "read",
          "refs": [
            {
              "para": 9,
              "sentences": [
                0,
                1,
                2
              ],
              "sha": [
                "e59032ca",
                "65e472dc",
                "2eab2e28"
              ]
            }
          ],
          "imageIndex": 0
        },
        {
          "kind": "question"
        }
      ]
    }
  ],
  "speakers": {
    "1:0": "",
    "1:1": "",
    "2:0": "",
    "2:1": "",
    "2:2": "",
    "2:3": "",
    "4:0": "",
    "4:1": "",
    "4:2": "",
    "4:3": "",
    "4:4": "",
    "4:5": "",
    "4:6": "",
    "5:0": "",
    "5:1": "",
    "5:2": "",
    "5:3": "",
    "5:4": "",
    "5:5": "",
    "5:6": "",
    "5:7": "",
    "5:8": "",
    "5:9": "",
    "5:10": "",
    "5:11": "",
    "7:0": "",
    "7:1": "",
    "7:2": "",
    "7:3": "",
    "7:4": "",
    "8:0": "",
    "8:1": "",
    "8:2": "",
    "8:3": "",
    "8:4": "",
    "9:0": "",
    "9:1": "",
    "9:2": ""
  }
};
