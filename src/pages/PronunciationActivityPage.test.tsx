import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecordSlot } from "./PronunciationActivityPage";

const { wav, session } = vi.hoisted(() => ({ wav: vi.fn(), session: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: session } } }));
vi.mock("@/lib/pronunciationRecording", async (original) => ({ ...await original<object>(), recordingToWav: wav }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/context/ProfileContext", () => ({ useProfile: () => ({}) }));

class Recorder {
  static isTypeSupported() { return true; }
  state = "inactive";
  mimeType = "audio/webm";
  ondataavailable?: (event: { data: Blob }) => void;
  onstop?: () => void;
  start() { this.state = "recording"; }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob([new Uint8Array(2000)]) });
    this.onstop?.();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("MediaRecorder", Recorder);
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) } });
  URL.createObjectURL = vi.fn(() => "blob:recording");
  URL.revokeObjectURL = vi.fn();
  session.mockResolvedValue({ data: { session: { access_token: "test-token" } } });
  wav.mockResolvedValue(new Blob([new Uint8Array(2000)], { type: "audio/wav" }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function record() {
  fireEvent.click(screen.getByRole("button", { name: "Izgovori i proveri" }));
  fireEvent.click(await screen.findByRole("button", { name: /Završi snimanje/ }));
}

describe("Recorded pronunciation assessment", () => {
  it.each(["de", "no", "en"])("sends %s recording for assessment and uses the returned score", async (language) => {
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ score: 52, verdict: "retry", words: [{ word: "Miete", ok: false }], feedback: "Ponovi označenu reč." }) });
    vi.stubGlobal("fetch", request);
    const success = vi.fn();
    render(<RecordSlot item={{ text: "Die Miete ist sehr hoch." }} lang={language} level="A2" onSuccess={success} />);
    await record();
    await screen.findByText("52%");
    const body = request.mock.calls[0][1].body as FormData;
    expect(body.get("language")).toBe(language);
    expect(body.get("expected")).toBe("Die Miete ist sehr hoch.");
    expect(body.get("file")).toBeInstanceOf(Blob);
    expect(success).not.toHaveBeenCalled();
  });

  it("keeps a failed assessment visible and retries the same audio without awarding success", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Procena trenutno nije dostupna." }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ score: 91, verdict: "excellent", words: [], feedback: "Odličan izgovor." }) });
    vi.stubGlobal("fetch", request);
    const success = vi.fn();
    render(<RecordSlot item={{ text: "Miete" }} lang="de" level="A2" onSuccess={success} />);
    await record();
    await screen.findByRole("alert");
    expect(success).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ponovi procenu" }));
    await screen.findByText("91%");
    await waitFor(() => expect(success).toHaveBeenCalledTimes(1));
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
  });
});