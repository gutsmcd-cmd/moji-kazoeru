import './base.css';
import './style.css';
import { h, langToggle, showSaveBanner, hideSaveBanner, confirmDialog } from './ui';
import { initDb, loadState, saveState } from './db';
import { dicts, type Lang, type Dict } from './i18n';
import { analyze } from './count';

interface State { lang: Lang; keepDraft: boolean; draft: string; excludePunct: boolean }

function fresh(): State {
  return { lang: 'ja', keepDraft: false, draft: '', excludePunct: false };
}

let state = fresh();
let text = '';
let t: Dict = dicts.ja;
const app = document.getElementById('app')!;
let saveTimer = 0;

function payload(): State {
  return {
    lang: state.lang,
    keepDraft: state.keepDraft,
    excludePunct: state.excludePunct,
    draft: state.keepDraft ? text : '',
  };
}

async function persist(): Promise<void> {
  const ok = await saveState(payload());
  if (ok) hideSaveBanner();
  else showSaveBanner();
}
function persistSoon() {
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => { void persist(); }, 300);
}

function num(n: number): string {
  return n.toLocaleString(state.lang === 'ja' ? 'ja-JP' : 'en-US');
}
function pages(n: number): string {
  return n.toLocaleString(state.lang === 'ja' ? 'ja-JP' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function stat(label: string, value: string, wide = false, extra?: string) {
  return h('div', { class: 'stat' + (wide ? ' wide' : '') },
    h('span', {}, label),
    h('b', {}, value),
    extra ? h('em', {}, extra) : null,
  );
}

function fill(root: HTMLElement) {
  const c = analyze(text);
  const pct = c.kanjiRatio === null ? '—' : `${(c.kanjiRatio * 100).toLocaleString(state.lang === 'ja' ? 'ja-JP' : 'en-US', { maximumFractionDigits: 1 })}%`;
  const sentence = c.avgSentence === null
    ? t.noSentence
    : `${c.avgSentence.toLocaleString(state.lang === 'ja' ? 'ja-JP' : 'en-US', { maximumFractionDigits: 1 })} ${t.chars}`;
  const nodes: Node[] = [
    stat(t.all, num(c.all)),
    stat(t.noSpace, num(c.noSpace)),
  ];
  if (state.excludePunct) nodes.push(stat(t.noPunct, num(c.noPunct), true));
  nodes.push(
    stat(t.pages, `${pages(c.pagesExact)} ${t.unitPage}`, true, t.pagesCeil(c.pagesCeil)),
    stat(t.paragraphs, num(c.paragraphs)),
    stat(t.lines, num(c.lines)),
    stat(t.sentence, sentence, true),
    stat(t.kanji, pct, true),
  );
  root.replaceChildren(...nodes);
}

function render() {
  t = dicts[state.lang];
  const stats = h('div', { class: 'stats' });
  const ta = h('textarea', { class: 'writer', placeholder: t.placeholder, 'aria-label': t.placeholder });
  ta.value = text;
  ta.addEventListener('input', () => {
    text = ta.value;
    fill(stats);
    if (state.keepDraft) persistSoon();
  });
  const punct = h('button', { class: 'toggle', type: 'button', 'aria-pressed': String(state.excludePunct) }, state.excludePunct ? t.on : t.off);
  punct.addEventListener('click', () => {
    state.excludePunct = !state.excludePunct;
    punct.setAttribute('aria-pressed', String(state.excludePunct));
    punct.textContent = state.excludePunct ? t.on : t.off;
    fill(stats);
    void persist();
  });
  const keep = h('button', { class: 'toggle', type: 'button', 'aria-pressed': String(state.keepDraft) }, state.keepDraft ? t.on : t.off);
  keep.addEventListener('click', () => {
    state.keepDraft = !state.keepDraft;
    keep.setAttribute('aria-pressed', String(state.keepDraft));
    keep.textContent = state.keepDraft ? t.on : t.off;
    void persist();
  });
  fill(stats);
  app.replaceChildren(
    h('header', { class: 'topbar' },
      h('h1', {}, t.app),
      langToggle(state.lang, (l) => {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        state.lang = l;
        document.documentElement.lang = l;
        document.title = dicts[l].app;
        void persist();
        render();
        const next = document.querySelector('textarea');
        if (next) {
          next.focus();
          next.setSelectionRange(start, end);
        }
      }),
    ),
    h('main', {},
      ta,
      stats,
      h('p', { class: 'note muted small' }, t.pagesNote),
      h('p', { class: 'note muted small' }, t.sentenceNote),
      h('p', { class: 'note muted small' }, t.kanjiNote),
      h('div', { class: 'card' },
        h('div', { class: 'switch' },
          h('span', {}, t.punctToggle),
          punct,
        ),
        h('div', { class: 'switch' },
          h('span', {}, t.keep),
          keep,
        ),
        h('p', { class: 'note muted small' }, t.keepNote),
        h('button', {
          class: 'btn danger block',
          type: 'button',
          onclick: async () => {
            if (!text) return;
            const ok = await confirmDialog(t.clear, t.clearAsk, t.clear, t.cancel, true);
            if (!ok) return;
            text = '';
            ta.value = '';
            fill(stats);
            void persist();
          },
        }, t.clear),
      ),
      h('p', { class: 'foot' }, t.privacy),
    ),
  );
}

async function boot() {
  const ok = await initDb('moji-kazoeru');
  if (!ok) showSaveBanner();
  const loaded = await loadState(fresh());
  state = {
    lang: loaded.lang === 'en' ? 'en' : 'ja',
    keepDraft: !!loaded.keepDraft,
    excludePunct: !!loaded.excludePunct,
    draft: typeof loaded.draft === 'string' ? loaded.draft : '',
  };
  text = state.keepDraft ? state.draft : '';
  t = dicts[state.lang];
  document.documentElement.lang = state.lang;
  document.title = t.app;
  render();
  window.addEventListener('pagehide', () => { void persist(); });
}
void boot();
