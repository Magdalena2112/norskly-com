import jsPDF from "jspdf";

export interface WritingPdfPayload {
  type: "image" | "text";
  level?: string;
  original_text: string;
  corrected_text?: string;
  mistakes?: { original: string; corrected: string; explanation: string }[];
  vocabulary_suggestions?: { weak: string; better: string; why: string }[];
  overall_feedback?: string;
  sledeci_korak?: string[];
  vocabulary_helper?: { word: string; translation: string; type?: string }[];
  vocabulary_helper_groups?: Record<string, { word: string; translation: string }[]>;
  expressions?: { no: string; sr: string }[];
  sentence_starters?: string[];
  cefr_assessment?: string;
  naturalness_score?: number;
  complexity_score?: number;
  nivo_analiza?: Record<string, string>;
  image_data_url?: string;
}

// ─── Palette (Norskly editorial) ───
const PRIMARY: [number, number, number] = [86, 28, 47];      // burgundy
const PRIMARY_SOFT: [number, number, number] = [140, 80, 95];
const MUTED: [number, number, number] = [120, 100, 105];
const ACCENT: [number, number, number] = [220, 180, 170];
const CREAM: [number, number, number] = [252, 246, 235];
const PAPER: [number, number, number] = [250, 244, 234];
const CARD_BG: [number, number, number] = [255, 251, 244];
const CARD_BORDER: [number, number, number] = [232, 218, 210];
const SOFT: [number, number, number] = [245, 232, 225];
const SUCCESS: [number, number, number] = [60, 110, 80];
const SUCCESS_SOFT: [number, number, number] = [228, 240, 230];
const DANGER: [number, number, number] = [170, 70, 70];
const DANGER_SOFT: [number, number, number] = [248, 230, 230];
const INK: [number, number, number] = [40, 25, 30];

const GROUP_LABELS: Record<string, string> = {
  imenice: "Imenice",
  glagoli: "Glagoli",
  pridevi: "Pridevi",
  mesta_objekti: "Mesta i objekti",
  ljudi_radnje: "Ljudi i radnje",
  korisni_izrazi: "Korisni izrazi",
};
const GROUP_ORDER = ["imenice", "glagoli", "pridevi", "mesta_objekti", "ljudi_radnje", "korisni_izrazi"];

const NIVO_LABELS: Record<string, string> = {
  gramatika: "Gramatika",
  vokabular: "Vokabular",
  red_reci: "Red reči",
  prirodnost: "Prirodnost",
  pravopis: "Pravopis",
  kohezija: "Kohezija",
};

