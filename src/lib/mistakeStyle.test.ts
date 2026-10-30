import { expect, test } from "vitest";
import { buildMistakeStyleLine } from "../../supabase/functions/_shared/learnerStyle.ts";
test("direct", () => expect(buildMistakeStyleLine({ preferred_tone: "direktan" })).toContain("direct and detailed"));
test("supportive default", () => expect(buildMistakeStyleLine(null)).toContain("supportive"));
