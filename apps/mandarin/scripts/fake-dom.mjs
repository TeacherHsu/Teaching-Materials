// 極簡 DOM stub，只實作 src/utils/dom.js 的 h()/clear() 以及元件實際用到的
// 少數 API，讓 activities/*.js 可以在純 Node（無 jsdom）下被測試。
// 無新依賴：純手寫最小子集，夠用就好，不求完整。

class FakeElement {
  constructor(tag) {
    this.tagName = tag;
    this.attrs = {};
    this.className = '';
    this.children = [];
    this.parentNode = null;
    this._listeners = {};
    this.disabled = false;
    this._text = '';
    this._html = '';
    this.style = {};
    this.dataset = {};
    const self = this;
    this.classList = {
      add(...names) {
        const set = new Set(self.className.split(/\s+/).filter(Boolean));
        names.forEach((n) => set.add(n));
        self.className = [...set].join(' ');
      },
      remove(...names) {
        const set = new Set(self.className.split(/\s+/).filter(Boolean));
        names.forEach((n) => set.delete(n));
        self.className = [...set].join(' ');
      },
    };
  }

  setAttribute(key, value) {
    this.attrs[key] = String(value);
  }

  getAttribute(key) {
    return this.attrs[key] ?? null;
  }

  addEventListener(type, fn) {
    (this._listeners[type] = this._listeners[type] || []).push(fn);
  }

  dispatch(type) {
    (this._listeners[type] || []).forEach((fn) => fn({ target: this }));
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    this.children = this.children.filter((c) => c !== child);
    child.parentNode = null;
  }

  get firstChild() {
    return this.children[0] || null;
  }

  set innerHTML(value) {
    this._html = value;
    this.children = [];
  }

  get innerHTML() {
    return this._html;
  }

  set textContent(value) {
    this._text = value;
    this.children = [];
  }

  get textContent() {
    if (this.children.length) {
      return this.children.map((c) => (c instanceof TextNode ? c.data : c.textContent)).join('');
    }
    return this._text;
  }

  /** 遞迴找第一個符合 predicate 的節點（包含自己）。 */
  find(predicate) {
    if (predicate(this)) return this;
    for (const child of this.children) {
      if (child instanceof FakeElement) {
        const hit = child.find(predicate);
        if (hit) return hit;
      }
    }
    return null;
  }

  /** 遞迴找所有符合 predicate 的節點。 */
  findAll(predicate) {
    const out = [];
    const walk = (node) => {
      if (predicate(node)) out.push(node);
      for (const child of node.children) {
        if (child instanceof FakeElement) walk(child);
      }
    };
    walk(this);
    return out;
  }

  hasClass(name) {
    return this.className.split(/\s+/).includes(name);
  }
}

class TextNode {
  constructor(data) {
    this.data = data;
  }

  get textContent() {
    return this.data;
  }
}

/**
 * 極簡 speechSynthesis stub，供 src/utils/speech.js 與各元件的 node 測試使用。
 * @param {Array<{lang?:string, name?:string}>} [voices] 假的可用聲音清單
 */
export function installFakeSpeechSynthesis(voices = []) {
  const listeners = { voiceschanged: [] };
  const synth = {
    speaking: false,
    getVoices: () => voices,
    speak(utterance) {
      this.speaking = true;
      // 立即同步觸發 onend，模擬瀏覽器唸完（測試不需要真的等待）。
      if (typeof utterance.onend === 'function') utterance.onend();
      this.speaking = false;
    },
    cancel() {
      this.speaking = false;
    },
    addEventListener(type, fn) {
      (listeners[type] = listeners[type] || []).push(fn);
    },
    removeEventListener(type, fn) {
      if (listeners[type]) listeners[type] = listeners[type].filter((f) => f !== fn);
    },
  };
  globalThis.window.speechSynthesis = synth;
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
      this.lang = '';
      this.rate = 1;
      this.voice = null;
      this.onend = null;
      this.onerror = null;
    }
  };
  return synth;
}

export function installFakeDom() {
  globalThis.document = {
    createElement: (tag) => new FakeElement(tag),
    createTextNode: (data) => new TextNode(data),
  };
  globalThis.window = {
    location: { search: '' },
    localStorage: (() => {
      const store = new Map();
      return {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
      };
    })(),
    sessionStorage: (() => {
      const store = new Map();
      return {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
      };
    })(),
  };
}

export { FakeElement, TextNode };
