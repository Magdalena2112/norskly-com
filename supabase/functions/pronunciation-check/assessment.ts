// Official locale list: https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=pronunciation-assessment
export const LOCALES = { no: "nb-NO", en: "en-GB", de: "de-DE" } as const;
/** Minimum word/overall accuracy to pass; below this the learner retries. */
export const PASS_THRESHOLD = 80;
/** Any single sound below this marks the whole word as an error. */
export const PHONEME_MIN = 70;
type Phoneme = { Phoneme?: string; AccuracyScore?: number; PronunciationAssessment?: { AccuracyScore?: number } };
type WordMetrics = { AccuracyScore?: number; ErrorType?: string };
type Metrics = { PronScore?: number; AccuracyScore?: number; FluencyScore?: number; CompletenessScore?: number };
export type AzureWord = WordMetrics & { Word: string; PronunciationAssessment?: WordMetrics; Phonemes?: Phoneme[] };
export type AzureResult = { RecognitionStatus?: string; NBest?: (Metrics & { Display?: string; PronunciationAssessment?: Metrics; Words?: AzureWord[] })[] };

export function assessmentResult(data: AzureResult) {
  const best = data.NBest?.[0];
  // REST uses flat metrics; the Speech SDK uses a nested assessment object.
  const metric = best?.PronunciationAssessment ?? best;
  if (data.RecognitionStatus !== "Success") return null;
  if (!metric || !Number.isFinite(metric.PronScore) || !best?.Words?.length) throw new Error("Missing assessment");
  const words = best.Words.filter((w) => (w.PronunciationAssessment ?? w).ErrorType !== "Insertion").map((w) => {
    const m = w.PronunciationAssessment ?? w;
    const phonemeOk = (w.Phonemes ?? []).every((p) => ((p.PronunciationAssessment ?? p).AccuracyScore ?? 100) >= PHONEME_MIN);
    const ok = m.ErrorType !== "Omission" && m.ErrorType !== "Mispronunciation" && (m.AccuracyScore ?? 0) >= PASS_THRESHOLD && phonemeOk;
    const issue = ok ? undefined : m.ErrorType === "Omission" ? "omitted" : !phonemeOk ? "sound" : "unclear";
    return { word: w.Word, ok, issue };
  });
  // Accuracy drives the score so fluency/completeness cannot inflate weak sounds.
  const raw = Math.min(metric.PronScore ?? 0, metric.AccuracyScore ?? metric.PronScore ?? 0);
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const anyError = words.some((w) => !w.ok);
  const verdict = score >= 90 && !anyError ? "excellent" : score >= PASS_THRESHOLD && !anyError ? "good" : "retry";
  return { score, verdict, words, fluency: Math.round(metric.FluencyScore ?? 0), completeness: Math.round(metric.CompletenessScore ?? 0) };
}

export function validWav(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 46) return false;
  const v = new DataView(buffer);
  const text = (offset: number, n: number) => String.fromCharCode(...new Uint8Array(buffer, offset, n));
  if (text(0, 4) !== "RIFF" || text(8, 4) !== "WAVE" || text(12, 4) !== "fmt " || v.getUint16(20, true) !== 1 || v.getUint16(22, true) !== 1 || v.getUint32(24, true) !== 16000 || v.getUint16(34, true) !== 16) return false;
  return text(36, 4) === "data" && v.getUint32(40, true) === buffer.byteLength - 44 && (buffer.byteLength - 44) <= 16000 * 2 * 30;
}
