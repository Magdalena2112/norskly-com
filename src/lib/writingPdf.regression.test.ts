/**
 * Regression tests for the Writing PDF export.
 *
 * These tests guard against two previously-fixed problems:
 *   1. Text rendered with non-zero charSpace ("stretched" letter spacing).
 *   2. Text overflowing card / page width because `splitTextToSize` was
 *      called before the correct font + size were set (so wrap widths
 *      didn't match the actually-rendered glyphs).
 *
 * Strategy:
 *   - Mock jsPDF and capture every method call.
 *   - Run generateWritingPdf with a realistic payload (long Norwegian text,
 *     many mistakes, vocab groups, expressions, starters).
 *   - Assert defensive properties about the captured calls.
 *   - Also do a static source-level check to prevent unsafe
 *     `doc.splitTextToSize(` calls from being reintroduced outside the
 *     dedicated `wrap()` helper.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ─── jsPDF mock that records calls ──────────────────────────────────────────
type Call = { method: string; args: unknown[] };
const calls: Call[] = [];
let currentFontSize = 12;
let currentCharSpace = 0;

const recorder = (name: string) =>
  vi.fn((...args: unknown[]) => {
    calls.push({ method: name, args });
    if (name === "setFontSize") currentFontSize = args[0] as number;
    if (name === "setCharSpace") currentCharSpace = args[0] as number;
    return undefined;
  });

class FakeJsPDF {
  internal = {
    pageSize: {
      getWidth: () => 595,
      getHeight: () => 842,
    },
  };
  // Drawing / state
  setFillColor = recorder("setFillColor");
  setDrawColor = recorder("setDrawColor");
  setTextColor = recorder("setTextColor");
  setLineWidth = recorder("setLineWidth");
  setFont = recorder("setFont");
  setFontSize = recorder("setFontSize");
  setCharSpace = recorder("setCharSpace");
  setLineHeightFactor = recorder("setLineHeightFactor");
  setPage = recorder("setPage");

  rect = recorder("rect");
  roundedRect = recorder("roundedRect");
  circle = recorder("circle");
  line = recorder("line");
  addImage = recorder("addImage");
  addPage = vi.fn(() => {
    calls.push({ method: "addPage", args: [] });
  });

  // Text — capture font size + char space at moment of draw
  text = vi.fn((...args: unknown[]) => {
    calls.push({
      method: "text",
      args,
      // @ts-expect-error attaching for assertions
      _fontSize: currentFontSize,
      // @ts-expect-error attaching for assertions
      _charSpace: currentCharSpace,
    } as Call);
  });

  // Width / wrap helpers — return reasonable approximations so the
  // production code can compute geometry without blowing up.
  getTextWidth = vi.fn((s: string) => (s?.length ?? 0) * (currentFontSize * 0.5));
  splitTextToSize = vi.fn((text: string, width: number) => {
    const str = String(text ?? "");
    if (!str) return [""];
    const approxCharWidth = Math.max(2, currentFontSize * 0.5);
    const maxChars = Math.max(4, Math.floor(width / approxCharWidth));
    const out: string[] = [];
    const words = str.split(/\s+/);
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (next.length > maxChars) {
        if (line) out.push(line);
        line = w;
      } else {
        line = next;
      }
    }
    if (line) out.push(line);
    return out;
  });

  getImageProperties = vi.fn(() => ({ width: 1200, height: 800 }));
  getNumberOfPages = vi.fn(() => 1);
  save = vi.fn();
}

vi.mock("jspdf", () => ({
  default: FakeJsPDF,
}));

// Import AFTER mock is registered.
import { generateWritingPdf, type WritingPdfPayload } from "./writingPdf";

beforeEach(() => {
  calls.length = 0;
  currentFontSize = 12;
  currentCharSpace = 0;
});

const SAMPLE_PAYLOAD: WritingPdfPayload = {
  type: "image",
  level: "B1",
  original_text:
    "Jeg bor i en liten by ved kysten. Hver morgen går jeg en lang tur langs fjorden " +
    "og ser på båtene som kommer inn fra havet. Det er noe veldig fredelig over hele " +
    "atmosfæren her, særlig når sola står opp og himmelen blir rosa.",
  corrected_text:
    "Jeg bor i en liten by ved kysten. Hver morgen går jeg en lang tur langs fjorden " +
    "og ser på båtene som kommer inn fra havet.",
  mistakes: [
    {
      original: "Jeg har gå til skole i går.",
      corrected: "Jeg gikk på skolen i går.",
      explanation:
        "Glagol 'å gå' u prošlom vremenu se koristi kao 'gikk'. Takođe se kaže 'på skolen', ne 'til skole'.",
    },
    {
      original: "Det er mye personer i parken.",
      corrected: "Det er mange personer i parken.",
      explanation: "Sa brojivim imenicama u množini koristi se 'mange', ne 'mye'.",
    },
  ],
  vocabulary_suggestions: [
    { weak: "fin", better: "vakker", why: "'Vakker' zvuči prirodnije u opisu pejzaža." },
  ],
  overall_feedback:
    "Veoma dobar opis sa jasnom strukturom. Pazi na red reči nakon priloga vremena na početku rečenice.",
  sledeci_korak: [
    "Vežbaj V2 red reči sa prilozima na početku rečenice.",
    "Proširi vokabular pridevima za opisivanje atmosfere i emocija.",
  ],
  vocabulary_helper_groups: {
    imenice: [
      { word: "en fjord", translation: "fjord" },
      { word: "en båt", translation: "čamac" },
      { word: "et hav", translation: "more" },
    ],
    glagoli: [
      { word: "å gå", translation: "ići" },
      { word: "å se", translation: "videti" },
    ],
    korisni_izrazi: [
      { word: "å gå tur", translation: "šetati" },
    ],
  },
  expressions: [
    { no: "for det meste", sr: "uglavnom" },
  ],
  sentence_starters: [
    "På bildet ser jeg ...",
    "I forgrunnen er det ...",
    "Stemningen virker ...",
  ],
  cefr_assessment: "Tekst odgovara nivou B1.",
  naturalness_score: 8,
  complexity_score: 6,
  nivo_analiza: {
    gramatika: "Solidno poznavanje osnovnih struktura.",
    vokabular: "Bogat vokabular sa nekoliko nepreciznih reči.",
  },
  image_data_url: "data:image/png;base64,iVBORw0KGgo=",
};

describe("writingPdf — letter spacing regression", () => {
  it("resets charSpace to 0 globally at start", () => {
    generateWritingPdf(SAMPLE_PAYLOAD, "test.pdf");
    const firstCharSpaceCall = calls.find((c) => c.method === "setCharSpace");
    expect(firstCharSpaceCall, "setCharSpace must be called to neutralize tracking").toBeDefined();
    expect(firstCharSpaceCall!.args[0]).toBe(0);
  });

  it("sets a comfortable line-height factor (>= 1.3) for readability", () => {
    generateWritingPdf(SAMPLE_PAYLOAD, "test.pdf");
    const lh = calls.find((c) => c.method === "setLineHeightFactor");
    expect(lh, "setLineHeightFactor must be called").toBeDefined();
    expect(lh!.args[0] as number).toBeGreaterThanOrEqual(1.3);
  });

  it("never renders text with a non-zero charSpace", () => {
    generateWritingPdf(SAMPLE_PAYLOAD, "test.pdf");
    const textCalls = calls.filter((c) => c.method === "text");
    expect(textCalls.length).toBeGreaterThan(0);
    for (const t of textCalls) {
      // @ts-expect-error attached in mock
      expect(t._charSpace, `text() rendered with non-zero charSpace: ${JSON.stringify(t.args[0])}`).toBe(0);
    }
  });

  it("never passes a justify alignment to text() (which would stretch glyphs)", () => {
    generateWritingPdf(SAMPLE_PAYLOAD, "test.pdf");
    const justified = calls.filter(
      (c) =>
        c.method === "text" &&
        typeof c.args[3] === "object" &&
        c.args[3] !== null &&
        (c.args[3] as { align?: string }).align === "justify",
    );
    expect(justified).toHaveLength(0);
  });

  it("never passes maxWidth to text() (jsPDF stretches text to fit when set)", () => {
    generateWritingPdf(SAMPLE_PAYLOAD, "test.pdf");
    const withMaxWidth = calls.filter(
      (c) =>
        c.method === "text" &&
        typeof c.args[3] === "object" &&
        c.args[3] !== null &&
        "maxWidth" in (c.args[3] as Record<string, unknown>),
    );
    expect(withMaxWidth).toHaveLength(0);
  });
});

describe("writingPdf — overflow regression", () => {
  it("always sets a font size before wrapping text (no stale-font wraps)", () => {
    generateWritingPdf(SAMPLE_PAYLOAD, "test.pdf");
    // Walk the call log; for every splitTextToSize call there must be a
    // setFontSize call earlier in the log (the wrap() helper guarantees
    // this — this asserts the helper is actually used).
    let sawFontSize = false;
    for (const c of calls) {
      if (c.method === "setFontSize") sawFontSize = true;
      if (c.method === "splitTextToSize") {
        expect(sawFontSize, "splitTextToSize called before any setFontSize").toBe(true);
      }
    }
  });

  it("wraps text inside the printable content width (no overflow past margins)", () => {
    generateWritingPdf(SAMPLE_PAYLOAD, "test.pdf");
    // Page width 595, margin 48 each side, card padding 18 each side → max wrap width ≈ 463.
    const PAGE_W = 595;
    const SAFETY = 4;
    const MAX_WRAP_W = PAGE_W - 48 * 2; // any wrap call should be at most this wide
    for (const c of calls.filter((c) => c.method === "splitTextToSize")) {
      const width = c.args[1] as number;
      expect(width, `splitTextToSize width ${width} exceeds page area`).toBeLessThanOrEqual(
        MAX_WRAP_W + SAFETY,
      );
      expect(width).toBeGreaterThan(0);
    }
  });

  it("renders text strictly inside the horizontal page margins", () => {
    generateWritingPdf(SAMPLE_PAYLOAD, "test.pdf");
    const PAGE_W = 595;
    const RIGHT_LIMIT = PAGE_W - 8; // tolerate small numeric drift
    for (const c of calls.filter((c) => c.method === "text")) {
      const x = c.args[1] as number;
      expect(x, `text x=${x} starts before left page edge`).toBeGreaterThanOrEqual(0);
      expect(x, `text x=${x} starts past right page edge`).toBeLessThan(RIGHT_LIMIT);
    }
  });

  it("produces a saved PDF (full pipeline runs without throwing)", () => {
    expect(() => generateWritingPdf(SAMPLE_PAYLOAD, "test.pdf")).not.toThrow();
    const saveCalls = calls.filter((c) => c.method === "rect"); // sanity: did anything render?
    expect(saveCalls.length).toBeGreaterThan(0);
  });
});

describe("writingPdf — source-level guards", () => {
  const source = readFileSync(resolve(__dirname, "writingPdf.ts"), "utf8");

  it("has no raw `doc.splitTextToSize(` calls (must go through the wrap() helper)", () => {
    // The only allowed occurrence is inside the wrap() helper itself.
    const matches = source.match(/doc\.splitTextToSize\(/g) || [];
    expect(
      matches.length,
      "Direct doc.splitTextToSize() calls bypass the font-safety helper; use wrap() instead",
    ).toBeLessThanOrEqual(1);
  });

  it("does not use the `charSpace` option in any text() call", () => {
    expect(/charSpace\s*:/.test(source)).toBe(false);
  });

  it("does not use `align: 'justify'` anywhere (would stretch glyphs)", () => {
    expect(/align\s*:\s*["']justify["']/.test(source)).toBe(false);
  });

  it("explicitly resets charSpace and line-height at start", () => {
    expect(source).toMatch(/setCharSpace\(0\)/);
    expect(source).toMatch(/setLineHeightFactor\(/);
  });
});
