# Relocation Hub: dugme na početnoj strani + stavka u glavnom meniju

## Stanje koje je provereno

- Dugme „Istraži Relocation Hub” u Relocation Hub delu početne stranice **već vodi** na stranicu Relocation Hub. U pregledu je klik testiran: adresa se menja u `/relocation-hub` i otvar se naslov „Relocation Hub”. Razlog što ga na pravom sajtu još ne vidiš je što poslednje izmene početne stranice **još nisu objavljene**.
- Glavni meni na vrhu početne stranice trenutno ima: Platforma, Za učenike, Za profesore, Kako učiš, FAQ. Stavka za Relocation Hub **ne postoji**.

## Šta se radi

1. **Nova stavka u glavnom meniju** — „Relocation Hub”, pozicionirana između „Platforma” i „Za učenike”, sa linkom na stranicu Relocation Hub. Vizuelno potpuno isto kao ostale stavke menija (isti font, boja, pomeranje boje pri prelazu mišem), bez ikakvog novog stila.
2. **Dugme na početnoj strani ostaje kako jeste** — već je ispravno povezano; samo se proverava da i dalje radi.
3. **Provera širine menija** — meniju se dodaje šesta stavka, pa se gleda da li sve staje na najužem desktop prikazu (768px). Ako je tesno, razmak između stavki se malo smanjuje na najužim širinama (na većim ostaje isti), bez drugih izmena.
4. **Provera rada** — provera koda i izgradnje, pa test u pregledu na računaru (1280×1800) i telefonu (390×844): klik na novu stavku otvar stranicu, dugme „Nazad / Norskly” sa stranice vraća na početnu, ništa ne prelazi preko ivice ekrana.

## Napomene (ono što se ne menja)

- Na telefonu meni sa tekstualnim stavkama ne postoji (vidljivi su samo logo i dugmad) — to se ne menja.
- Stranica Relocation Hub i dalje **nije** u listi za Google (sitemap) i nema sopstvenu objavljenu verziju. Pošto sada postaje dostupna iz glavnog menija, pretraživači će moći da je pronađu. Ako želiš da se to sredi (sitemap + naslov i opis te stranice), to radimo kao poseban korak.
- Stavka „Za profesore” u meniju trenutno otvara isti deo stranice kao „Za učenike”. To je postojeće stanje i ne diramo ga, osim ako ne tražiš da vodi na stranicu za profesore.

## Tehnički detalji

- Jedina promenjena datoteka: `src/pages/LandingPage.tsx` (blok menija, redovi 120–137).
- Nova stavka koristi `Link` (već je uvezen u toj datoteci) umesto običnog `href`, sa istom klasom koju korise susedne stavke: `className="hover:text-primary transition-colors"`, redosled: Platforma → **Relocation Hub** → Za učenike → Za profesore → Kako učiš → FAQ.
- Razmak u meniju je `gap-8`; ako test na 768px pokaže pretrpanost, menja se u `gap-5 lg:gap-8`.
- SEO metadata, naslovi, kanonički linkovi i sadržaj ostalih sekcija se ne dodiruju.
