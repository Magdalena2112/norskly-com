

## Redesign: Objašnjenja section — mini-lesson format

### Overview
Expand the grammar explanation system from 5 fields to 10 structured sections, updating both the AI prompt (edge function) and the frontend rendering (GrammarPage.tsx).

### Changes

**1. `supabase/functions/grammar-ai/index.ts` — explain_topic prompt**

Replace the current JSON schema with an expanded one:

```json
{
  "naslov": "Short title",
  "sazetak": "2-3 sentence quick summary",
  "definicija": "Detailed definition — what, why, when, logic",
  "formula": {
    "label": "Grammar pattern name",
    "pattern": "subject + har + past participle",
    "examples": ["Jeg har spist", "Hun har lest"]
  },
  "kada_se_koristi": ["bullet 1", "bullet 2", ...],
  "kada_se_ne_koristi": ["contrast/limit 1", ...],
  "poredjenje": {
    "title": "e.g. Preterit vs Perfekt",
    "left_label": "Preterit",
    "right_label": "Perfekt",
    "rows": [
      { "left": "Jeg spiste", "right": "Jeg har spist", "note": "..." }
    ]
  },
  "primeri": {
    "jednostavni": [{ "no": "...", "sr": "..." }],
    "iz_zivota": [{ "no": "...", "sr": "...", "kontekst": "..." }],
    "kontrastni": [{ "pogresno": "...", "tacno": "...", "objasnjenje": "..." }]
  },
  "tipicne_greske": [
    { "pogresno": "...", "tacno": "...", "objasnjenje": "..." }
  ],
  "mini_savet": "Memory trick or rule-of-thumb",
  "povezane_teme": ["topic 1", "topic 2"]
}
```

Update the prompt instructions to require all 10 sections, with guidance on depth and variety. If no comparison is relevant, AI returns `poredjenje: null`.

**2. `src/pages/GrammarPage.tsx` — ExplainTab UI**

Update `ExplainResult` interface to match the new schema. Redesign the rendering into 10 visually distinct sections:

1. **Title card** — accent background, bold title
2. **Summary** — highlighted card with 2-3 sentence overview (new)
3. **Detailed definition** — expandable/collapsible card with in-depth explanation
4. **Formula block** — visually distinct code-like card with grammar pattern (new)
5. **When used** — bullet list with BookOpen icon (new)
6. **When NOT used** — bullet list with AlertTriangle icon, different bg (new)
7. **Comparison table** — side-by-side table/grid layout, only shown when data exists (new)
8. **Examples** — accordion with 3 sub-sections (simple, real-life, contrastive) (expanded)
9. **Common mistakes** — improved with wrong/correct/explanation per item (keep + improve)
10. **Memory tip** — highlighted Lightbulb card (keep)
11. **Related topics** — clickable chips that trigger a new search (new)

UI approach:
- Use `Accordion` for longer sections (definition, examples) to keep it scannable
- Use a table element for comparison block
- Related topics render as `Button variant="outline"` chips that call `setQuery(topic); search()`
- Formula block uses `bg-muted font-mono` styling
- Clean visual hierarchy with numbered section headers and icons
- Mobile-responsive: comparison table scrolls horizontally on small screens

**3. Files affected**
- `supabase/functions/grammar-ai/index.ts` — expanded explain_topic prompt + JSON schema
- `src/pages/GrammarPage.tsx` — new `ExplainResult` interface + redesigned ExplainTab rendering (~100 lines replaced)

