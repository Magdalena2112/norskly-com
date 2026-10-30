// Turns onboarding answers (stored per language in language_profiles) into AI role instructions.
// AI never invents tasks: in Talk it plays the predefined role, in Writing it only corrects.

export type LearnerStyle = {
  learning_goal?: string | null;
  confidence_level?: number | null;
  preferred_tone?: string | null;
  course_type?: string | null;
};

const GOAL_LINES: Record<string, string> = {
  "svakodnevni život": "Cilj učenika je svakodnevni život: u povratnim informacijama naglasi tečnost, prirodan govorni jezik i praktičnu upotrebljivost.",
  "posao i karijera": "Cilj učenika je posao: u povratnim informacijama naglasi formalnost i profesionalne formulacije koje zvuče prirodno na poslu.",
  ispit: "Cilj učenika je ispit: u ispravkama precizno objasni gramatička pravila i strukture koje se boduju (red reči, veznici, oblici).",
  "rad sa pacijentima": "Cilj učenika je rad sa pacijentima: naglasi jasna, uljudna i empatična pitanja i razumljiva objašnjenja pacijentu.",
  "medicinska dokumentacija": "Cilj učenika je medicinska dokumentacija: naglasi stručne termine, preciznost i jasan pisani stil.",
  "komunikacija sa kolegama": "Cilj učenika je komunikacija sa kolegama: naglasi kratke, precizne profesionalne formulacije (vizite, primopredaja smene).",
  autorizacija: "Cilj učenika je autorizacija/ispit struke: precizno objasni pravila i stručne strukture koje se proveravaju.",
};

export function buildLearnerStyleLine(p: LearnerStyle | null | undefined): string {
  if (!p) return "";
  const lines: string[] = [];
  const goal = (p.learning_goal || "").toLowerCase().trim();
  if (GOAL_LINES[goal]) lines.push(GOAL_LINES[goal]);
  const c = Number(p.confidence_level);
  if (c >= 1 && c <= 2) lines.push("Samopouzdanje učenika je nisko (" + c + "/5): koristi kraće i jasnije rečenice, jedno pitanje odjednom, objašnjenja na srpskom deli u male korake i uvek prvo pohvali ono što je dobro.");
  else if (c >= 4) lines.push("Samopouzdanje učenika je visoko (" + c + "/5): koristi prirodan tempo i bogatiji jezik, postavljaj izazovnija potpitanja u okviru zadatka i ukaži i na stilske nijanse.");
  const tone = (p.preferred_tone || "").toLowerCase().trim();
  if (tone === "direktan") lines.push("Stil podrške: direktan i detaljan — jasno označi svaku grešku, navedi pravilo i ispravan primer.");
  else if (tone === "podržavajući") lines.push("Stil podrške: podržavajući i blag — fokus na smisao i ohrabrenje, ispravljaj samo najvažnije greške.");
  if (!lines.length) return "";
  return "PROFIL UČENIKA (ne menja zadatak ni ulogu, samo način komunikacije i povratnih informacija):\n- " + lines.join("\n- ");
}

/** Tone rules for short mistake explanations: style changes wording only, never the diagnosis. */
export function buildMistakeStyleLine(p: LearnerStyle | null | undefined): string {
  const tone = (p?.preferred_tone || "").toLowerCase().trim();
  const c = Number(p?.confidence_level);
  const lines: string[] = [];
  if (tone === "direktan") lines.push("Style: direct and detailed. Name the error category, state the rule precisely and contrast the student's form with the correct form. No softening phrases.");
  else lines.push("Style: supportive and gentle. Plain, calm wording without linguistic jargon; say what to change and how it sounds correctly. At most one short neutral reassurance, no exaggerated praise.");
  if (c >= 1 && c <= 2) lines.push("Learner confidence is low: use very short, simple sentences.");
  else if (c >= 4) lines.push("Learner confidence is high: you may mention one relevant nuance.");
  lines.push("Never invent scenarios, workplaces, colleagues or personal context; stay on the language fact. The diagnosis must stay identical whatever the style.");
  return lines.join(" ");
}

// deno-lint-ignore no-explicit-any
export async function loadLearnerStyle(supabase: any, userId: string, language: string, course: string = "general"): Promise<LearnerStyle | null> {
  try {
    const { data } = await supabase.from("course_enrollments")
      .select("learning_goal, confidence_level, preferred_tone, course_type")
      .eq("user_id", userId).eq("language", language)
      .eq("course_type", course === "health" ? "health" : "general").maybeSingle();
    return data ?? null;
  } catch { return null; }
}

// deno-lint-ignore no-explicit-any
export async function loadLearnerStyleLine(supabase: any, userId: string, language: string, course: string = "general"): Promise<string> {
  try {
    const { data } = await supabase
      .from("course_enrollments")
      .select("learning_goal, confidence_level, preferred_tone, course_type")
      .eq("user_id", userId)
      .eq("language", language)
      .eq("course_type", course === "health" ? "health" : "general")
      .maybeSingle();
    return buildLearnerStyleLine(data);
  } catch {
    return "";
  }
}
