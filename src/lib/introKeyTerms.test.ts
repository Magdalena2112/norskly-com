import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

const dir = path.resolve(__dirname, "../../supabase/functions/_shared/course-content");
const lessons = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

describe("intro texts list key words and phrases", () => {
  for (const file of lessons) {
    it(`${file}: every intro text has 8 key terms`, () => {
      const d = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      for (const t of d.intro) expect(t.keyTerms?.length ?? 0).toBe(8);
    });
  }
});
