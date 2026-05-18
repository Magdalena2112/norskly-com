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
  cefr_assessment?: string;
}

const PRIMARY: [number, number, number] = [86, 28, 47]; // burgundy
const MUTED: [number, number, number] = [120, 100, 105];
const ACCENT: [number, number, number] = [220, 180, 170];

export function generateWritingPdf(payload: WritingPdfPayload, filename = "norskly-pisanje.pdf") {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header band
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(252, 246, 235);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Norskly · Pisanje", margin, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `${payload.type === "image" ? "Bildebeskrivelse" : "Korekcija teksta"} · ${new Date().toLocaleDateString("sr-Latn-RS")}${payload.level ? " · " + payload.level : ""}`,
    margin,
    56,
  );
  y = 100;
  doc.setTextColor(40, 25, 30);

  const heading = (label: string) => {
    ensureSpace(36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...PRIMARY);
    doc.text(label, margin, y);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.8);
    doc.line(margin, y + 4, margin + 60, y + 4);
    y += 18;
    doc.setTextColor(40, 25, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
  };

  const paragraph = (text: string) => {
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      ensureSpace(16);
      doc.text(line, margin, y);
      y += 14;
    });
    y += 4;
  };

  heading("Originalni tekst");
  paragraph(payload.original_text || "—");

  if (payload.corrected_text) {
    heading("Ispravljena verzija");
    paragraph(payload.corrected_text);
  }

  if (payload.mistakes && payload.mistakes.length) {
    heading(`Greške (${payload.mistakes.length})`);
    payload.mistakes.forEach((m, i) => {
      ensureSpace(46);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${i + 1}. ${m.original}  →  ${m.corrected}`, margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
      const lines = doc.splitTextToSize(m.explanation, contentWidth);
      lines.forEach((line: string) => {
        ensureSpace(14);
        doc.text(line, margin, y);
        y += 13;
      });
      doc.setTextColor(40, 25, 30);
      y += 4;
    });
  }

  if (payload.vocabulary_suggestions && payload.vocabulary_suggestions.length) {
    heading("Predlozi vokabulara");
    payload.vocabulary_suggestions.forEach((v) => {
      ensureSpace(30);
      doc.setFont("helvetica", "bold");
      doc.text(`${v.weak}  →  ${v.better}`, margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
      const lines = doc.splitTextToSize(v.why, contentWidth);
      lines.forEach((line: string) => {
        ensureSpace(14);
        doc.text(line, margin, y);
        y += 13;
      });
      doc.setTextColor(40, 25, 30);
      y += 4;
    });
  }

  if (payload.vocabulary_helper && payload.vocabulary_helper.length) {
    heading("Vokabular sa slike");
    payload.vocabulary_helper.forEach((v) => {
      ensureSpace(14);
      doc.text(`• ${v.word} — ${v.translation}${v.type ? "  (" + v.type + ")" : ""}`, margin, y);
      y += 13;
    });
    y += 4;
  }

  if (payload.overall_feedback) {
    heading("Opšti komentar");
    paragraph(payload.overall_feedback);
  }

  if (payload.cefr_assessment) {
    heading("CEFR procena");
    paragraph(payload.cefr_assessment);
  }

  if (payload.sledeci_korak && payload.sledeci_korak.length) {
    heading("Sledeći koraci");
    payload.sledeci_korak.forEach((s, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${s}`, contentWidth);
      lines.forEach((line: string) => {
        ensureSpace(14);
        doc.text(line, margin, y);
        y += 13;
      });
      y += 2;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Norskly · norskly.com", margin, pageHeight - 20);
    doc.text(`${i} / ${pageCount}`, pageWidth - margin - 30, pageHeight - 20);
  }

  doc.save(filename);
}
