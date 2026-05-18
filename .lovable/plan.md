## Cilj

U gornjoj navigaciji dodati link "Za učenike" pored postojećeg "Za profesore" i da vodi na sekciju ekosistema (gde se nalaze obe kartice: Za studente / Za profesore).

## Izmena

U `src/pages/LandingPage.tsx` (NAV, oko linije 119–122):

- Dodati nov `<a>` link **"Za učenike"** ispred "Za profesore".
- Oba linka vode na istu sekciju (`#teachers`), jer ona već sadrži obe strane ekosistema. Anchor ostaje `#teachers` da ne pravimo dvostruke id-jeve i postojeći link nastavlja da radi.
- Redosled u navu: Platforma · **Za učenike** · Za profesore · Kako učiš · FAQ.

Bez dodatnih izmena u sekciji ili stilovima — koristi se isti `text-sm font-medium hover:text-primary` stil kao ostali nav linkovi.

## Šta NIJE u opsegu

- Razdvajanje ekosistem sekcije na dva odvojena bloka/anchora.
- Promene u mobilnom meniju (ne postoji eksplicitan mobile menu trenutno; linkovi su `hidden md:flex`).