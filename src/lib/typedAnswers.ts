/** Formatting tolerance for typed answers, never semantic or grammatical guessing.
 * Ambiguous contractions ('s / 'd) deliberately remain unchanged.
 */
export function normalizeTypedAnswer(value: string, exactForm = false): string {
  let text = value.normalize("NFC").replace(/[’‘`´]/g, "'").trim();
  if (exactForm) return text.replace(/\s+/g, " ");
  text = text.toLowerCase()
    .replace(/\bcan't\b/g, "cannot")
    .replace(/\bcan not\b/g, "cannot")
    .replace(/\bwon't\b/g, "will not")
    .replace(/\bshan't\b/g, "shall not")
    .replace(/\b([a-z]+)n't\b/g, "$1 not")
    .replace(/\bi'm\b/g, "i am")
    .replace(/\b(i|you|we|they)'re\b/g, "$1 are")
    .replace(/\b(i|you|we|they)'ve\b/g, "$1 have")
    .replace(/\b(i|you|he|she|it|we|they)'ll\b/g, "$1 will");
  return text.replace(/[–—]/g, "-")
    .replace(/[.,!?;:"“”„]/g, "")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ").trim();
}

export function matchesTypedAnswer(value: string, answers: readonly string[], exactForm = false): boolean {
  const normalized = normalizeTypedAnswer(value, exactForm);
  return normalized.length > 0 && answers.some(answer => normalizeTypedAnswer(answer, exactForm) === normalized);
}