export function generateWritingPdf(payload: WritingPdfPayload, filename = "norskly-pisanje.pdf") {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  const HEADER_H = 92;
  const FOOTER_H = 36;
  const topY = HEADER_H + 26;
  let y = topY;

  // Reset any tracking/letter-spacing globally — jsPDF can carry over charSpace which causes
  // text to appear stretched. Keep at 0 for all paragraph rendering.
  doc.setCharSpace(0);
  doc.setLineHeightFactor(1.35);

  // Safe wrapper around splitTextToSize that ALWAYS sets the font/size first
  // so the wrapping width matches the actually-rendered glyph widths.
  const wrap = (
    text: string,
    width: number,
    size: number,
    style: "normal" | "bold" | "italic" | "bolditalic" = "normal",
  ): string[] => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setCharSpace(0);
    // Trim slightly so we never butt right against the card edge
    const safeW = Math.max(20, width - 2);
    return doc.splitTextToSize(text || "", safeW) as string[];
  };

  // ─── Page background (cream paper) ───
  const paintBackground = () => {
    doc.setFillColor(...PAPER);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
  };

  // ─── Header band ───
  const paintHeader = () => {
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, pageWidth, HEADER_H, "F");
    // wordmark
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...CREAM);
    doc.text("Norskly", margin, 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...ACCENT);
    doc.text("Pisanje · Feedback rapport", margin, 54);

    // meta on the right
    const dateStr = new Date().toLocaleDateString("sr-Latn-RS", { day: "2-digit", month: "long", year: "numeric" });
    const typeStr = payload.type === "image" ? "Bildebeskrivelse" : "Korekcija teksta";
    const metaRight = pageWidth - margin;

    doc.setTextColor(...CREAM);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(typeStr, metaRight, 38, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...ACCENT);
    doc.text(dateStr, metaRight, 52, { align: "right" });

    if (payload.level) {
      // pill background
      const pillText = `Nivo ${payload.level}`;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const tw = doc.getTextWidth(pillText) + 14;
      doc.setFillColor(...CREAM);
      doc.roundedRect(metaRight - tw, 60, tw, 16, 8, 8, "F");
      doc.setTextColor(...PRIMARY);
      doc.text(pillText, metaRight - tw / 2, 71, { align: "center" });
    }
  };

  // ─── Footer ───
  const paintFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(...CARD_BORDER);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - FOOTER_H + 8, pageWidth - margin, pageHeight - FOOTER_H + 8);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Norskly · norskly.com", margin, pageHeight - 14);
    doc.text(`${pageNum} / ${totalPages}`, pageWidth - margin, pageHeight - 14, { align: "right" });
  };

  paintBackground();
  paintHeader();

  const newPage = () => {
    doc.addPage();
    paintBackground();
    paintHeader();
    y = topY;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - FOOTER_H - 10) newPage();
  };

  // ─── Card primitive ───
  const drawCardFrame = (height: number) => {
    doc.setFillColor(...CARD_BG);
    doc.setDrawColor(...CARD_BORDER);
    doc.setLineWidth(0.6);
    doc.roundedRect(margin, y, contentWidth, height, 10, 10, "FD");
  };

  // Measure helpers (don't mutate y)
  const measureWrapped = (text: string, width: number, fontSize: number, lineHeight: number) => {
    const lines = wrap(text, width, fontSize);
    return { lines, height: lines.length * lineHeight };
  };

  // Open a card: returns cursor (cx, cy) inside the card after the title
  const openCard = (title: string, accent: [number, number, number] = PRIMARY) => {
    return { title, accent };
  };

  // Renders a card: handles measuring height, page break, framing, title, then runs `body(innerWidth)` returning content height
  type CardBody = (innerWidth: number) => number; // returns content height when rendered
  const renderCard = (
    title: string,
    measure: (innerWidth: number) => number,
    body: CardBody,
    accent: [number, number, number] = PRIMARY,
  ) => {
    const innerPadX = 18;
    const innerPadTop = 16;
    const innerPadBottom = 18;
    const titleBlock = title ? 26 : 0;
    const innerWidth = contentWidth - innerPadX * 2;
    const contentH = measure(innerWidth);
    const totalH = innerPadTop + titleBlock + contentH + innerPadBottom;

    // If too tall for any page, allow overflow — fallback: split is hard, so we just place and let body overflow safely
    ensureSpace(totalH);
    drawCardFrame(totalH);

    let cy = y + innerPadTop;
    if (title) {
      // small accent square + title
      doc.setFillColor(...accent);
      doc.roundedRect(margin + innerPadX, cy - 2, 4, 14, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...accent);
      doc.text(title.toUpperCase(), margin + innerPadX + 12, cy + 9);
      cy += titleBlock;
    }

    // Translate body coordinate: temporarily set y to cy for nested writes
    const prevY = y;
    y = cy;
    body(innerWidth);
    // After body, jump y to bottom of card
    y = prevY + totalH + 12;
  };

  // Text block utility that draws into card (uses current y, returns new y)
  const drawParagraph = (text: string, x: number, maxW: number, opts: { size?: number; color?: [number, number, number]; bold?: boolean; italic?: boolean; lineHeight?: number } = {}) => {
    const size = opts.size ?? 10.5;
    const color = opts.color ?? INK;
    const style = opts.bold ? (opts.italic ? "bolditalic" : "bold") : opts.italic ? "italic" : "normal";
    const lh = opts.lineHeight ?? Math.round(size * 1.45);
    const lines = wrap(text, maxW, size, style as "normal" | "bold" | "italic" | "bolditalic");
    doc.setTextColor(...color);
    lines.forEach((line) => {
      // Always render with default (untracked) spacing and no maxWidth/align (which can stretch)
      doc.setCharSpace(0);
      doc.text(line, x, y);
      y += lh;
    });
  };

  // ───────────────────────────── TITLE STRIP under header ─────────────────────────────
  // Subtitle paragraph (short)
  if (payload.overall_feedback || payload.cefr_assessment) {
    // optional lead-in handled later in summary
  }

  // ───────────────────────────── IMAGE CARD ─────────────────────────────
  if (payload.type === "image" && payload.image_data_url) {
    try {
      // Detect format
      const fmt = payload.image_data_url.includes("image/png") ? "PNG" : "JPEG";
      // Get image dimensions via Image-like fallback isn't available; use jsPDF's getImageProperties
      const props = doc.getImageProperties(payload.image_data_url);
      const maxImgH = 240;
      const innerW = contentWidth - 36; // card padding 18*2
      const ratio = props.height / props.width;
      let imgW = innerW;
      let imgH = imgW * ratio;
      if (imgH > maxImgH) { imgH = maxImgH; imgW = imgH / ratio; }
      const offsetX = (innerW - imgW) / 2;

      renderCard(
        "Slika",
        () => imgH + 6,
        (innerWidth) => {
          // Draw rounded clip simulation: frame around image
          doc.setDrawColor(...CARD_BORDER);
          doc.setLineWidth(0.5);
          doc.roundedRect(margin + 18 + offsetX - 2, y - 2, imgW + 4, imgH + 4, 6, 6, "S");
          doc.addImage(payload.image_data_url!, fmt, margin + 18 + offsetX, y, imgW, imgH, undefined, "FAST");
          y += imgH;
          return imgH;
        },
      );
    } catch (e) {
      console.warn("PDF image embed failed", e);
    }
  }

  // ───────────────────────────── SUMMARY CARDS ROW ─────────────────────────────
  const stats: { label: string; value: string }[] = [];
  if (payload.mistakes) stats.push({ label: "Greške", value: String(payload.mistakes.length) });
  if (typeof payload.naturalness_score === "number") stats.push({ label: "Prirodnost", value: `${payload.naturalness_score}/10` });
  if (typeof payload.complexity_score === "number") stats.push({ label: "Kompleksnost", value: `${payload.complexity_score}/10` });
  if (payload.cefr_assessment) {
    const short = payload.cefr_assessment.match(/[A-C][12]\+?/i)?.[0] || payload.cefr_assessment.split(/[.\n—-]/)[0].trim().slice(0, 8);
    stats.push({ label: "CEFR", value: short });
  } else if (payload.level) {
    stats.push({ label: "CEFR", value: payload.level });
  }

  if (stats.length) {
    const tileH = 64;
    renderCard(
      "Sažetak",
      () => tileH + 8,
      (innerWidth) => {
        const gap = 10;
        const cols = stats.length;
        const tileW = (innerWidth - gap * (cols - 1)) / cols;
        const startX = margin + 18;
        stats.forEach((s, i) => {
          const tx = startX + i * (tileW + gap);
          doc.setFillColor(...SOFT);
          doc.roundedRect(tx, y, tileW, tileH, 8, 8, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(18);
          doc.setTextColor(...PRIMARY);
          doc.text(s.value, tx + tileW / 2, y + 30, { align: "center" });
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(...MUTED);
          doc.text(s.label.toUpperCase(), tx + tileW / 2, y + 50, { align: "center" });
        });
        y += tileH;
        return tileH;
      },
    );
  }

  // ───────────────────────────── OVERALL FEEDBACK ─────────────────────────────
  if (payload.overall_feedback) {
    renderCard(
      "Opšti utisak",
      (innerWidth) => measureWrapped(payload.overall_feedback!, innerWidth, 10.5, 15).height,
      (innerWidth) => {
        const startY = y;
        drawParagraph(payload.overall_feedback!, margin + 18, innerWidth, { italic: true, color: PRIMARY_SOFT });
        return y - startY;
      },
    );
  }

  // ───────────────────────────── ORIGINAL TEXT ─────────────────────────────
  if (payload.original_text) {
    renderCard(
      "Originalni tekst",
      (innerWidth) => measureWrapped(payload.original_text, innerWidth, 10.5, 15).height,
      (innerWidth) => {
        const startY = y;
        drawParagraph(payload.original_text, margin + 18, innerWidth, { color: INK });
        return y - startY;
      },
    );
  }

  // ───────────────────────────── CORRECTED ─────────────────────────────
  if (payload.corrected_text) {
    renderCard(
      "Ispravljena verzija",
      (innerWidth) => measureWrapped(payload.corrected_text!, innerWidth - 14, 10.5, 15).height + 8,
      (innerWidth) => {
        // soft green panel
        const m = measureWrapped(payload.corrected_text!, innerWidth - 14, 10.5, 15);
        doc.setFillColor(...SUCCESS_SOFT);
        doc.roundedRect(margin + 18, y - 4, innerWidth, m.height + 12, 6, 6, "F");
        const startY = y;
        y += 4;
        drawParagraph(payload.corrected_text!, margin + 18 + 8, innerWidth - 16, { color: SUCCESS });
        return y - startY;
      },
      SUCCESS,
    );
  }

  // ───────────────────────────── MISTAKES ─────────────────────────────
  if (payload.mistakes && payload.mistakes.length) {
    const innerW = contentWidth - 36;
    // Measure each mistake block
    const mistakeBlocks = payload.mistakes.map((m, i) => {
      const wrong = wrap(m.original, innerW - 36, 10.5, "bold");
      const right = wrap(`→ ${m.corrected}`, innerW - 36, 10.5, "bold");
      const expl = wrap(m.explanation || "", innerW - 36, 9.5, "normal");
      const h = 6 + wrong.length * 14 + right.length * 14 + (m.explanation ? expl.length * 13 + 4 : 0) + 12;
      return { i, m, wrong, right, expl, h };
    });

    renderCard(
      `Greške i objašnjenja (${payload.mistakes.length})`,
      () => mistakeBlocks.reduce((s, b) => s + b.h, 0),
      (innerWidth) => {
        const startY = y;
        mistakeBlocks.forEach(({ i, m, wrong, right, expl }) => {
          // Page break per mistake if needed
          const blockApprox = 6 + wrong.length * 14 + right.length * 14 + expl.length * 13 + 16;
          if (y + blockApprox > pageHeight - FOOTER_H - 10) {
            // Finish current card "softly": just paginate by drawing a new card frame on next page
            newPage();
          }
          // Numbered chip
          doc.setFillColor(...PRIMARY);
          doc.circle(margin + 18 + 9, y + 5, 9, "F");
          doc.setTextColor(...CREAM);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text(String(i + 1), margin + 18 + 9, y + 8, { align: "center" });

          const textX = margin + 18 + 28;
          // Wrong
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(...DANGER);
          wrong.forEach((l, idx) => {
            doc.text(l, textX, y + (idx === 0 ? 8 : 8 + idx * 13));
          });
          y += Math.max(18, wrong.length * 13 + 4);

          // Right
          doc.setTextColor(...SUCCESS);
          right.forEach((l) => {
            doc.text(l, textX, y);
            y += 13;
          });

          // Explanation
          if (m.explanation) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9.5);
            doc.setTextColor(...MUTED);
            y += 2;
            expl.forEach((l) => {
              doc.text(l, textX, y);
              y += 12;
            });
          }
          y += 10;
        });
        return y - startY;
      },
    );
  }

  // ───────────────────────────── VOCABULARY FROM IMAGE (grouped, sans korisni_izrazi) ─────────────────────────────
  const groupsAll = payload.vocabulary_helper_groups
    || (payload.vocabulary_helper && payload.vocabulary_helper.length
      ? payload.vocabulary_helper.reduce<Record<string, { word: string; translation: string }[]>>((acc, v) => {
          const k = v.type && GROUP_LABELS[v.type] ? v.type : "korisni_izrazi";
          (acc[k] ||= []).push({ word: v.word, translation: v.translation });
          return acc;
        }, {})
      : null);

  const vocabKeys = groupsAll
    ? [
        ...GROUP_ORDER.filter((k) => k !== "korisni_izrazi" && groupsAll[k]?.length),
        ...Object.keys(groupsAll).filter((k) => !GROUP_ORDER.includes(k) && k !== "korisni_izrazi" && groupsAll[k]?.length),
      ]
    : [];

  if (vocabKeys.length && groupsAll) {
    // Compute 2-column layout per group: items split across two columns
    const innerW = contentWidth - 36;
    const colGap = 16;
    const colW = (innerW - colGap) / 2;

    const measureGroup = (k: string) => {
      const items = groupsAll[k];
      const lines = items.map((v) => `• ${v.word} — ${v.translation}`);
      // Wrap each line to column width
      let leftH = 0, rightH = 0;
      const half = Math.ceil(items.length / 2);
      lines.slice(0, half).forEach((l) => {
        const w = wrap(l, colW, 9.5);
        leftH += w.length * 13;
      });
      lines.slice(half).forEach((l) => {
        const w = wrap(l, colW, 9.5);
        rightH += w.length * 13;
      });
      return 18 + Math.max(leftH, rightH) + 8; // group header + body
    };

    const totalH = vocabKeys.reduce((s, k) => s + measureGroup(k), 0);

    renderCard(
      "Vokabular sa slike",
      () => totalH,
      (innerWidth) => {
        const startY = y;
        vocabKeys.forEach((k) => {
          // page break per group if needed
          const gH = measureGroup(k);
          if (y + gH > pageHeight - FOOTER_H - 10) newPage();
          // Group header
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(...PRIMARY);
          doc.text((GROUP_LABELS[k] || k).toUpperCase(), margin + 18, y);
          // accent rule
          doc.setDrawColor(...ACCENT);
          doc.setLineWidth(0.5);
          const labelW = doc.getTextWidth((GROUP_LABELS[k] || k).toUpperCase());
          doc.line(margin + 18 + labelW + 8, y - 3, margin + 18 + innerW, y - 3);
          y += 14;

          const items = groupsAll[k];
          const half = Math.ceil(items.length / 2);
          const left = items.slice(0, half);
          const right = items.slice(half);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);

          const drawCol = (arr: { word: string; translation: string }[], x: number) => {
            let cy = y;
            arr.forEach((v) => {
              const line = `• ${v.word} — ${v.translation}`;
              const wrapped = wrap(line, colW, 9.5);
              wrapped.forEach((l, idx) => {
                doc.setTextColor(...(idx === 0 ? INK : MUTED));
                doc.setCharSpace(0);
                doc.text(l, x, cy);
                cy += 13;
              });
            });
            return cy;
          };
          const endLeft = drawCol(left, margin + 18);
          const endRight = drawCol(right, margin + 18 + colW + colGap);
          y = Math.max(endLeft, endRight) + 6;
        });
        return y - startY;
      },
    );
  }

  // ───────────────────────────── KORISNI IZRAZI ─────────────────────────────
  const expressionItems: { left: string; right: string }[] = [];
  if (groupsAll?.korisni_izrazi?.length) {
    groupsAll.korisni_izrazi.forEach((v) => expressionItems.push({ left: v.word, right: v.translation }));
  }
  payload.expressions?.forEach((e) => expressionItems.push({ left: e.no, right: e.sr }));

  if (expressionItems.length) {
    const innerW = contentWidth - 36;
    const colGap = 16;
    const colW = (innerW - colGap) / 2;
    const measureExpr = () => {
      const half = Math.ceil(expressionItems.length / 2);
      let leftH = 0, rightH = 0;
      expressionItems.slice(0, half).forEach((it) => {
        const w = wrap(`• ${it.left} — ${it.right}`, colW, 9.5);
        leftH += w.length * 13;
      });
      expressionItems.slice(half).forEach((it) => {
        const w = wrap(`• ${it.left} — ${it.right}`, colW, 9.5);
        rightH += w.length * 13;
      });
      return Math.max(leftH, rightH) + 4;
    };
    renderCard(
      "Korisni izrazi",
      () => measureExpr(),
      (innerWidth) => {
        const startY = y;
        const half = Math.ceil(expressionItems.length / 2);
        const drawCol = (arr: typeof expressionItems, x: number) => {
          let cy = y;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          arr.forEach((it) => {
            const wrapped = doc.splitTextToSize(`• ${it.left} — ${it.right}`, colW) as string[];
            wrapped.forEach((l, idx) => {
              doc.setTextColor(...(idx === 0 ? INK : MUTED));
              doc.text(l, x, cy);
              cy += 12;
            });
          });
          return cy;
        };
        const endL = drawCol(expressionItems.slice(0, half), margin + 18);
        const endR = drawCol(expressionItems.slice(half), margin + 18 + colW + colGap);
        y = Math.max(endL, endR);
        return y - startY;
      },
    );
  }

  // ───────────────────────────── SENTENCE STARTERS ─────────────────────────────
  if (payload.sentence_starters && payload.sentence_starters.length) {
    const starters = payload.sentence_starters;
    const innerW = contentWidth - 36;
    const lineH = 16;
    const measureStarters = () => {
      let h = 14; // hint line
      starters.forEach((s) => {
        const wrapped = doc.splitTextToSize(s, innerW - 18) as string[];
        h += wrapped.length * lineH;
      });
      return h;
    };
    renderCard(
      "Počeci rečenica",
      () => measureStarters(),
      (innerWidth) => {
        const startY = y;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(...MUTED);
        doc.text("Dovrši rečenice svojim rečima.", margin + 18, y);
        y += 14;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        doc.setTextColor(...INK);
        starters.forEach((s) => {
          // bullet dash
          doc.setTextColor(...PRIMARY);
          doc.text("—", margin + 18, y);
          doc.setTextColor(...INK);
          const wrapped = doc.splitTextToSize(s, innerW - 18) as string[];
          wrapped.forEach((l, idx) => {
            doc.text(l, margin + 18 + 14, y + idx * lineH);
          });
          y += wrapped.length * lineH;
        });
        return y - startY;
      },
    );
  }

  // ───────────────────────────── VOCABULARY SUGGESTIONS (text mode usually) ─────────────────────────────
  if (payload.vocabulary_suggestions && payload.vocabulary_suggestions.length) {
    const innerW = contentWidth - 36;
    const measure = () => {
      let h = 0;
      payload.vocabulary_suggestions!.forEach((v) => {
        h += 16; // weak → better line
        if (v.why) {
          const w = doc.splitTextToSize(v.why, innerW) as string[];
          h += w.length * 12 + 4;
        }
        h += 8;
      });
      return h;
    };
    renderCard(
      "Predlozi vokabulara",
      () => measure(),
      (innerWidth) => {
        const startY = y;
        payload.vocabulary_suggestions!.forEach((v) => {
          if (y + 30 > pageHeight - FOOTER_H - 10) newPage();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(...DANGER);
          doc.text(v.weak, margin + 18, y);
          const ww = doc.getTextWidth(v.weak);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...MUTED);
          doc.text("  →  ", margin + 18 + ww, y);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...SUCCESS);
          doc.text(v.better, margin + 18 + ww + 22, y);
          y += 14;
          if (v.why) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9.5);
            doc.setTextColor(...MUTED);
            const w = doc.splitTextToSize(v.why, innerW) as string[];
            w.forEach((l) => { doc.text(l, margin + 18, y); y += 12; });
          }
          y += 8;
        });
        return y - startY;
      },
    );
  }

  // ───────────────────────────── PER-DIMENSION ANALYSIS ─────────────────────────────
  if (payload.nivo_analiza && Object.keys(payload.nivo_analiza).length) {
    const entries = Object.entries(payload.nivo_analiza);
    const innerW = contentWidth - 36;
    const measure = () => entries.reduce((acc, [, v]) => {
      const w = doc.splitTextToSize(String(v), innerW) as string[];
      return acc + 16 + w.length * 12 + 6;
    }, 0);
    renderCard(
      "Analiza po dimenzijama",
      () => measure(),
      (innerWidth) => {
        const startY = y;
        entries.forEach(([k, v]) => {
          if (y + 28 > pageHeight - FOOTER_H - 10) newPage();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(...PRIMARY);
          doc.text(NIVO_LABELS[k] || k.replace(/_/g, " "), margin + 18, y);
          y += 14;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(...INK);
          const w = doc.splitTextToSize(String(v), innerW) as string[];
          w.forEach((l) => { doc.text(l, margin + 18, y); y += 12; });
          y += 6;
        });
        return y - startY;
      },
    );
  }

  // ───────────────────────────── CEFR ─────────────────────────────
  if (payload.cefr_assessment) {
    renderCard(
      "CEFR procena",
      (innerWidth) => measureWrapped(payload.cefr_assessment!, innerWidth, 10.5, 15).height,
      (innerWidth) => {
        const startY = y;
        drawParagraph(payload.cefr_assessment!, margin + 18, innerWidth, { color: INK });
        return y - startY;
      },
    );
  }

  // ───────────────────────────── SLEDEĆI KORACI ─────────────────────────────
  if (payload.sledeci_korak && payload.sledeci_korak.length) {
    const innerW = contentWidth - 36;
    const measure = () => payload.sledeci_korak!.reduce((acc, s) => {
      const w = doc.splitTextToSize(s, innerW - 24) as string[];
      return acc + w.length * 14 + 6;
    }, 0);
    renderCard(
      "Sledeći koraci",
      () => measure(),
      (innerWidth) => {
        const startY = y;
        payload.sledeci_korak!.forEach((s, i) => {
          if (y + 20 > pageHeight - FOOTER_H - 10) newPage();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(...PRIMARY);
          doc.text(`${i + 1}.`, margin + 18, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...INK);
          const w = doc.splitTextToSize(s, innerW - 24) as string[];
          w.forEach((l, idx) => { doc.text(l, margin + 18 + 20, y + idx * 14); });
          y += w.length * 14 + 6;
        });
        return y - startY;
      },
    );
  }

  // ─── Footers on every page ───
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    paintFooter(i, totalPages);
  }

  doc.save(filename);
}
