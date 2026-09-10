# Nova slika za pretpregled linka

## Cilj
Postaviti sliku koju si upravo poslala kao sliku koja se prikazuje kada neko podeli link ka norskly.com.

## Šta ću uraditi
1. Pripremiti poslatu sliku u formatu 1200×630 px (standard za Facebook, LinkedIn, X, WhatsApp), JPG, ispod ~200 KB, uz blago kadriranje da ništa važno ne bude odsečeno.
2. Postaviti je kao novu sliku za deljenje i zameniti trenutnu.
3. Ukloniti staru sliku za deljenje koja se više neće koristiti.
4. Proveriti da se nova slika stvarno nalazi u objavljenim stranicama.
5. Objaviti sajt kako bi promena bila vidljiva na norskly.com.

## Šta se ne menja
- Izgled, tekst i funkcionalnost sajta.
- Naslovi, opisi, canonical oznake, sitemap, robots.txt.
- Ikonica sajta (favicon).

## Tehnički detalji
- Slika se otprema kao CDN asset i referencira apsolutnim `https://norskly.com/__l5e/...` URL-om.
- Ažuriraju se `og:image`, `og:image:secure_url`, `og:image:type`, širina/visina i `twitter:image` u `index.html`.
- Stari asset `social-preview.jpg` briše se preko `lovable-assets delete`; neiskorišćeni `social-preview.webp` takođe.
- Društvene mreže mogu još neko vreme prikazivati staru sliku dok ponovo ne pročitaju link.
