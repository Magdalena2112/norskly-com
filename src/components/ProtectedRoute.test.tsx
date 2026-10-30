import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "./ProtectedRoute";

const { onboarded, auth } = vi.hoisted(() => ({ onboarded: vi.fn(), auth: { user: { id: "health-student" } as { id: string } | null, loading: false } }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/hooks/useUserRole", () => ({ useUserRole: () => ({ isAdmin: false, isTeacher: false, loading: false }) }));
vi.mock("@/lib/onboardingStatus", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/onboardingStatus")>(), isLanguageOnboarded: onboarded }));
function Destination() { const location = useLocation(); return <p>{location.pathname}{location.search}</p>; }
function open(path: string) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={[path]}><Routes>
      <Route path="/ucenje/:slug" element={<ProtectedRoute><p>Enrolled dashboard</p></ProtectedRoute>} />
      <Route path="/auth" element={<Destination />} />
      <Route path="/onboarding" element={<Destination />} />
    </Routes></MemoryRouter>
  </QueryClientProvider>);
}
beforeEach(() => { localStorage.clear(); auth.user = { id: "health-student" }; onboarded.mockReset(); onboarded.mockResolvedValue(true); });
afterEach(cleanup);
describe("existing healthcare session routing", () => {
  it.each([["nemacki", "de"], ["norveski", "no"]])("resolves missing %s selection from enrolled courses, not general onboarding", async (slug, language) => {
    open(`/ucenje/${slug}`);
    expect(await screen.findByText(`/auth?choose=courses&lang=${slug}`)).toBeInTheDocument();
    expect(onboarded).not.toHaveBeenCalled();
    expect(localStorage.getItem(`norskly_course_${language}`)).toBeNull();
  });
  it("recovers stale general selection instead of starting another course", async () => {
    localStorage.setItem("norskly_course_de", "general"); onboarded.mockResolvedValue(false);
    open("/ucenje/nemacki");
    expect(await screen.findByText("/auth?choose=courses&lang=nemacki")).toBeInTheDocument();
  });
  it("preserves explicit general-course intent", async () => {
    onboarded.mockResolvedValue(false); open("/ucenje/nemacki?course=general");
    expect(await screen.findByText("/onboarding?lang=nemacki&course=general")).toBeInTheDocument();
  });
  it("keeps a completed stored healthcare enrollment", async () => {
    localStorage.setItem("norskly_course_de", "health"); open("/ucenje/nemacki");
    expect(await screen.findByText("Enrolled dashboard")).toBeInTheDocument();
    expect(onboarded).toHaveBeenCalledWith("health-student", "de", "health");
  });
  it("does not turn a signed-out implicit link into explicit general intent", async () => {
    auth.user = null; open("/ucenje/nemacki");
    expect(await screen.findByText("/auth?lang=nemacki")).toBeInTheDocument();
  });
  it("retries read failures without redirecting to onboarding", async () => {
    localStorage.setItem("norskly_course_de", "health"); onboarded.mockRejectedValueOnce(new Error("Unavailable")).mockResolvedValue(true);
    open("/ucenje/nemacki");
    fireEvent.click(await screen.findByRole("button", { name: "Pokušaj ponovo" }));
    await waitFor(() => expect(screen.getByText("Enrolled dashboard")).toBeInTheDocument());
  });
});