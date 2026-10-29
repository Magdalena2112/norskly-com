import { SKILLS_MATRIX } from "./skillsMatrixData.ts";

export type MatrixLang = "en" | "no" | "de";
export type MatrixLevel = "A1" | "A2" | "B1" | "B2" | "C1";
export type MatrixSkill = "listening" | "reading" | "speaking" | "writing" | "interaction" | "vocabulary" | "grammar" | "pronunciation";

const LEVELS: MatrixLevel[] = ["A1", "A2", "B1", "B2", "C1"];

export function normalizeMatrixLevel(raw: unknown): MatrixLevel {
  const m = String(raw ?? "").toUpperCase().match(/[ABC][12]/)?.[0] as MatrixLevel | undefined;
  return m && LEVELS.includes(m) ? m : "A1";
}

const LANG_RULE: Record<MatrixLang, string> = {
  no: "Bokmål je pisani standard; regionalne varijante izgovora nisu greška ako su razumljive.",
  de: "Dosledno prati član + imenicu, padež i položaj glagola; razumljive varijante izgovora prihvati.",
  en: "Prihvati razumljive međunarodne varijetete engleskog; ne zahtevaj izvorni akcenat.",
};

/** Builds the Norskly assessment rubric for one language, CEFR level and set of skills (Serbian). */
export function buildRubricLine(lang: string, level: unknown, skills: MatrixSkill[]): string {
  const l = (["en", "no", "de"].includes(lang) ? lang : "no") as MatrixLang;
  const lv = normalizeMatrixLevel(level);
  const rows = SKILLS_MATRIX[l][lv] as Record<string, { outcome: string; specific: string; evidence: string; errors: string; feedback: string }>;
  const parts = skills.filter((s) => rows[s]).map((s) => {
    const r = rows[s];
    return `[${s}] Očekivano: ${r.outcome} Jezički fokus: ${r.specific} Meri: ${r.evidence} Tipične greške: ${r.errors} Povratna informacija: ${r.feedback}`;
  });
  return [
    `NORSKLY STANDARD PROCENE (${lv}, ${l}) — ocenjuj samo prema ovom nivou; ne kažnjavaj strukture viših nivoa koje učenik još ne mora da zna.`,
    "Redosled procene: 1) izvršenje komunikativnog zadatka, 2) razumljivost, 3) raspon, 4) tačnost, 5) samostalnost.",
    "Tipovi grešaka: grammar, vocabulary, pronunciation, coherence, pragmatics, comprehension, orthography, task_completion. Težina: 1 = ne ometa razumevanje, 2 = privremeno otežava, 3 = sprečava izvršenje zadatka.",
    "Prioritet daj učestalim i komunikativno značajnim greškama (najviše 1–2 prioritetne korekcije). Ne određuj nivo na osnovu jednog zadatka.",
    LANG_RULE[l],
    ...parts,
  ].join("\n");
}
