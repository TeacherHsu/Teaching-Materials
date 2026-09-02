(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.ReadingPronunciationRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const VERSION = '1.4.0';

    // Teacher-approved defaults. Phrase rules below take precedence when the
    // surrounding text establishes another reading.
    const COMMON_DEFAULTS = {
        '著': '˙ㄓㄜ',
        '和': 'ㄏㄢˋ',
        '得': '˙ㄉㄜ',
        '誰': 'ㄕㄟˊ',
        // 複數詞綴「們」的語音讀輕聲；ㄇㄣˊ 只留給「圖們江」等專有名詞。
        '們': '˙ㄇㄣ',
        // 名詞詞尾「子」多為輕聲（孩子、桌子）；本義的「子」由下方 ZI3_PHRASES 覆寫。
        '子': '˙ㄗ',
        // 「麗」的美好、華美義讀 ㄌㄧˋ；ㄌㄧˊ 只用於「高麗」系列，見 LI2_PHRASES。
        '麗': 'ㄌㄧˋ',
    };

    const KINSHIP_REDUPLICATIONS = {
        '媽媽': '˙ㄇㄚ', '爸爸': '˙ㄅㄚ', '爺爺': '˙ㄧㄝ', '奶奶': '˙ㄋㄞ',
        '公公': '˙ㄍㄨㄥ', '婆婆': '˙ㄆㄛ', '哥哥': '˙ㄍㄜ', '姐姐': '˙ㄐㄧㄝ',
        '姊姊': '˙ㄗ', '弟弟': '˙ㄉㄧ', '妹妹': '˙ㄇㄟ', '伯伯': '˙ㄅㄛ',
        '叔叔': '˙ㄕㄨ', '姑姑': '˙ㄍㄨ', '舅舅': '˙ㄐㄧㄡ', '姨姨': '˙ㄧ',
        '嬸嬸': '˙ㄕㄣ', '太太': '˙ㄊㄞ',
    };

    const HIGH_RISK_CHARS = new Set([
        '著', '和', '得', '誰', '一', '不', '樂', '長', '種', '重', '數', '行',
        '還', '調', '應', '乾', '差', '場', '興', '模', '彈', '給', '切', '中',
        '覺', '省', '喔', '盡', '們', '子', '麗',
    ]);

    const phraseRule = (id, phrase, targets) => ({ id, phrase, targets });
    const targetChar = (id, phrases, char, zhuyin) => phrases.map(phrase => {
        const offset = phrase.indexOf(char);
        if (offset < 0) throw new Error(`Rule ${id} cannot find ${char} in ${phrase}`);
        return phraseRule(id, phrase, [{ offset, zhuyin }]);
    });

    const CLASSIFIER_PRECEDERS = new Set(Array.from('一二三四五六七八九十百千萬兩两每各這那哪幾'));
    const JIN4_PHRASES = [
        '用盡', '盡力', '盡情', '盡頭', '盡興', '盡歡', '意猶未盡',
        '想盡辦法', '盡可能', '盡量', '盡快', '盡責', '盡忠', '盡心',
    ];
    const YI_HUI_ER_SPEECH = ['義', '毀', 'ㄦ'];

    // 「們」的本音 ㄇㄣˊ 只出現在專有名詞；其餘複數詞綴一律輕聲。
    const MEN2_PHRASES = ['圖們江', '圖們'];

    // 「麗」讀 ㄌㄧˊ 的語境只有「高麗」系列（韓國古國名與高麗菜）。
    const LI2_PHRASES = ['高句麗', '高麗菜', '高麗'];

    // 「子」讀本音 ㄗˇ 的語境：本義（子女、種子）、諸子人名、學術詞與
    // 教師已在 115 課次核定的讀法（女子、妻子）。未列出的名詞詞尾走輕聲預設。
    const ZI3_PHRASES = [
        '子女', '子孫', '子彈', '子弟', '子民', '子宮', '子夜', '子時', '子音', '子句',
        '子曰', '子路', '子貢',
        '孔子', '孟子', '老子', '莊子', '荀子', '墨子', '君子', '弟子', '學子',
        '才子', '遊子', '赤子', '天子', '王子', '太子', '皇子', '公子',
        '女子', '男子', '父子', '母子', '妻子', '親子',
        '種子', '蓮子', '愛玉子', '分子', '原子', '電子', '粒子', '量子', '精子', '卵子',
    ];

    // Browser speech synthesis reads the source character, not the displayed
    // Zhuyin. These homophones are the approved TTS layer for corrected
    // polyphonic readings; ordinary readings continue to use the source char.
    const TTS_HOMOPHONES = {
        '一|ㄧˊ': '宜', '一|ㄧˋ': '義',
        '不|ㄅㄨˊ': '轐',
        '數|ㄕㄨˇ': '暑',
        '喔|ㄨㄛˋ': '握',
        '省|ㄒㄧㄥˇ': '醒',
        '給|ㄐㄧˇ': '己',
        '行|ㄒㄧㄥˊ': '形', '行|ㄏㄤˊ': '航',
        '長|ㄔㄤˊ': '常',
        '重|ㄔㄨㄥˊ': '蟲',
        '種|ㄓㄨㄥˋ': '眾',
        '應|ㄧㄥˋ': '映',
        '調|ㄊㄧㄠˊ': '條',
        '樂|ㄩㄝˋ': '悅',
        '彈|ㄊㄢˊ': '談',
        '差|ㄔㄚ': '查',
        '乾|ㄍㄢ': '甘',
        '場|ㄔㄤˊ': '常',
        '還|ㄏㄨㄢˊ': '環',
        '覺|ㄐㄧㄠˋ': '叫',
        '興|ㄒㄧㄥ': '星',
        '中|ㄓㄨㄥ': '終',
        '和|ㄏㄜˊ': '何', '和|ㄏㄢˋ': '漢',
        '盡|ㄐㄧㄣˋ': '進',
        '得|ㄉㄜˊ': '德', '得|˙ㄉㄜ': '的',
        '著|ㄓㄨˋ': '注', '著|ㄓㄨㄛˊ': '卓',
    };

    function isClassifierGeAt(chars, index) {
        if (chars[index] !== '個') return false;
        const previous = chars[index - 1] || '';
        const previousTwo = chars[index - 2] || '';
        return CLASSIFIER_PRECEDERS.has(previous)
            || (previous === '個' && CLASSIFIER_PRECEDERS.has(previousTwo));
    }

    function expectedContextualReadings(text) {
        const chars = Array.from(text || '');
        const expected = {};
        for (let index = 0; index < chars.length; index++) {
            if (isClassifierGeAt(chars, index)) expected[index] = '˙ㄍㄜ';
            if (chars[index] === '一' && chars.slice(index, index + 3).join('') === '一會兒') {
                expected[index] = 'ㄧˋ';
                expected[index + 1] = 'ㄏㄨㄟˇ';
                expected[index + 2] = 'ㄦ';
            }
        }
        // 「們」逐位置固定輕聲；專有名詞「圖們」保留本音，稍後由詞語規則覆寫。
        chars.forEach((char, index) => {
            if (char === '們' && chars[index - 1] !== '圖') expected[index] = '˙ㄇㄣ';
            // 「麗」逐位置固定 ㄌㄧˋ；「高麗」系列稍後由詞語規則覆寫。
            if (char === '麗' && chars[index - 1] !== '高') expected[index] = 'ㄌㄧˋ';
        });
        [...ZI3_PHRASES, ...MEN2_PHRASES, ...LI2_PHRASES].forEach(phrase => {
            const char = phrase.includes('子') ? '子' : (phrase.includes('們') ? '們' : '麗');
            const zhuyin = { '子': 'ㄗˇ', '們': 'ㄇㄣˊ', '麗': 'ㄌㄧˊ' }[char];
            let start = 0;
            while (start <= chars.length - phrase.length) {
                const found = text.indexOf(phrase, start);
                if (found < 0) break;
                expected[found + phrase.indexOf(char)] = zhuyin;
                start = found + Math.max(1, phrase.length);
            }
        });
        JIN4_PHRASES.forEach(phrase => {
            let start = 0;
            while (start <= chars.length - phrase.length) {
                const found = text.indexOf(phrase, start);
                if (found < 0) break;
                const jinIndex = found + phrase.indexOf('盡');
                expected[jinIndex] = 'ㄐㄧㄣˋ';
                start = found + Math.max(1, phrase.length);
            }
        });
        return expected;
    }

    function expectedSpeechOverrides(text, readings = []) {
        const chars = Array.from(text || '');
        const expected = {};
        chars.forEach((char, index) => {
            const phoneChar = TTS_HOMOPHONES[`${char}|${normalizeZhuyin(readings[index] || '')}`];
            if (phoneChar) expected[index] = phoneChar;
        });
        let start = 0;
        while (start <= chars.length - 3) {
            const found = String(text || '').indexOf('一會兒', start);
            if (found < 0) break;
            YI_HUI_ER_SPEECH.forEach((phoneChar, offset) => {
                expected[found + offset] = phoneChar;
            });
            start = found + 3;
        }
        return expected;
    }

    // Rules are intentionally phrase-bound. They are distilled from the 115
    // lesson corrections plus common classroom vocabulary; they must not turn
    // into a blind per-character replacement table.
    const PHRASE_RULES = [
        ...targetChar('he-he2', ['和尚', '和平', '和諧', '和好', '和氣', '和睦', '和解', '和談', '和聲', '和弦'], '和', 'ㄏㄜˊ'),
        ...targetChar('he-he2-after', ['溫和', '柔和', '緩和', '調和', '祥和', '平和', '共和', '總和'], '和', 'ㄏㄜˊ'),
        ...targetChar('he-huo2', ['和麵', '和泥'], '和', 'ㄏㄨㄛˊ'),
        ...targetChar('he-huo-neutral', ['暖和'], '和', '˙ㄏㄨㄛ'),
        ...targetChar('he-hu2', ['和牌'], '和', 'ㄏㄨˊ'),

        ...targetChar('zhe-zhu4', ['著名', '著作', '著者', '著書', '著述', '著稱', '原著', '名著', '土著', '顯著', '卓著'], '著', 'ㄓㄨˋ'),
        ...targetChar('zhe-zhao2', ['著迷', '著急', '睡著', '找著', '猜著', '著火', '著涼', '著魔'], '著', 'ㄓㄠˊ'),
        ...targetChar('zhe-zhuo2', ['附著', '黏著', '執著', '著地', '著陸'], '著', 'ㄓㄨㄛˊ'),
        phraseRule('sleep-unable', '睡不著覺', [
            { offset: 2, zhuyin: 'ㄓㄠˊ' },
            { offset: 3, zhuyin: 'ㄐㄧㄠˋ' },
        ]),
        phraseRule('yi-hui-er', '一會兒', [
            { offset: 0, zhuyin: 'ㄧˋ' },
            { offset: 1, zhuyin: 'ㄏㄨㄟˇ' },
            { offset: 2, zhuyin: 'ㄦ' },
        ]),
        ...targetChar('jin-jin4', JIN4_PHRASES, '盡', 'ㄐㄧㄣˋ'),
        ...targetChar('zi-zi3', ZI3_PHRASES, '子', 'ㄗˇ'),
        ...targetChar('men-men2', MEN2_PHRASES, '們', 'ㄇㄣˊ'),
        ...targetChar('li-li2', LI2_PHRASES, '麗', 'ㄌㄧˊ'),

        ...targetChar('de-de2-front', ['得到', '得意', '得獎', '得分', '得手', '得名', '得知', '得救', '得罪', '得利', '得病'], '得', 'ㄉㄜˊ'),
        ...targetChar('de-de2-back', ['取得', '獲得', '贏得', '博得', '值得', '難得', '所得', '心得', '自得'], '得', 'ㄉㄜˊ'),
        ...targetChar('de-de2-result', ['不得', '得出'], '得', 'ㄉㄜˊ'),
        ...targetChar('de-neutral-fixed', ['禁不得', '經不得', '受不得', '忍不得', '捨不得', '巴不得'], '得', '˙ㄉㄜ'),
        ...targetChar('de-dei3', ['得走', '得先', '得再', '得去', '得做', '得把', '得從', '得用', '得有', '得靠', '得想', '得等'], '得', 'ㄉㄟˇ'),

        ...targetChar('music-yue4', ['音樂', '樂器', '樂團', '樂曲', '樂隊', '樂譜', '樂手', '樂章', '樂壇', '樂理', '樂聲', '聲樂', '器樂', '民樂', '國樂', '管樂', '弦樂', '爵士樂'], '樂', 'ㄩㄝˋ'),
        ...targetChar('happy-le4', ['快樂', '歡樂', '樂意', '樂趣', '樂園', '樂觀', '樂事'], '樂', 'ㄌㄜˋ'),
        ...targetChar('long-chang2', ['長頸鹿', '長度', '機翼長度', '漫長', '細長', '長條', '長圓', '一樣長', '又高又長', '長五十八公尺'], '長', 'ㄔㄤˊ'),
        ...targetChar('grow-zhang3', ['長大', '成長', '生長', '長高', '長出', '校長', '家長', '師長', '年長'], '長', 'ㄓㄤˇ'),
        ...targetChar('plant-zhong4', ['種樹', '種花', '種菜', '種田', '種出', '種在', '栽種', '耕種', '親自種', '誰種', '所種', '種的南瓜'], '種', 'ㄓㄨㄥˋ'),
        ...targetChar('kind-zhong3', ['種類', '種子', '品種', '物種', '各種', '這種', '那種', '一種'], '種', 'ㄓㄨㄥˇ'),
        ...targetChar('again-chong2', ['重陽', '重疊', '重複', '重新', '重來', '重逢', '重播', '重建'], '重', 'ㄔㄨㄥˊ'),
        ...targetChar('weight-zhong4', ['重要', '重量', '重大', '重點', '重視', '尊重', '慎重', '嚴重'], '重', 'ㄓㄨㄥˋ'),
        phraseRule('count-shu3-double', '來數數', [
            { offset: 1, zhuyin: 'ㄕㄨˇ' },
            { offset: 2, zhuyin: 'ㄕㄨˇ' },
        ]),
        phraseRule('count-shu3-a-count', '數一數', [
            { offset: 0, zhuyin: 'ㄕㄨˇ' },
            { offset: 2, zhuyin: 'ㄕㄨˇ' },
        ]),
        ...targetChar('count-shu3', ['數數', '數不清', '數得清', '細數'], '數', 'ㄕㄨˇ'),
        ...targetChar('number-shu4', ['數學', '數字', '數量', '次數', '人數', '少數', '多數'], '數', 'ㄕㄨˋ'),
        ...targetChar('line-hang2', ['一行人', '行列', '行業', '銀行', '排行'], '行', 'ㄏㄤˊ'),
        ...targetChar('walk-xing2', ['三人同行', '行走', '行動', '步行', '旅行', '可行', '實行'], '行', 'ㄒㄧㄥˊ'),
        ...targetChar('return-huan2', ['還給', '歸還', '償還', '返還', '還書', '還錢', '還來就菊花'], '還', 'ㄏㄨㄢˊ'),
        ...targetChar('still-hai2', ['還是', '還有', '還要', '還會', '還能', '還沒'], '還', 'ㄏㄞˊ'),
        ...targetChar('tiao2', ['調味', '調味料', '調侃', '調整', '調和', '協調'], '調', 'ㄊㄧㄠˊ'),
        ...targetChar('diao4', ['調查', '聲調', '曲調', '音調', '格調'], '調', 'ㄉㄧㄠˋ'),
        ...targetChar('ying4', ['反應', '回應', '應對', '答應', '應用', '適應', '呼應'], '應', 'ㄧㄥˋ'),
        ...targetChar('ying1', ['應該', '應當', '應有'], '應', 'ㄧㄥ'),
        ...targetChar('gan1', ['乾又熱', '乾冰', '餅乾', '乾燥', '曬乾', '烘乾', '乾淨', '乾杯', '乾脆', '乾枯'], '乾', 'ㄍㄢ'),
        ...targetChar('qian2', ['乾坤'], '乾', 'ㄑㄧㄢˊ'),
        ...targetChar('cha1', ['差別', '溫差', '不差', '絲毫不差', '差異', '相差', '落差', '誤差', '時差'], '差', 'ㄔㄚ'),
        ...targetChar('cha4', ['差勁'], '差', 'ㄔㄚˋ'),
        ...targetChar('chai1', ['出差', '差事', '差遣'], '差', 'ㄔㄞ'),
        ...targetChar('ci1', ['參差'], '差', 'ㄘ'),
        ...targetChar('field-chang2', ['場圃', '晒穀場', '曬穀場'], '場', 'ㄔㄤˊ'),
        ...targetChar('xing1', ['興建', '興奮', '興盛', '復興', '振興', '興起', '興辦', '興學'], '興', 'ㄒㄧㄥ'),
        ...targetChar('xing4', ['高興', '興趣', '助興', '掃興'], '興', 'ㄒㄧㄥˋ'),
        ...targetChar('mu2', ['模樣', '一模一樣'], '模', 'ㄇㄨˊ'),
        ...targetChar('mo2', ['模型', '模仿', '模擬', '模範'], '模', 'ㄇㄛˊ'),
        ...targetChar('tan2', ['彈電吉他', '彈吉他', '彈琴', '彈奏', '彈鋼琴'], '彈', 'ㄊㄢˊ'),
        ...targetChar('dan4', ['子彈', '彈珠', '彈簧', '炸彈'], '彈', 'ㄉㄢˋ'),
        ...targetChar('ji3', ['給予', '供給', '補給', '自給自足'], '給', 'ㄐㄧˇ'),
        ...targetChar('qie1', ['切成', '切開', '切菜', '切片', '切斷'], '切', 'ㄑㄧㄝ'),
        ...targetChar('qie4', ['一切', '親切', '急切', '密切'], '切', 'ㄑㄧㄝˋ'),
        ...targetChar('zhong1', ['生命中', '心中', '其中', '空中', '水中', '家中'], '中', 'ㄓㄨㄥ'),
        ...targetChar('zhong4-hit', ['中獎', '命中', '擊中', '中毒'], '中', 'ㄓㄨㄥˋ'),
        ...targetChar('jiao4', ['睡覺', '午覺', '一覺', '睡不著覺'], '覺', 'ㄐㄧㄠˋ'),
        ...targetChar('jue2', ['覺得', '感覺', '發覺', '自覺'], '覺', 'ㄐㄩㄝˊ'),
        ...targetChar('xing3-reflect', ['省思', '反省', '自省'], '省', 'ㄒㄧㄥˇ'),
        phraseRule('rooster-wo4', '喔喔啼', [
            { offset: 0, zhuyin: 'ㄨㄛˋ' },
            { offset: 1, zhuyin: 'ㄨㄛˋ' },
        ]),
        ...targetChar('taiwan-rest-xi2', ['休息'], '息', 'ㄒㄧˊ'),
    ].sort((a, b) => b.phrase.length - a.phrase.length);

    const normalizeZhuyin = value => {
        const text = String(value || '').trim();
        return text.endsWith('˙') ? `˙${text.slice(0, -1)}` : text;
    };

    const PINYIN_INITIALS = {
        b:'ㄅ', p:'ㄆ', m:'ㄇ', f:'ㄈ', d:'ㄉ', t:'ㄊ', n:'ㄋ', l:'ㄌ',
        g:'ㄍ', k:'ㄎ', h:'ㄏ', j:'ㄐ', q:'ㄑ', x:'ㄒ', zh:'ㄓ', ch:'ㄔ',
        sh:'ㄕ', r:'ㄖ', z:'ㄗ', c:'ㄘ', s:'ㄙ', '':'',
    };
    const PINYIN_FINALS = {
        a:'ㄚ', o:'ㄛ', e:'ㄜ', ai:'ㄞ', ei:'ㄟ', ao:'ㄠ', ou:'ㄡ',
        an:'ㄢ', en:'ㄣ', ang:'ㄤ', eng:'ㄥ', er:'ㄦ',
        i:'ㄧ', ia:'ㄧㄚ', ie:'ㄧㄝ', iao:'ㄧㄠ', iu:'ㄧㄡ', ian:'ㄧㄢ',
        in:'ㄧㄣ', iang:'ㄧㄤ', ing:'ㄧㄥ', iong:'ㄩㄥ',
        u:'ㄨ', ua:'ㄨㄚ', uo:'ㄨㄛ', uai:'ㄨㄞ', ui:'ㄨㄟ', uan:'ㄨㄢ',
        un:'ㄨㄣ', uang:'ㄨㄤ', ueng:'ㄨㄥ', ong:'ㄨㄥ',
        v:'ㄩ', ve:'ㄩㄝ', van:'ㄩㄢ', vn:'ㄩㄣ', '':'',
    };
    const PINYIN_TONES = { 0:'˙', 1:'', 2:'ˊ', 3:'ˇ', 4:'ˋ', 5:'˙' };
    const Y_FINALS = {
        yi:'i', ya:'ia', ye:'ie', yao:'iao', you:'iu', yan:'ian', yin:'in',
        yang:'iang', ying:'ing', yong:'iong', yu:'v', yue:'ve', yuan:'van', yun:'vn',
    };
    const W_FINALS = {
        wu:'u', wa:'ua', wo:'uo', wai:'uai', wei:'ui', wan:'uan', wen:'un',
        wang:'uang', weng:'ueng',
    };

    function pinyinSyllableToZhuyin(pyNum) {
        if (!pyNum) return '';
        const match = String(pyNum).match(/^([a-züv]+)([0-5])$/i);
        let base = match ? match[1].toLowerCase() : String(pyNum).toLowerCase();
        const tone = match ? Number(match[2]) : 1;
        base = base.replace(/ü/g, 'v');

        let initial = '';
        let final = base;
        if (Y_FINALS[base]) final = Y_FINALS[base];
        else if (W_FINALS[base]) final = W_FINALS[base];
        else {
            const doubleInitial = base.slice(0, 2);
            if (['zh', 'ch', 'sh'].includes(doubleInitial)) {
                initial = doubleInitial;
                final = base.slice(2);
            } else if (Object.prototype.hasOwnProperty.call(PINYIN_INITIALS, base.slice(0, 1))) {
                initial = base.slice(0, 1);
                final = base.slice(1);
            }
        }
        if (['j', 'q', 'x'].includes(initial) && final.startsWith('u')) final = `v${final.slice(1)}`;
        if (['zh', 'ch', 'sh', 'r', 'z', 'c', 's'].includes(initial) && final === 'i') final = '';

        const symbols = `${PINYIN_INITIALS[initial] ?? ''}${PINYIN_FINALS[final] ?? ''}`;
        if (!symbols) return '';
        const toneMark = PINYIN_TONES[tone] ?? '';
        return toneMark === '˙' ? `˙${symbols}` : `${symbols}${toneMark}`;
    }

    const toneOf = zhuyin => {
        const value = normalizeZhuyin(zhuyin);
        if (!value) return 0;
        if (value.startsWith('˙')) return 5;
        if (value.endsWith('ˊ')) return 2;
        if (value.endsWith('ˇ')) return 3;
        if (value.endsWith('ˋ')) return 4;
        return 1;
    };

    const isHanzi = char => /[\u3400-\u9fff]/.test(char || '');
    const contextAt = (text, index, radius = 8) => text
        .slice(Math.max(0, index - radius), Math.min(text.length, index + radius + 1))
        .replace(/\|/g, '')
        .replace(/\n/g, ' ');

    function apply(text, baseReadings) {
        const chars = Array.from(text || '');
        const sourceReadings = chars.map((_, index) => normalizeZhuyin(baseReadings?.[index] || ''));
        const readings = sourceReadings.slice();
        const decisions = new Map();
        const phraseMatched = new Set();

        const setReading = (index, zhuyin, rule, confidence = 'deterministic') => {
            if (index < 0 || index >= chars.length || !isHanzi(chars[index])) return;
            readings[index] = normalizeZhuyin(zhuyin);
            decisions.set(index, {
                index,
                char: chars[index],
                zhuyin: readings[index],
                rule,
                confidence,
                context: contextAt(text, index),
            });
        };

        chars.forEach((char, index) => {
            if (COMMON_DEFAULTS[char]) {
                setReading(index, COMMON_DEFAULTS[char], `default-${char}`, char === '誰' ? 'locked' : 'default');
            }
        });

        PHRASE_RULES.forEach(rule => {
            let start = 0;
            while (start <= text.length - rule.phrase.length) {
                const found = text.indexOf(rule.phrase, start);
                if (found < 0) break;
                rule.targets.forEach(target => {
                    const index = found + target.offset;
                    // Longer phrases are sorted first and carry more context.
                    // Do not let a shorter overlapping phrase overwrite them.
                    if (!phraseMatched.has(index)) {
                        setReading(index, target.zhuyin, rule.id);
                        phraseMatched.add(index);
                    }
                });
                start = found + Math.max(1, rule.phrase.length);
            }
        });

        // 量詞「個」在「一個、每個、這個、那個、哪個、幾個」等
        // 語境通常讀輕聲；「個人、個性、個子」沒有量詞前件時不套用。
        chars.forEach((char, index) => {
            if (char !== '個') return;
            if (isClassifierGeAt(chars, index)) {
                setReading(index, '˙ㄍㄜ', 'ge-classifier-neutral');
            }
        });

        const nextReadable = index => {
            for (let next = index + 1; next < chars.length; next++) {
                if (chars[next] === '|' || /\s/.test(chars[next])) continue;
                return isHanzi(chars[next]) ? next : -1;
            }
            return -1;
        };
        const numeralChars = new Set(Array.from('〇○零一二三四五六七八九十百千萬億兩两'));
        const isNumericOne = index => {
            const previous = chars[index - 1] || '';
            const next = chars[index + 1] || '';
            if (text.slice(Math.max(0, index - 2), index + 1) === '秋千一') return false;
            return previous === '第' || previous === '之' || previous === '萬'
                || numeralChars.has(previous) || numeralChars.has(next)
                || /[0-9]/.test(previous) || /[0-9]/.test(next);
        };

        chars.forEach((char, index) => {
            if (char === '不') {
                const next = nextReadable(index);
                const reading = next >= 0 && toneOf(readings[next]) === 4 ? 'ㄅㄨˊ' : 'ㄅㄨˋ';
                setReading(index, reading, next >= 0 && toneOf(readings[next]) === 4 ? 'bu-before-fourth' : 'bu-base');
            }
            if (char === '一') {
                if (isNumericOne(index)) {
                    setReading(index, 'ㄧ', 'yi-numeric-exception');
                    return;
                }
                const next = nextReadable(index);
                // 表面標成輕聲的量詞「個」仍以底層第四聲參與「一」的變調，
                // 因此「一個」保留 `ㄧˊ`，不會因輕聲標示而退回本調。
                const nextTone = next >= 0
                    ? (isClassifierGeAt(chars, next) ? 4 : toneOf(readings[next]))
                    : 0;
                if (nextTone === 4) setReading(index, 'ㄧˊ', 'yi-before-fourth');
                else if ([1, 2, 3].includes(nextTone)) setReading(index, 'ㄧˋ', 'yi-before-first-second-third');
                else setReading(index, 'ㄧ', 'yi-base');
            }
        });

        Object.entries(KINSHIP_REDUPLICATIONS).forEach(([term, zhuyin]) => {
            let start = 0;
            while (start <= text.length - term.length) {
                const found = text.indexOf(term, start);
                if (found < 0) break;
                setReading(found + 1, zhuyin, 'kinship-reduplication');
                phraseMatched.add(found + 1);
                start = found + term.length;
            }
        });

        const reviewItems = [];
        chars.forEach((char, index) => {
            if (!HIGH_RISK_CHARS.has(char)) return;
            const decision = decisions.get(index);
            const defaultConflictsWithContext = decision?.confidence === 'default'
                && ['著', '得', '子'].includes(char)
                && sourceReadings[index]
                && sourceReadings[index] !== COMMON_DEFAULTS[char];
            const missingReading = !readings[index];
            if (defaultConflictsWithContext || missingReading) {
                reviewItems.push({
                    index,
                    char,
                    zhuyin: readings[index],
                    context: contextAt(text, index),
                    reason: defaultConflictsWithContext
                        ? '教師預設讀音與整句候選不同，且未命中確定性詞語規則'
                        : '高風險多音字缺少可用的整句候選',
                });
            }
        });

        return {
            version: VERSION,
            readings,
            speechOverrides: expectedSpeechOverrides(text, readings),
            decisions: Array.from(decisions.values()).sort((a, b) => a.index - b.index),
            reviewItems,
        };
    }

    return {
        VERSION,
        COMMON_DEFAULTS,
        KINSHIP_REDUPLICATIONS,
        HIGH_RISK_CHARS,
        CLASSIFIER_PRECEDERS,
        JIN4_PHRASES,
        ZI3_PHRASES,
        MEN2_PHRASES,
        LI2_PHRASES,
        TTS_HOMOPHONES,
        PHRASE_RULES,
        expectedContextualReadings,
        expectedSpeechOverrides,
        speechHomophoneFor: (char, zhuyin) => TTS_HOMOPHONES[`${char}|${normalizeZhuyin(zhuyin)}`] || '',
        normalizeZhuyin,
        pinyinSyllableToZhuyin,
        toneOf,
        apply,
    };
});
