import { assessmentResult, LOCALES, validWav } from "./assessment.ts";
const assert = (condition: boolean) => { if (!condition) throw new Error("Assertion failed"); };
Deno.test("explicit assessment locales isolate all three languages", () => {
  assert(LOCALES.no === "nb-NO" && LOCALES.en === "en-GB" && LOCALES.de === "de-DE");
});
Deno.test("Azure scores determine verdict, omissions remain errors", () => {
  const r = assessmentResult({ RecognitionStatus: "Success", NBest: [{ PronunciationAssessment: { PronScore: 74 }, Words: [
    { Word: "Nora", PronunciationAssessment: { AccuracyScore: 95, ErrorType: "None" } },
    { Word: "bor", PronunciationAssessment: { AccuracyScore: 50, ErrorType: "Mispronunciation" } },
    { Word: "Oslo", PronunciationAssessment: { AccuracyScore: 99, ErrorType: "Omission" } },
  ] }] });
  assert(r?.score === 74 && r.verdict === "good");
  assert(r?.words[0].ok === true && r.words[1].ok === false && r.words[2].ok === false);
});
Deno.test("silence and missing metrics never produce a successful score", () => {
  assert(assessmentResult({ RecognitionStatus: "NoMatch" }) === null);
  let rejected = false;
  try { assessmentResult({ RecognitionStatus: "Success", NBest: [{ Display: "hello" }] }); } catch { rejected = true; }
  assert(rejected);
});
Deno.test("compressed recording cannot be disguised as WAV", () => {
  assert(!validWav(new TextEncoder().encode("fake WebM recording").buffer));
});
Deno.test("live REST flat metrics grade words without relying on SDK nesting", () => {
  const r = assessmentResult({ RecognitionStatus: "Success", NBest: [{ PronScore: 94, Words: [
    { Word: "Takk", AccuracyScore: 97, ErrorType: "None" },
    { Word: "hjelpen", AccuracyScore: 55, ErrorType: "Mispronunciation" },
  ] }] });
  assert(r?.score === 94 && r.verdict === "excellent" && r.words[0].ok && !r.words[1].ok);
});