

## Plan: Dodaj opciju kreiranja kolekcije iz generisanja reči

### Šta
U "Generiši" tabu, pored postojećeg dropdown-a za izbor kolekcije, dodati opciju "Kreiraj novu kolekciju" koja otvara inline dijalog za unos imena i opisa nove kolekcije. Nakon kreiranja, nova kolekcija se automatski selektuje u dropdown-u.

### Kako

**File: `src/pages/VocabularyPage.tsx` — `GenerateTab` komponenta**

1. Dodati state za kreiranje kolekcije: `showCreateDialog`, `newCollectionName`, `newCollectionDesc`, `creatingCollection`.

2. U `Select` dropdown (linija 271-281), dodati posebnu stavku na vrhu: "＋ Kreiraj novu kolekciju" sa vrednošću `"__create__"`.

3. U `onValueChange` handleru, ako je vrednost `"__create__"`, otvoriti `Dialog` za kreiranje umesto da se selektuje.

4. U `Dialog`-u prikazati `Input` za naziv i opcioni `Textarea` za opis, sa dugmetom "Kreiraj". Po kreiranju:
   - Insert u `word_collections` tabelu
   - Refreshovati listu kolekcija
   - Automatski selektovati novu kolekciju u dropdown-u

5. Prikazati dropdown za kolekcije **uvek** (ne samo kad `collections.length > 0`), jer korisnik sada može kreirati kolekciju direktno.

### Komponente za import
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` (već dostupni u projektu)
- `Plus` ikonica (već importovana)

