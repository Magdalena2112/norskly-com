import { describe, expect, it } from "vitest";
import { encodePcmWav, incorrectWords } from "./pronunciationRecording";

describe("pronunciation recording", () => {
  it("sends 16 kHz mono PCM WAV", () => {
    const wav = encodePcmWav(new Float32Array(48000).fill(0.5), 48000);
    const v = new DataView(wav);
    expect(v.getUint32(24, true)).toBe(16000);
    expect(v.getUint16(22, true)).toBe(1);
    expect(v.getUint16(34, true)).toBe(16);
    expect(v.getUint32(40, true)).toBe(32000);
    expect(v.getInt16(44, true)).toBe(16384);
  });
  it("keeps only words with errors for the beginner's feedback", () => {
    expect(incorrectWords([{ word: "hello", ok: true }, { word: "world", ok: false }])).toEqual([{ word: "world", ok: false }]);
    expect(incorrectWords([{ word: "hello", ok: true }])).toEqual([]);
  });
});