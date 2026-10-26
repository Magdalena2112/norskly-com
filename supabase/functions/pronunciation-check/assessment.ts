// Official locale list: https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=pronunciation-assessment
export const LOCALES = { no: "nb-NO", en: "en-GB", de: "de-DE" } as const;
export type AzureWord = { Word: string; PronunciationAssessment?: { AccuracyScore?: number; ErrorType?: string }; Phonemes?: unknown[] };
export type AzureResult = { RecognitionStatus?: string; NBest?: { Display?: string; PronunciationAssessment?: { PronScore?: number; AccuracyScore?: number; FluencyScore?: number; CompletenessScore?: number }; Words?: AzureWord[] }[] };

export function assessmentResult(data: AzureResult) {
  const best = data.NBest?.[0];
  const metric = best?.PronunciationAssessment;
  if (data.RecognitionStatus !== "Success") return null;
  if (!metric || !Number.isFinite(metric.PronScore) || !best?.Words?.length) throw new Error("Missing assessment");
  const score = Math.max(0, Math.min(100, Math.round(metric.PronScore ?? 0)));
  const words = best.Words.filter((w) => w.PronunciationAssessment?.ErrorType !== "Insertion").map((w) => ({
    word: w.Word,
    ok: w.PronunciationAssessment?.ErrorType !== "Omission" && w.PronunciationAssessment?.ErrorType !== "Mispronunciation" && (w.PronunciationAssessment?.AccuracyScore ?? 0) >= 70,
  }));
  return { score, verdict: score >= 90 ? "excellent" : score >= 70 ? "good" : "retry", words };
}

export function validWav(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 46) return false;
  const v = new DataView(buffer);
  const text = (offset: number, n: number) => String.fromCharCode(...new Uint8Array(buffer, offset, n));
  if (text(0, 4) !== "RIFF" || text(8, 4) !== "WAVE" || text(12, 4) !== "fmt " || v.getUint16(20, true) !== 1 || v.getUint16(22, true) !== 1 || v.getUint32(24, true) !== 16000 || v.getUint16(34, true) !== 16) return false;
  return text(36, 4) === "data" && v.getUint32(40, true) === buffer.byteLength - 44 && (buffer.byteLength - 44) <= 16000 * 2 * 30;
}