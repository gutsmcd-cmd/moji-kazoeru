export interface Counts {
  all: number;
  noSpace: number;
  noPunct: number;
  pageBasis: number;
  pagesExact: number;
  pagesCeil: number;
  paragraphs: number;
  lines: number;
  sentenceCount: number;
  avgSentence: number | null;
  kanji: number;
  kanjiBase: number;
  kanjiRatio: number | null;
}

const HAN = /\p{Script=Han}/u;
const PUNCT = /\p{P}/u;

/** Plain counts. Not a style score. */
export function analyze(text: string): Counts {
  const chars = [...text];
  const all = chars.length;
  const noSpace = chars.filter((c) => !/\s/u.test(c)).length;
  const noPunct = chars.filter((c) => !PUNCT.test(c)).length;
  const pageBasis = [...text.replace(/\r?\n/g, '')].length;
  const lines = text.length === 0 ? 0 : text.split('\n').length;
  const paragraphs = text.trim()
    ? text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean).length
    : 0;
  const sentences = text.match(/[^。！？!?]+[。！？!?]+/g) ?? [];
  const sentenceCount = sentences.length;
  let avgSentence: number | null = null;
  if (sentenceCount) {
    const sum = sentences.reduce((acc, s) => acc + [...s.replace(/[。！？!?]+$/u, '')].length, 0);
    avgSentence = sum / sentenceCount;
  }
  const kanji = chars.filter((c) => HAN.test(c)).length;
  return {
    all,
    noSpace,
    noPunct,
    pageBasis,
    pagesExact: pageBasis / 400,
    pagesCeil: pageBasis === 0 ? 0 : Math.ceil(pageBasis / 400),
    paragraphs,
    lines,
    sentenceCount,
    avgSentence,
    kanji,
    kanjiBase: noSpace,
    kanjiRatio: noSpace ? kanji / noSpace : null,
  };
}
