// 原句僅由正式密碼門解密；此檔只存索引與 SHA-256 前8碼。
export default {
  "schemaVersion": 1,
  "lessonId": "115AG4K12",
  "version": 1,
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
    "speaker": "故事中的人物",
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
        }
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
            "x": 50,
            "y": 65,
            "width": 18,
            "ratio": 0.6,
            "angle": 0,
            "sprite": "leather",
            "passive": true,
            "toStep": 0
          },
          {
            "action": "cut",
            "label": "沿虛線剪裁；鍵盤可連按五次逐步剪",
            "x": 43,
            "y": 65,
            "width": 5.5,
            "ratio": 1,
            "angle": 0,
            "sprite": "scissors",
            "path": [
              [
                43,
                65
              ],
              [
                46.5,
                65
              ],
              [
                50,
                65
              ],
              [
                53.5,
                65
              ],
              [
                57,
                65
              ]
            ],
            "tolerance": 2.8,
            "toStep": 0
          },
          {
            "action": "cut-piece",
            "label": "剪好的皮革上半部",
            "x": 50,
            "y": 63,
            "width": 18,
            "ratio": 0.28,
            "angle": 0,
            "sprite": "leather-top",
            "passive": true,
            "fromStep": 1
          },
          {
            "action": "cut-off",
            "label": "剪下並脫離的皮革",
            "x": 50,
            "y": 70,
            "width": 18,
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
              18,
              19,
              20,
              21
            ],
            "sha": [
              "fb5d242b",
              "1ebc4278",
              "6440dec9",
              "ec206b0d",
              "9b1eb304",
              "c65db568",
              "ed7a5803",
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
              "d5da0629"
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
              22,
              23,
              24,
              25,
              26,
              27
            ],
            "sha": [
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
                "fb5d242b",
                "1ebc4278",
                "6440dec9",
                "ec206b0d",
                "9b1eb304",
                "c65db568",
                "ed7a5803",
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
          "type": "choice",
          "operationType": "chooseCard",
          "kind": "理解與推論",
          "stem": "老鞋匠為什麼沒辦法再添購皮革？",
          "options": [
            "賣鞋所得只夠買食物。",
            "顧客把所有皮革拿走了。",
            "妻子禁止他繼續做鞋。"
          ],
          "answer": 0,
          "why": [
            "先維持吃飯所需，就沒有餘錢買材料。",
            "課文沒有說顧客拿走皮革。",
            "妻子沒有禁止他做鞋；要找收入與支出的線索。"
          ],
          "hints": [
            "找找賣鞋之後的錢用在哪裡。",
            "比較食物和做鞋材料這兩項支出。",
            "回讀本幕最後的話，確認錢能支付什麼。"
          ],
          "explanation": "收入不足，買食物後就無法補充做鞋材料。",
          "refs": [
            {
              "para": 1,
              "sentences": [
                22,
                23,
                24,
                25,
                26,
                27
              ],
              "sha": [
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
          "work": 0.5
        },
        "orientationFocus": {
          "landscape": 61.5,
          "portrait": 61.5
        },
        "stepImages": [
          0,
          0,
          1
        ]
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
          61.5,
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
          "type": "choice",
          "operationType": "chooseCard",
          "kind": "理解與推論",
          "stem": "生意好轉後，夫妻倆還想弄清楚什麼事？",
          "options": [
            "顧客為什麼喜歡逛鞋店？",
            "夜裡是誰把皮革做成鞋？",
            "鞋店開在哪一座城鎮？"
          ],
          "answer": 1,
          "why": [
            "顧客買鞋不是夫妻倆仍未解開的疑問。",
            "他們看見新鞋，卻還沒看見製鞋的人。",
            "城鎮地點不是這裡要追查的事。"
          ],
          "hints": [
            "找生意好轉之後，還沒有答案的事。",
            "注意皮革和新鞋在夜裡發生的變化。",
            "回讀本幕結尾的疑問，把想知道的人或事圈出來。"
          ],
          "explanation": "謎團關係到夜裡幫忙做鞋的人。",
          "refs": [
            {
              "para": 1,
              "sentences": [
                37,
                38,
                39,
                40,
                41,
                42,
                43
              ],
              "sha": [
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
          "type": "choice",
          "operationType": "chooseCard",
          "kind": "理解與推論",
          "stem": "哪一項最符合小精靈做鞋的表現？",
          "options": [
            "動作笨拙，需要老鞋匠協助。",
            "身材高大，一次就能搬走整張桌子。",
            "個子雖小，手藝靈巧，還能合作。"
          ],
          "answer": 2,
          "why": [
            "他們能自己完成工作；文中沒有老鞋匠幫忙做鞋的情節。",
            "他們很小，沒有搬桌子的情節。",
            "縫製、合力敲打和完成鞋子的線索都支持這一項。"
          ],
          "hints": [
            "依序回想縫製、敲打、擺放三個動作。",
            "比較他們的身材和完成工作的表現。",
            "回讀描述手藝、合作和完成速度的句子，再逐項核對。"
          ],
          "explanation": "從細小的身材、熟練的動作和合力做事，能看出他們的手藝。",
          "refs": [
            {
              "para": 1,
              "sentences": [
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
                72
              ],
              "sha": [
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
                "92380b85"
              ]
            }
          ]
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
          "depart.webp"
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
          1
        ],
        "resultImage": 2,
        "resultDelay": 1800,
        "resultView": "depart"
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
            "x": 44,
            "y": 71,
            "width": 6,
            "ratio": 0.6,
            "angle": 0,
            "sprite": "clothes",
            "toStep": 1,
            "destination": [
              49,
              64
            ]
          },
          {
            "action": "little-shoes",
            "label": "把小鞋子放到桌上",
            "x": 56,
            "y": 71,
            "width": 6,
            "ratio": 0.6,
            "angle": 0,
            "sprite": "little-shoes",
            "toStep": 1,
            "destination": [
              53,
              64
            ]
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
            "left": 46,
            "right": 56,
            "top": 59,
            "bottom": 69
          }
        },
        "prompts": [
          "擺上兩份禮物。",
          "擺上另一份禮物。",
          "禮物都擺好了。"
        ]
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
          "type": "order",
          "operationType": "orderCards",
          "kind": "統整事件",
          "stem": "依故事發生的先後排列四件事。",
          "options": [
            "送上答謝的禮物",
            "清晨看到做好的新鞋",
            "裁剪最後的皮革",
            "藏起來觀察夜裡的工作"
          ],
          "initialOrder": [
            0,
            1,
            2,
            3
          ],
          "answer": [
            2,
            1,
            3,
            0
          ],
          "why": [
            "送禮是知道幫手身分之後的答謝，不能排在觀察之前。",
            "新鞋是在裁剪皮革之後才出現；發現新鞋時還不知道是誰幫忙。",
            "最後的皮革是夜裡幫忙的故事開始前就剪好的。",
            "先有未解的疑問，才躲起來觀察；送禮要排在這之後。"
          ],
          "hints": [
            "先找故事開始時，老鞋匠遇到的困難。",
            "分清楚看到新鞋和看到製鞋的人，哪一件先發生。",
            "把四幕各自的操作與結果連起來，再檢查前後因果。"
          ],
          "explanation": "先遇到材料用盡的困難，再發現新鞋、觀察幫手，最後準備禮物答謝。",
          "refs": [
            {
              "para": 1,
              "sentences": [
                22,
                23,
                24,
                25,
                26,
                27,
                28,
                29,
                30
              ],
              "sha": [
                "bbfade9f",
                "17a8a749",
                "ca737ca8",
                "19b20960",
                "02b59544",
                "aaee2c15",
                "7fe1e57c",
                "7b136897",
                "190763dd"
              ]
            },
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
                77,
                78,
                79,
                80,
                81,
                82,
                83,
                84
              ],
              "sha": [
                "ee13c3c0",
                "0f67fad1",
                "373718d9",
                "713a1e7c",
                "737a1d8c",
                "f89bb6ac",
                "fb1d01b3",
                "d59f5093"
              ]
            }
          ]
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
  ]
};
