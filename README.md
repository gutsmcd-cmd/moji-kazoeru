# 文字数はかる（Moji Kazoeru）

日本語の文章の文字数を数える PWA。**無料・広告なし・ログイン不要・オフライン対応。アップロードしません。**

## できること

- 文字数（空白・改行を含む / 含まない）
- 句読点を除く数（必要なときだけオン）
- 原稿用紙: 改行を除いた文字数 ÷ 400。切り上げ枚数も表示
- 段落、行、文の長さの目安（。！？で分割）、漢字の割合

読みやすさの点数や文章の良し悪しは出しません。下書きの保存は初期オフです。オンにしたときだけ本文を IndexedDB に残します。

## English

**Moji Kazoeru** counts Japanese (and other) writing as you type or paste: characters with and without spaces and line breaks, an optional count without punctuation, manuscript pages (400 characters = 1 page, line breaks excluded), paragraphs, lines, a plain average sentence length split on 。！？, and kanji share. It is not a style grade. Text stays in the page unless you turn on “keep a draft” (off by default); that draft is IndexedDB on this device only. Nothing is uploaded. Free, no ads, no login, offline.

## 開発 / Development

```bash
npm install
npm run dev
npm run build
```

Vite + vanilla TypeScript + vite-plugin-pwa（`registerType: 'autoUpdate'`, `base: './'`）。
