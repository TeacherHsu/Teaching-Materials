// 公開設定僅存索引、雜湊與教學提示；原文由既有密碼門解密。
export default {
  "schemaVersion": 1,
  "lessonId": "115AG4K12",
  "version": 3,
  "title": "鞋店裡的閱讀線索",
  "gateTitle": "老鞋匠和小精靈",
  "introduction": "跟著老鞋匠一起試。先動手、看結果，再讀原句找線索。",
  "assetBase": "assets/situation/115AG4K12/",
  "paragraphCounts": [
    100
  ],
  "sentenceCount": 100,
  "source": {
    "text": "教師提供康版第七冊第12課本機來源；正文依教師設計單分幕",
    "questions": "CF 確認四幕設計單，每幕一題",
    "strategy": "因果、追查疑問、人物特點與事件排序",
    "checked": "2026-10-22"
  },
  "ui": {
    "enter": "走進鞋店",
    "return": "回到鞋店",
    "speaker": "",
    "character": "老鞋匠",
    "context": "插畫為閱讀示意；情緒詞只採課文對老鞋匠的描述。",
    "safety": "只操作畫面中的物件。"
  },
  "meter": {
    "states": [
      "嘆口氣",
      "驚訝",
      "喜出望外",
      "百思不解",
      "嘖嘖稱奇",
      "幸福與喜悅"
    ],
    "faces": [
      "😔",
      "😮",
      "🙂",
      "🤔",
      "😮",
      "😊"
    ]
  },
  "scenes": [
    {
      "id": "last-leather",
      "act": 1,
      "title": "夜晚的鞋店",
      "goal": "按住剪刀，沿虛線剪下最後的皮革。",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG4K12/",
      "art": {
        "images": [
          "night.webp"
        ],
        "expressionOverlays": {
          "night.webp": "night-expression.webp"
        },
        "aspect": [
          2400,
          1024
        ],
        "hotspots": {},
        "effects": {},
        "views": {
          "work": 0.34
        },
        "orientationFocus": {
          "landscape": 41,
          "portrait": 40
        },
        "readingZoom": false
      },
      "operation": {
        "type": "tracePath",
        "steps": [
          "cut"
        ],
        "objects": [
          {
            "action": "leather",
            "label": "最後的皮革",
            "x": 40,
            "y": 65,
            "width": 13,
            "ratio": 0.6,
            "angle": 0,
            "sprite": "leather",
            "passive": true,
            "toStep": 0
          },
          {
            "action": "cut",
            "label": "沿虛線剪裁；鍵盤可連按五次逐步剪",
            "x": 33,
            "y": 65,
            "width": 5.5,
            "ratio": 1,
            "angle": 0,
            "sprite": "scissors",
            "path": [
              [
                33,
                65
              ],
              [
                36.5,
                65
              ],
              [
                40,
                65
              ],
              [
                43.5,
                65
              ],
              [
                47,
                65
              ]
            ],
            "tolerance": 2.8,
            "toStep": 0
          },
          {
            "action": "cut-piece",
            "label": "剪好的皮革上半部",
            "x": 40,
            "y": 63,
            "width": 13,
            "ratio": 0.28,
            "angle": 0,
            "sprite": "leather-top",
            "passive": true,
            "fromStep": 1
          },
          {
            "action": "cut-off",
            "label": "剪下並脫離的皮革",
            "x": 40,
            "y": 68,
            "width": 13,
            "ratio": 0.28,
            "angle": 0,
            "sprite": "leather-bottom",
            "passive": true,
            "fromStep": 1
          }
        ],
        "collect": [
          "cut"
        ],
        "prompts": [
          "按住剪刀沿虛線剪。",
          "皮革已剪好。"
        ],
        "focus": [
          40,
          40
        ],
        "keepCompleted": true
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
              7,
              8,
              9,
              10,
              11,
              12,
              13,
              14
            ],
            "sha": [
              "08ae9469",
              "929eb995",
              "0b7be14c",
              "3ea3b566",
              "4146aa9c",
              "3db7c474",
              "57d8b84a",
              "76139fe8"
            ]
          }
        ],
        "act": {
          "demo": false
        },
        "result": {
          "view": "work",
          "duration": 2400
        },
        "read": [
          {
            "para": 1,
            "sentences": [
              15,
              16,
              17,
              18,
              19,
              20,
              21,
              22,
              23,
              24,
              25,
              26,
              27
            ],
            "sha": [
              "e95b213a",
              "f7afbb83",
              "653402e4",
              "4567620d",
              "00814054",
              "b26bcdcc",
              "d5da0629",
              "bbfade9f",
              "17a8a749",
              "ca737ca8",
              "19b20960",
              "02b59544",
              "aaee2c15"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "evidence",
          "label": "本幕原句",
          "object": "cut",
          "note": "完成操作後，讀原句找線索。",
          "refs": [
            {
              "para": 1,
              "sentences": [
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
                18,
                19,
                20,
                21,
                22,
                23,
                24,
                25,
                26,
                27
              ],
              "sha": [
                "08ae9469",
                "929eb995",
                "0b7be14c",
                "3ea3b566",
                "4146aa9c",
                "3db7c474",
                "57d8b84a",
                "76139fe8",
                "e95b213a",
                "f7afbb83",
                "653402e4",
                "4567620d",
                "00814054",
                "b26bcdcc",
                "d5da0629",
                "bbfade9f",
                "17a8a749",
                "ca737ca8",
                "19b20960",
                "02b59544",
                "aaee2c15"
              ]
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "resources",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "kind": "摘要",
          "pirls": "統整",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "鞋店收入變少，老鞋匠只剩最後的皮革",
            "妻子親切招呼客人",
            "老鞋匠準備休息"
          ],
          "answer": 0,
          "summaryImages": [
            "night.webp",
            "night.webp",
            "night.webp"
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
                7,
                8,
                9,
                10,
                11,
                12,
                13,
                14
              ],
              "sha": [
                "08ae9469",
                "929eb995",
                "0b7be14c",
                "3ea3b566",
                "4146aa9c",
                "3db7c474",
                "57d8b84a",
                "76139fe8"
              ]
            },
            {
              "para": 1,
              "sentences": [
                15,
                16,
                17,
                18,
                19,
                20,
                21,
                22,
                23,
                24,
                25,
                26,
                27
              ],
              "sha": [
                "e95b213a",
                "f7afbb83",
                "653402e4",
                "4567620d",
                "00814054",
                "b26bcdcc",
                "d5da0629",
                "bbfade9f",
                "17a8a749",
                "ca737ca8",
                "19b20960",
                "02b59544",
                "aaee2c15"
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
                7,
                8,
                9,
                10,
                11,
                12,
                13,
                14
              ],
              "sha": [
                "08ae9469",
                "929eb995",
                "0b7be14c",
                "3ea3b566",
                "4146aa9c",
                "3db7c474",
                "57d8b84a",
                "76139fe8"
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
                15,
                16,
                17,
                18,
                19,
                20,
                21,
                22,
                23,
                24,
                25,
                26,
                27
              ],
              "sha": [
                "e95b213a",
                "f7afbb83",
                "653402e4",
                "4567620d",
                "00814054",
                "b26bcdcc",
                "d5da0629",
                "bbfade9f",
                "17a8a749",
                "ca737ca8",
                "19b20960",
                "02b59544",
                "aaee2c15"
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
      "id": "morning-surprise",
      "act": 2,
      "title": "早晨的驚喜",
      "goal": "拿新鞋給顧客，再把錢袋移到皮革架。",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG4K12/",
      "art": {
        "images": [
          "morning.webp",
          "morning-full.webp"
        ],
        "aspect": [
          2400,
          1024
        ],
        "hotspots": {},
        "effects": {},
        "views": {
          "work": 0.65
        },
        "orientationFocus": {
          "landscape": 62,
          "portrait": 62
        },
        "stepImages": [
          0,
          0,
          1
        ],
        "readingZoom": false
      },
      "operation": {
        "type": "dragToTarget",
        "steps": [
          "sell",
          "buy"
        ],
        "objects": [
          {
            "action": "sell",
            "label": "拿新鞋給顧客",
            "x": 58,
            "y": 64,
            "width": 9,
            "ratio": 0.7,
            "angle": 0,
            "sprite": "shoes",
            "toStep": 0,
            "destination": [
              65,
              60
            ],
            "region": "target"
          },
          {
            "action": "customer",
            "label": "顧客收鞋的位置",
            "x": 65,
            "y": 59,
            "width": 8,
            "ratio": 1,
            "angle": 0,
            "target": true,
            "toStep": 0
          },
          {
            "action": "buy",
            "label": "把錢袋拖到皮革架",
            "x": 64,
            "y": 66,
            "width": 6,
            "ratio": 1,
            "angle": 0,
            "sprite": "money",
            "fromStep": 1,
            "toStep": 1,
            "destination": [
              75,
              51
            ],
            "region": "rack"
          },
          {
            "action": "rack",
            "label": "換皮革的位置",
            "x": 75,
            "y": 51,
            "width": 8,
            "ratio": 1,
            "angle": 0,
            "target": true,
            "fromStep": 1,
            "toStep": 1
          }
        ],
        "regions": {
          "target": {
            "left": 61,
            "right": 69,
            "top": 54,
            "bottom": 64
          },
          "rack": {
            "left": 71,
            "right": 79,
            "top": 45,
            "bottom": 57
          }
        },
        "focus": [
          62,
          69.5,
          69.5
        ],
        "prompts": [
          "拿新鞋給顧客。",
          "把錢袋換成皮革。",
          "皮革架重新有皮革了。"
        ]
      },
      "meter": [
        {
          "state": 1,
          "level": 3
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
        "intro": [
          {
            "para": 1,
            "sentences": [
              28,
              29,
              30
            ],
            "sha": [
              "7fe1e57c",
              "7b136897",
              "190763dd"
            ]
          }
        ],
        "act": {
          "demo": false
        },
        "result": {
          "view": "work",
          "duration": 2400
        },
        "read": [
          {
            "para": 1,
            "sentences": [
              31,
              32,
              33,
              34,
              35,
              36,
              37,
              38,
              39,
              40,
              41,
              42,
              43
            ],
            "sha": [
              "3c7fd038",
              "b265c7fd",
              "f88876a7",
              "d82d42e5",
              "db6e1487",
              "740a1cd7",
              "e838fba2",
              "1af97ef4",
              "0ff2835a",
              "e5b19108",
              "1c332cbd",
              "deb4dc59",
              "e8e80602"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "evidence",
          "label": "本幕原句",
          "object": "sell",
          "note": "完成操作後，讀原句找線索。",
          "refs": [
            {
              "para": 1,
              "sentences": [
                28,
                29,
                30,
                31,
                32,
                33,
                34,
                35,
                36,
                37,
                38,
                39,
                40,
                41,
                42,
                43
              ],
              "sha": [
                "7fe1e57c",
                "7b136897",
                "190763dd",
                "3c7fd038",
                "b265c7fd",
                "f88876a7",
                "d82d42e5",
                "db6e1487",
                "740a1cd7",
                "e838fba2",
                "1af97ef4",
                "0ff2835a",
                "e5b19108",
                "1c332cbd",
                "deb4dc59",
                "e8e80602"
              ]
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "mystery",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "kind": "摘要",
          "pirls": "統整",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "顧客來店裡買鞋",
            "新鞋接連出現，鞋店生意好轉",
            "老鞋匠拿錢買皮革"
          ],
          "answer": 1,
          "summaryImages": [
            "morning.webp",
            "morning-full.webp",
            "morning-full.webp"
          ],
          "why": [
            "這是細節，不是最重要的事；再想想整幕發生什麼。",
            "把這一幕的事情和結果連起來，就是重點。",
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
                28,
                29,
                30
              ],
              "sha": [
                "7fe1e57c",
                "7b136897",
                "190763dd"
              ]
            },
            {
              "para": 1,
              "sentences": [
                31,
                32,
                33,
                34,
                35,
                36,
                37,
                38,
                39,
                40,
                41,
                42,
                43
              ],
              "sha": [
                "3c7fd038",
                "b265c7fd",
                "f88876a7",
                "d82d42e5",
                "db6e1487",
                "740a1cd7",
                "e838fba2",
                "1af97ef4",
                "0ff2835a",
                "e5b19108",
                "1c332cbd",
                "deb4dc59",
                "e8e80602"
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
                28,
                29,
                30
              ],
              "sha": [
                "7fe1e57c",
                "7b136897",
                "190763dd"
              ]
            }
          ]
        },
        {
          "kind": "act"
        },
        {
          "kind": "strategy",
          "id": "maker-predict",
          "hideOperations": true
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
                31,
                32,
                33,
                34,
                35,
                36,
                37,
                38,
                39,
                40,
                41,
                42,
                43
              ],
              "sha": [
                "3c7fd038",
                "b265c7fd",
                "f88876a7",
                "d82d42e5",
                "db6e1487",
                "740a1cd7",
                "e838fba2",
                "1af97ef4",
                "0ff2835a",
                "e5b19108",
                "1c332cbd",
                "deb4dc59",
                "e8e80602"
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
          "id": "maker-predict",
          "type": "predict",
          "prompt": "鞋子是誰做的？",
          "options": [
            "店裡的人",
            "路過的人",
            "我不確定"
          ],
          "refs": [
            {
              "para": 1,
              "sentences": [
                53,
                54,
                55,
                56,
                57,
                58,
                59
              ],
              "sha": [
                "6a134a04",
                "32bbcc6d",
                "cfa93bd6",
                "ad42b9e4",
                "bcd61149",
                "f81259c6",
                "35284c51"
              ]
            }
          ],
          "revealAt": {
            "para": 1,
            "n": 58
          }
        }
      ]
    },
    {
      "id": "midnight-secret",
      "act": 3,
      "title": "午夜的祕密",
      "goal": "熄燭、拉簾躲好，再依序觀察三件事。",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG4K12/",
      "art": {
        "images": [
          "night-unlit.webp",
          "midnight-sew.webp",
          "midnight-hammer.webp",
          "midnight-shoes.webp",
          "midnight-finished.webp"
        ],
        "expressionOverlays": {
          "night-unlit.webp": "night-unlit-expression.webp"
        },
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
          "landscape": 27.5,
          "portrait": 27.5
        },
        "stepImages": [
          0,
          0,
          1,
          2,
          3,
          4
        ]
      },
      "operation": {
        "type": "observe",
        "steps": [
          "blow",
          "hide",
          "sew",
          "hammer",
          "arrange"
        ],
        "objects": [
          {
            "action": "blow",
            "label": "吹熄蠟燭",
            "x": 27.5,
            "y": 58,
            "width": 5,
            "ratio": 1.25,
            "angle": 0,
            "sprite": "candle-lit",
            "gesture": "tap",
            "toStep": 0
          },
          {
            "action": "hide",
            "label": "拉布簾躲好",
            "x": 8,
            "y": 44,
            "width": 9,
            "ratio": 1.6,
            "angle": 0,
            "gesture": "dragToTarget",
            "hotspot": true,
            "fromStep": 1,
            "toStep": 1,
            "region": "target"
          },
          {
            "action": "curtain-target",
            "label": "拉起布簾的位置",
            "x": 19,
            "y": 44,
            "width": 8,
            "ratio": 1.6,
            "angle": 0,
            "target": true,
            "fromStep": 1,
            "toStep": 1
          },
          {
            "action": "sew",
            "label": "觀察縫皮革",
            "x": 46,
            "y": 58,
            "width": 9,
            "ratio": 0.8,
            "angle": 0,
            "gesture": "observe",
            "hotspot": true,
            "observation": "看看針線和皮革怎麼移動。",
            "fromStep": 2,
            "toStep": 2
          },
          {
            "action": "hammer",
            "label": "觀察敲鞋底",
            "x": 50,
            "y": 58,
            "width": 9,
            "ratio": 0.8,
            "angle": 0,
            "gesture": "observe",
            "hotspot": true,
            "observation": "看看兩個小精靈怎麼合力用鐵鎚。",
            "fromStep": 3,
            "toStep": 3
          },
          {
            "action": "arrange",
            "label": "觀察擺鞋",
            "x": 50,
            "y": 62,
            "width": 10,
            "ratio": 0.8,
            "angle": 0,
            "gesture": "observe",
            "hotspot": true,
            "observation": "看看做好的鞋放在哪裡。",
            "fromStep": 4,
            "toStep": 4
          }
        ],
        "silentObserve": true,
        "regions": {
          "target": {
            "left": 15,
            "right": 23,
            "top": 36,
            "bottom": 52
          }
        },
        "focus": [
          27.5,
          13.25,
          46,
          50,
          50,
          50
        ],
        "prompts": [
          "點蠟燭，吹熄。",
          "把布簾拉到光暈。",
          "觀察：縫皮革。",
          "觀察：敲鞋底。",
          "觀察：擺鞋。",
          "看看桌上的新鞋。"
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
          "state": 4,
          "level": 2
        },
        {
          "state": 4,
          "level": 2
        }
      ],
      "beats": {
        "intro": [
          {
            "para": 1,
            "sentences": [
              44,
              45,
              46,
              47,
              48,
              49,
              50,
              51,
              52
            ],
            "sha": [
              "ebf316ce",
              "9e4973ef",
              "18c4de8f",
              "1c64835d",
              "4a13f023",
              "de85ff03",
              "9afb96e1",
              "d749af6b",
              "c7fea3f3"
            ]
          }
        ],
        "act": {
          "demo": false
        },
        "result": {
          "view": "work",
          "duration": 2400
        },
        "read": [
          {
            "para": 1,
            "sentences": [
              53,
              54,
              55,
              56,
              57,
              58,
              59,
              60,
              61,
              62,
              63,
              64,
              65,
              66,
              67,
              68,
              69,
              70,
              71,
              72,
              73,
              74,
              75,
              76
            ],
            "sha": [
              "6a134a04",
              "32bbcc6d",
              "cfa93bd6",
              "ad42b9e4",
              "bcd61149",
              "f81259c6",
              "35284c51",
              "11aa9dd5",
              "e85e1d5d",
              "01ac5126",
              "5e3f124e",
              "cfef2e5f",
              "75f8c881",
              "d0825b6f",
              "053b7c62",
              "183c5df6",
              "5f3f91f8",
              "1bb28443",
              "2991f645",
              "92380b85",
              "f26438a0",
              "4f1b4a2d",
              "aef229cd",
              "539614fd"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "evidence",
          "label": "本幕原句",
          "object": "blow",
          "note": "完成操作後，讀原句找線索。",
          "refs": [
            {
              "para": 1,
              "sentences": [
                44,
                45,
                46,
                47,
                48,
                49,
                50,
                51,
                52,
                53,
                54,
                55,
                56,
                57,
                58,
                59,
                60,
                61,
                62,
                63,
                64,
                65,
                66,
                67,
                68,
                69,
                70,
                71,
                72,
                73,
                74,
                75,
                76
              ],
              "sha": [
                "ebf316ce",
                "9e4973ef",
                "18c4de8f",
                "1c64835d",
                "4a13f023",
                "de85ff03",
                "9afb96e1",
                "d749af6b",
                "c7fea3f3",
                "6a134a04",
                "32bbcc6d",
                "cfa93bd6",
                "ad42b9e4",
                "bcd61149",
                "f81259c6",
                "35284c51",
                "11aa9dd5",
                "e85e1d5d",
                "01ac5126",
                "5e3f124e",
                "cfef2e5f",
                "75f8c881",
                "d0825b6f",
                "053b7c62",
                "183c5df6",
                "5f3f91f8",
                "1bb28443",
                "2991f645",
                "92380b85",
                "f26438a0",
                "4f1b4a2d",
                "aef229cd",
                "539614fd"
              ]
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "skill",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "kind": "摘要",
          "pirls": "統整",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "小精靈把鞋子擺好",
            "夫婦吹熄蠟燭",
            "夫婦躲起來，發現小精靈合作做鞋"
          ],
          "answer": 2,
          "summaryImages": [
            "night-unlit.webp",
            "midnight-sew.webp",
            "midnight-finished.webp"
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
              "para": 1,
              "sentences": [
                44,
                45,
                46,
                47,
                48,
                49,
                50,
                51,
                52
              ],
              "sha": [
                "ebf316ce",
                "9e4973ef",
                "18c4de8f",
                "1c64835d",
                "4a13f023",
                "de85ff03",
                "9afb96e1",
                "d749af6b",
                "c7fea3f3"
              ]
            },
            {
              "para": 1,
              "sentences": [
                53,
                54,
                55,
                56,
                57,
                58,
                59,
                60,
                61,
                62,
                63,
                64,
                65,
                66,
                67,
                68,
                69,
                70,
                71,
                72,
                73,
                74,
                75,
                76
              ],
              "sha": [
                "6a134a04",
                "32bbcc6d",
                "cfa93bd6",
                "ad42b9e4",
                "bcd61149",
                "f81259c6",
                "35284c51",
                "11aa9dd5",
                "e85e1d5d",
                "01ac5126",
                "5e3f124e",
                "cfef2e5f",
                "75f8c881",
                "d0825b6f",
                "053b7c62",
                "183c5df6",
                "5f3f91f8",
                "1bb28443",
                "2991f645",
                "92380b85",
                "f26438a0",
                "4f1b4a2d",
                "aef229cd",
                "539614fd"
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
                44,
                45,
                46,
                47,
                48,
                49,
                50
              ],
              "sha": [
                "ebf316ce",
                "9e4973ef",
                "18c4de8f",
                "1c64835d",
                "4a13f023",
                "de85ff03",
                "9afb96e1"
              ]
            }
          ]
        },
        {
          "kind": "act",
          "untilStep": 1
        },
        {
          "kind": "intro",
          "refs": [
            {
              "para": 1,
              "sentences": [
                51,
                52
              ],
              "sha": [
                "d749af6b",
                "c7fea3f3"
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
                53,
                54,
                55,
                56,
                57,
                58,
                59,
                60,
                61,
                62,
                63,
                64,
                65,
                66,
                67,
                68,
                69,
                70,
                71,
                72,
                73,
                74,
                75,
                76
              ],
              "sha": [
                "6a134a04",
                "32bbcc6d",
                "cfa93bd6",
                "ad42b9e4",
                "bcd61149",
                "f81259c6",
                "35284c51",
                "11aa9dd5",
                "e85e1d5d",
                "01ac5126",
                "5e3f124e",
                "cfef2e5f",
                "75f8c881",
                "d0825b6f",
                "053b7c62",
                "183c5df6",
                "5f3f91f8",
                "1bb28443",
                "2991f645",
                "92380b85",
                "f26438a0",
                "4f1b4a2d",
                "aef229cd",
                "539614fd"
              ]
            }
          ]
        },
        {
          "kind": "strategy",
          "id": "wonder-clues",
          "hideOperations": true,
          "imageIndex": 1
        },
        {
          "kind": "question"
        }
      ],
      "strategies": [
        {
          "id": "wonder-clues",
          "type": "emotionClue",
          "prompt": "點老鞋匠夫婦的表情，找心情線索。",
          "options": [
            {
              "label": "老鞋匠的表情",
              "x": 43.9,
              "y": 34.5,
              "face": {
                "width": 1.8,
                "height": 4.5
              },
              "markerOffset": [
                -3,
                0
              ],
              "states": [
                4
              ],
              "refs": [
                {
                  "para": 1,
                  "sentences": [
                    73
                  ],
                  "sha": [
                    "f26438a0"
                  ]
                }
              ]
            },
            {
              "label": "妻子的表情",
              "x": 46.8,
              "y": 35.5,
              "face": {
                "width": 1.8,
                "height": 4.5
              },
              "markerOffset": [
                3,
                0
              ],
              "states": [
                4
              ],
              "refs": [
                {
                  "para": 1,
                  "sentences": [
                    73
                  ],
                  "sha": [
                    "f26438a0"
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
              "para": 1,
              "sentences": [
                73
              ],
              "sha": [
                "f26438a0"
              ]
            }
          ],
          "hint": "再看看窗後兩人的臉。"
        }
      ]
    },
    {
      "id": "thank-you-gifts",
      "act": 4,
      "title": "送給小精靈的禮物",
      "goal": "把小衣裳和小鞋子放到桌上。",
      "view": "work",
      "stationType": "challenge",
      "assetBase": "assets/situation/115AG4K12/",
      "art": {
        "images": [
          "night.webp",
          "gifts.webp",
          "depart.webp",
          "midnight-hammer.webp"
        ],
        "aspect": [
          2400,
          1024
        ],
        "hotspots": {},
        "effects": {},
        "views": {
          "work": 0.475,
          "depart": 1
        },
        "orientationFocus": {
          "landscape": 50,
          "portrait": 50
        },
        "stepImages": [
          0,
          0,
          0
        ],
        "resultImage": 2,
        "resultDelay": 1800,
        "resultView": "depart",
        "hideCompletedOnResult": true
      },
      "operation": {
        "type": "dragToTarget",
        "steps": [
          "clothes",
          "little-shoes"
        ],
        "objects": [
          {
            "action": "clothes",
            "label": "把小衣裳放到桌上",
            "x": 45,
            "y": 63,
            "width": 9.6,
            "ratio": 0.6,
            "angle": 0,
            "sprite": "clothes",
            "destination": [
              45,
              63
            ],
            "minHitSize": 64
          },
          {
            "action": "little-shoes",
            "label": "把小鞋子放到桌上",
            "x": 55,
            "y": 63,
            "width": 9.6,
            "ratio": 0.6,
            "angle": 0,
            "sprite": "little-shoes",
            "destination": [
              55,
              63
            ],
            "minHitSize": 64
          },
          {
            "action": "table",
            "label": "擺禮物的位置",
            "x": 51,
            "y": 64,
            "width": 10,
            "ratio": 0.6,
            "angle": 0,
            "target": true,
            "toStep": 1
          }
        ],
        "focus": [
          50,
          50,
          50
        ],
        "collect": [
          "clothes",
          "little-shoes"
        ],
        "regions": {
          "target": {
            "left": 39,
            "right": 61,
            "top": 56,
            "bottom": 69
          }
        },
        "prompts": [
          "擺上兩份禮物。",
          "擺上另一份禮物。",
          "禮物都擺好了。"
        ],
        "keepCompleted": true
      },
      "meter": [
        {
          "state": 4,
          "level": 2
        },
        {
          "state": 4,
          "level": 2
        },
        {
          "state": 5,
          "level": 3
        }
      ],
      "beats": {
        "intro": [
          {
            "para": 1,
            "sentences": [
              77,
              78,
              79,
              80
            ],
            "sha": [
              "ee13c3c0",
              "0f67fad1",
              "373718d9",
              "713a1e7c"
            ]
          }
        ],
        "act": {
          "demo": false
        },
        "result": {
          "view": "work",
          "duration": 4800
        },
        "read": [
          {
            "para": 1,
            "sentences": [
              81,
              82,
              83,
              84,
              85,
              86,
              87,
              88,
              89,
              90,
              91,
              92,
              93,
              94,
              95,
              96,
              97,
              98,
              99
            ],
            "sha": [
              "737a1d8c",
              "f89bb6ac",
              "fb1d01b3",
              "d59f5093",
              "3f6e2d1e",
              "85c0eac3",
              "c55e590e",
              "20b736e5",
              "a7a0e78c",
              "93aafdda",
              "bc990002",
              "d5be3bd6",
              "a09ff2da",
              "5bfce826",
              "1ca76ac5",
              "ecc4de6d",
              "81b3b283",
              "18ef0f65",
              "8474d959"
            ]
          }
        ]
      },
      "clues": [
        {
          "id": "evidence",
          "label": "本幕原句",
          "object": "clothes",
          "note": "完成操作後，讀原句找線索。",
          "refs": [
            {
              "para": 1,
              "sentences": [
                77,
                78,
                79,
                80,
                81,
                82,
                83,
                84,
                85,
                86,
                87,
                88,
                89,
                90,
                91,
                92,
                93,
                94,
                95,
                96,
                97,
                98,
                99
              ],
              "sha": [
                "ee13c3c0",
                "0f67fad1",
                "373718d9",
                "713a1e7c",
                "737a1d8c",
                "f89bb6ac",
                "fb1d01b3",
                "d59f5093",
                "3f6e2d1e",
                "85c0eac3",
                "c55e590e",
                "20b736e5",
                "a7a0e78c",
                "93aafdda",
                "bc990002",
                "d5be3bd6",
                "a09ff2da",
                "5bfce826",
                "1ca76ac5",
                "ecc4de6d",
                "81b3b283",
                "18ef0f65",
                "8474d959"
              ]
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "story-order",
          "type": "summaryCard",
          "operationType": "summaryCard",
          "kind": "摘要",
          "pirls": "統整",
          "stem": "這一幕最重要的事是什麼？",
          "options": [
            "夫婦送衣鞋答謝，小精靈快樂離開",
            "桌上沒有放皮革",
            "小精靈看見桌上的禮物"
          ],
          "answer": 0,
          "summaryImages": [
            "night.webp",
            "gifts.webp",
            "midnight-hammer.webp"
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
                77,
                78,
                79,
                80
              ],
              "sha": [
                "ee13c3c0",
                "0f67fad1",
                "373718d9",
                "713a1e7c"
              ]
            },
            {
              "para": 1,
              "sentences": [
                81,
                82,
                83,
                84,
                85,
                86,
                87,
                88,
                89,
                90,
                91,
                92,
                93,
                94,
                95,
                96,
                97,
                98,
                99
              ],
              "sha": [
                "737a1d8c",
                "f89bb6ac",
                "fb1d01b3",
                "d59f5093",
                "3f6e2d1e",
                "85c0eac3",
                "c55e590e",
                "20b736e5",
                "a7a0e78c",
                "93aafdda",
                "bc990002",
                "d5be3bd6",
                "a09ff2da",
                "5bfce826",
                "1ca76ac5",
                "ecc4de6d",
                "81b3b283",
                "18ef0f65",
                "8474d959"
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
                77,
                78,
                79,
                80
              ],
              "sha": [
                "ee13c3c0",
                "0f67fad1",
                "373718d9",
                "713a1e7c"
              ]
            }
          ]
        },
        {
          "kind": "strategy",
          "id": "gift-reason",
          "hideOperations": true,
          "imageIndex": 3
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
                81,
                82,
                83,
                84,
                85,
                86,
                87,
                88,
                89,
                90,
                91,
                92,
                93,
                94,
                95,
                96,
                97,
                98,
                99
              ],
              "sha": [
                "737a1d8c",
                "f89bb6ac",
                "fb1d01b3",
                "d59f5093",
                "3f6e2d1e",
                "85c0eac3",
                "c55e590e",
                "20b736e5",
                "a7a0e78c",
                "93aafdda",
                "bc990002",
                "d5be3bd6",
                "a09ff2da",
                "5bfce826",
                "1ca76ac5",
                "ecc4de6d",
                "81b3b283",
                "18ef0f65",
                "8474d959"
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
          "id": "gift-reason",
          "type": "causeEffect",
          "prompt": "夫婦為什麼要做新衣新鞋？點回想畫面中的兩個線索。",
          "options": [
            {
              "label": "小精靈的破衣",
              "x": 43,
              "y": 58.5,
              "refs": [
                {
                  "para": 1,
                  "sentences": [
                    58
                  ],
                  "sha": [
                    "f81259c6"
                  ]
                }
              ]
            },
            {
              "label": "小精靈的光腳",
              "x": 42,
              "y": 61.5,
              "refs": [
                {
                  "para": 1,
                  "sentences": [
                    59
                  ],
                  "sha": [
                    "35284c51"
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
              "para": 1,
              "sentences": [
                58,
                59
              ],
              "sha": [
                "f81259c6",
                "35284c51"
              ]
            }
          ],
          "result": [
            50,
            64
          ],
          "hint": "再看看小精靈身上和腳上少了什麼。",
          "explanation": "夫婦看見破衣與光腳，準備適合小精靈的衣服和鞋子。"
        }
      ]
    }
  ],
  "ending": {
    "title": "把故事線索連起來",
    "refs": [
      {
        "para": 1,
        "sentences": [
          98,
          99
        ],
        "sha": [
          "18ef0f65",
          "8474d959"
        ]
      }
    ]
  },
  "review": [
    [
      "因果：",
      "把收入、食物和材料的關係說清楚。"
    ],
    [
      "觀察：",
      "用做鞋的動作作為描述人物的依據。"
    ],
    [
      "回應善意：",
      "說說夫妻倆用哪些行動答謝幫手。"
    ]
  ],
  "excludedUnits": [
    {
      "para": 1,
      "sentences": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ]
    }
  ],
  "storySentenceCount": 93,
  "speakers": {
    "1:7": "",
    "1:8": "",
    "1:9": "",
    "1:10": "",
    "1:11": "",
    "1:12": "",
    "1:13": "",
    "1:14": "",
    "1:15": "",
    "1:16": "",
    "1:17": "",
    "1:18": "",
    "1:19": "",
    "1:20": "",
    "1:21": "",
    "1:22": "",
    "1:23": "",
    "1:24": "",
    "1:25": "老鞋匠",
    "1:26": "老鞋匠",
    "1:27": "老鞋匠",
    "1:28": "",
    "1:29": "",
    "1:30": "",
    "1:31": "",
    "1:32": "",
    "1:33": "顧客",
    "1:34": "顧客",
    "1:35": "",
    "1:36": "",
    "1:37": "",
    "1:38": "",
    "1:39": "",
    "1:40": "",
    "1:41": "",
    "1:42": "",
    "1:43": "",
    "1:44": "",
    "1:45": "",
    "1:46": "",
    "1:47": "老鞋匠",
    "1:48": "",
    "1:49": "妻子",
    "1:50": "妻子",
    "1:51": "",
    "1:52": "",
    "1:53": "",
    "1:54": "小精靈",
    "1:55": "小精靈",
    "1:56": "小精靈",
    "1:57": "",
    "1:58": "",
    "1:59": "",
    "1:60": "",
    "1:61": "",
    "1:62": "",
    "1:63": "",
    "1:64": "",
    "1:65": "",
    "1:66": "",
    "1:67": "",
    "1:68": "",
    "1:69": "",
    "1:70": "",
    "1:71": "",
    "1:72": "",
    "1:73": "",
    "1:74": "",
    "1:75": "老鞋匠",
    "1:76": "老鞋匠",
    "1:77": "",
    "1:78": "妻子",
    "1:79": "妻子",
    "1:80": "妻子",
    "1:81": "",
    "1:82": "",
    "1:83": "",
    "1:84": "",
    "1:85": "小精靈",
    "1:86": "小精靈",
    "1:87": "小精靈",
    "1:88": "小精靈",
    "1:89": "小精靈",
    "1:90": "小精靈",
    "1:91": "",
    "1:92": "",
    "1:93": "",
    "1:94": "小精靈",
    "1:95": "小精靈",
    "1:96": "",
    "1:97": "",
    "1:98": "",
    "1:99": ""
  }
};
