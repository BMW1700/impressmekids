/**
 * Castle Swarm — StoryRunner
 *
 * Pure module — no React, no DOM. Feeds the arena word-by-word from real,
 * sentence-preserving stories pulled from the castle story bank.
 *
 * Replaces the legacy "dedupe everything into a word soup" approach so the
 * player actually reads coherent narrative content while defending the keep.
 */

import {
  CastleStory,
  CastleGradeBand,
  pickStoriesForContext,
} from "@/data/castleSwarmStories";

interface PreparedSentence {
  /** Display-ready sentence with original punctuation/capitalization. */
  display: string;
  /** Lowercased, punctuation-stripped tokens used by the speech matcher. */
  tokens: string[];
  /** Story index this sentence belongs to (within the runner's story list). */
  storyIndex: number;
}

export interface StoryBatch {
  /** Lowercased words for the speech reader. */
  words: string[];
  /** The current sentence (display form) the batch sits inside. */
  sentence: string;
  sentenceIndex: number;
  totalSentences: number;
  storyTitle: string;
}

const SENTENCE_SPLIT = /(?<=[.!?])\s+(?=[A-Z"'])/g;
const WORD_TOKEN = /[a-z']+/g;

function prepareStories(stories: CastleStory[]): PreparedSentence[] {
  const out: PreparedSentence[] = [];
  stories.forEach((story, storyIndex) => {
    const text = story.paragraphs.join(" ").replace(/\s+/g, " ").trim();
    const sentences = text.split(SENTENCE_SPLIT).map(s => s.trim()).filter(Boolean);
    for (const display of sentences) {
      const tokens = (display.toLowerCase().match(WORD_TOKEN) || [])
        .filter(t => t.length >= 1 && t.length <= 14);
      if (tokens.length === 0) continue;
      out.push({ display, tokens, storyIndex });
    }
  });
  return out;
}

export class StoryRunner {
  private readonly stories: CastleStory[];
  private readonly sentences: PreparedSentence[];
  /** Flat word stream with back-pointers to sentence index. */
  private readonly stream: { word: string; sentenceIdx: number }[];
  /** Position in the flat stream. */
  private cursor = 0;

  constructor(opts: {
    gradeBand: CastleGradeBand;
    levelId?: string;
    arcId?: string;
    /** When provided, bypasses the built-in story bank and runs on this raw text. */
    overrideText?: string;
    /** Display title for the override (shown in HUD). */
    overrideTitle?: string;
  }) {
    if (opts.overrideText && opts.overrideText.trim().length > 0) {
      this.stories = [{
        id: "custom",
        title: opts.overrideTitle ?? "My Story",
        gradeBand: opts.gradeBand,
        paragraphs: [opts.overrideText],
        arcId: undefined as unknown as string,
      } as unknown as CastleStory];
    } else {
      this.stories = pickStoriesForContext(opts);
    }
    this.sentences = prepareStories(this.stories);
    this.stream = [];
    this.sentences.forEach((sent, sentenceIdx) => {
      for (const w of sent.tokens) this.stream.push({ word: w, sentenceIdx });
    });
    if (this.stream.length === 0) {
      // Safety fallback — should never trigger because story bank is non-empty.
      this.stream.push({ word: "read", sentenceIdx: 0 });
      this.sentences.push({ display: "Read on, brave reader.", tokens: ["read"], storyIndex: 0 });
    }
  }

  /** Returns the next N words plus the sentence/page context for the HUD. */
  nextBatch(size: number): StoryBatch {
    const words: string[] = [];
    const startSentenceIdx = this.stream[this.cursor % this.stream.length].sentenceIdx;
    for (let i = 0; i < size; i++) {
      const entry = this.stream[(this.cursor + i) % this.stream.length];
      words.push(entry.word);
    }
    this.cursor = (this.cursor + size) % this.stream.length;

    const sentence = this.sentences[startSentenceIdx];
    const storyTitle = this.stories[sentence.storyIndex]?.title ?? "";
    return {
      words,
      sentence: sentence.display,
      sentenceIndex: startSentenceIdx + 1,
      totalSentences: this.sentences.length,
      storyTitle,
    };
  }

  /** Flat pool of unique words from the loaded story — used by spell-break chant. */
  uniqueWordPool(): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const { word } of this.stream) {
      if (!seen.has(word) && word.length >= 2 && word.length <= 10) {
        seen.add(word);
        out.push(word);
      }
    }
    return out;
  }

  /** Pick a real sentence from the story (used as a boss chant in later phases). */
  pickStorySentence(rng: () => number): string {
    if (!this.sentences.length) return "";
    const idx = Math.floor(rng() * this.sentences.length);
    return this.sentences[idx].display;
  }

  /** Diagnostic — total sentences loaded. */
  get totalSentences(): number {
    return this.sentences.length;
  }
}
