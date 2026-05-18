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
  cefr_assessment?: string;
  naturalness_score?: number;
  complexity_score?: number;
  nivo_analiza?: Record<string, string>;
}

const PRIMARY: [number, number, number] = [86, 28, 47]; // burgundy
const MUTED: [number, number, number] = [120, 100, 105];
const ACCENT: [number, number, number] = [220, 180, 170];
const CREAM: [number, number, number] = [252, 246, 235];
const SOFT: [number, number, number] = [245, 232, 225];
const SUCCESS: [number, number, number] = [70, 120, 90];
const DANGER: [number, number, number] = [170, 70, 70];
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
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin - 20) {
      doc.addPage();
      y = margin;
    }
  };

  // ─── Header band ───
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 78, "F");
  doc.setTextColor(...CREAM);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Norskly · Pisanje", margin, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `${payload.type === "image" ? "Bildebeskrivelse" : "Korekcija teksta"}  ·  ${new Date().toLocaleDateString("sr-Latn-RS", { day: "2-digit", month: "long", year: "numeric" })}${payload.level ? "  ·  Nivo " + payload.level : ""}`,
    margin,
    60,
  );
  y = 110;
  doc.setTextColor(...INK);

  // ─── Helpers ───
  const heading = (label: string) => {
    ensureSpace(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...PRIMARY);
    doc.text(label, margin, y);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.8);
    doc.line(margin, y + 5, margin + 60, y + 5);
    y += 20;
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
  };

  const paragraph = (text: string, color: [number, number, number] = INK) => {
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      ensureSpace(16);
      doc.text(line, margin, y);
      y += 14;
    });
    doc.setTextColor(...INK);
    y += 4;
  };

  const filledBox = (height: number, fill: [number, number, number]) => {
    ensureSpace(height + 6);
    doc.setFillColor(...fill);
    doc.roundedRect(margin, y, contentWidth, height, 6, 6, "F");
  };

  // ─── Summary box ───
  const summaryItems: { label: string; value: string }[] = [];
  if (payload.mistakes) summaryItems.push({ label: "Greške", value: String(payload.mistakes.length) });
  if (payload.vocabulary_suggestions) summaryItems.push({ label: "Predlozi reči", value: String(payload.vocabulary_suggestions.length) });
  if (typeof payload.naturalness_score === "number") summaryItems.push({ label: "Prirodnost", value: `${payload.naturalness_score}/10` });
  if (typeof payload.complexity_score === "number") summaryItems.push({ label: "Kompleksnost", value: `${payload.complexity_score}/10` });
  if (payload.cefr_assessment) summaryItems.push({ label: "CEFR", value: payload.cefr_assessment.split(/[.\n—-]/)[0].trim().slice(0, 18) });

  if (summaryItems.length) {
    heading("Sažetak");
    const cols = Math.min(summaryItems.length, 5);
    const boxH = 56;
    filledBox(boxH, SOFT);
    const cellW = contentWidth / cols;
    summaryItems.slice(0, cols).forEach((item, i) => {
      const cx = margin + cellW * i + cellW / 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...PRIMARY);
      doc.text(item.value, cx, y + 26, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(item.label.toUpperCase(), cx, y + 44, { align: "center" });
    });
    y += boxH + 14;
    doc.setTextColor(...INK);

    if (payload.overall_feedback) {
      paragraph(payload.overall_feedback);
    }
  }

  // ─── Original ───
  heading("Originalni tekst");
  paragraph(payload.original_text || "—");

  // ─── Corrected ───
  if (payload.corrected_text) {
    heading("Ispravljena verzija");
    paragraph(payload.corrected_text, SUCCESS);
  }

  // ─── Mistakes ───
  if (payload.mistakes && payload.mistakes.length) {
    heading(`Greške i objašnjenja (${payload.mistakes.length})`);
    payload.mistakes.forEach((m, i) => {
      ensureSpace(54);
      // numbered chip
      doc.setFillColor(...PRIMARY);
      doc.circle(margin + 8, y - 3, 9, "F");
      doc.setTextColor(...CREAM);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(String(i + 1), margin + 8, y, { align: "center" });

      doc.setTextColor(...DANGER);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const wrongLines = doc.splitTextToSize(m.original, contentWidth - 30);
      doc.text(wrongLines[0] || "", margin + 24, y);
      y += 14;
      if (wrongLines.length > 1) {
        wrongLines.slice(1).forEach((l: string) => { ensureSpace(14); doc.text(l, margin + 24, y); y += 13; });
      }

      doc.setTextColor(...SUCCESS);
      const rightLines = doc.splitTextToSize(`→ ${m.corrected}`, contentWidth - 30);
      rightLines.forEach((l: string) => { ensureSpace(14); doc.text(l, margin + 24, y); y += 13; });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...MUTED);
      const expl = doc.splitTextToSize(m.explanation, contentWidth - 30);
      expl.forEach((l: string) => { ensureSpace(13); doc.text(l, margin + 24, y); y += 12; });
      doc.setTextColor(...INK);
      y += 8;
    });
  }

  // ─── Vocabulary suggestions ───
  if (payload.vocabulary_suggestions && payload.vocabulary_suggestions.length) {
    heading("Predlozi vokabulara");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    paragraph("Slabije reči i prirodnije alternative koje možeš koristiti.");
    payload.vocabulary_suggestions.forEach((v) => {
      ensureSpace(36);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...INK);
      doc.text(v.weak, margin, y);
      const weakWidth = doc.getTextWidth(v.weak);
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
      doc.text("  →  ", margin + weakWidth, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...SUCCESS);
      doc.text(v.better, margin + weakWidth + 22, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...MUTED);
      const lines = doc.splitTextToSize(v.why, contentWidth);
      lines.forEach((line: string) => { ensureSpace(13); doc.text(line, margin, y); y += 12; });
      doc.setTextColor(...INK);
      y += 6;
    });
  }

  // ─── Vocabulary helper (image) — grouped ───
  const groups = payload.vocabulary_helper_groups
    || (payload.vocabulary_helper && payload.vocabulary_helper.length
      ? payload.vocabulary_helper.reduce<Record<string, { word: string; translation: string }[]>>((acc, v) => {
          const k = v.type && GROUP_LABELS[v.type] ? v.type : "korisni_izrazi";
          (acc[k] ||= []).push({ word: v.word, translation: v.translation });
          return acc;
        }, {})
      : null);
  if (groups) {
    const keys = [
      ...GROUP_ORDER.filter((k) => groups[k]?.length),
      ...Object.keys(groups).filter((k) => !GROUP_ORDER.includes(k) && groups[k]?.length),
    ];
    if (keys.length) {
      heading("Vokabular sa slike");
      keys.forEach((k) => {
        ensureSpace(20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...PRIMARY);
        doc.text((GROUP_LABELS[k] || k).toUpperCase(), margin, y);
        y += 13;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...INK);
        groups[k].forEach((v) => {
          ensureSpace(13);
          const word = v.word;
          doc.setFont("helvetica", "bold");
          doc.text(`• ${word}`, margin + 8, y);
          const w = doc.getTextWidth(`• ${word}`);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...MUTED);
          doc.text(` — ${v.translation}`, margin + 8 + w, y);
          doc.setTextColor(...INK);
          y += 12;
        });
        y += 6;
      });
    }
  }

  // ─── Per-dimension scores ───
  if (payload.nivo_analiza && Object.keys(payload.nivo_analiza).length) {
    heading("Analiza po dimenzijama");
    Object.entries(payload.nivo_analiza).forEach(([key, value]) => {
      ensureSpace(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...PRIMARY);
      doc.text(NIVO_LABELS[key] || key.replace(/_/g, " "), margin, y);
      y += 13;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...INK);
      const lines = doc.splitTextToSize(String(value), contentWidth);
      lines.forEach((l: string) => { ensureSpace(13); doc.text(l, margin, y); y += 12; });
      y += 4;
    });
  }

  // ─── CEFR ───
  if (payload.cefr_assessment) {
    heading("CEFR procena");
    paragraph(payload.cefr_assessment);
  }

  // ─── Next steps ───
  if (payload.sledeci_korak && payload.sledeci_korak.length) {
    heading("Sledeći koraci");
    payload.sledeci_korak.forEach((s, i) => {
      ensureSpace(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...PRIMARY);
      doc.text(`${i + 1}.`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...INK);
      const lines = doc.splitTextToSize(s, contentWidth - 20);
      lines.forEach((line: string, idx: number) => {
        ensureSpace(14);
        doc.text(line, margin + 18, y);
        if (idx < lines.length - 1) y += 13;
      });
      y += 15;
    });
  }

  // ─── Footer ───
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Norskly · norskly.com", margin, pageHeight - 18);
    doc.text(`${i} / ${pageCount}`, pageWidth - margin, pageHeight - 18, { align: "right" });
  }

  doc.save(filename);
}
