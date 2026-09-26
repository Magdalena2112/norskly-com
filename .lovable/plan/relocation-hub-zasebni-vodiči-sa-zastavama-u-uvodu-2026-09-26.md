# Relocation Hub: zasebni vodiči sa zastavama u uvodu

## Šta ćeš dobiti
- `/relocation-hub` ostaje jednostavna ulazna stranica za izbor zemlje. Kartice vode na zasebne adrese `/relocation-hub/norveska` i `/relocation-hub/nemacka`.
- Svaka zemlja dobija svoj naslovni deo: naziv zemlje, kratak uvod i postojeće oznake za državljane Srbije, zvanične izvore i datum provere. U pozadini tog dela je samo zastava izabrane zemlje, diskretno vidljiva iza teksta, sa mekim prelivanjem u postojeću pozadinu stranice. Ostatak vodiča ostaje čist i čitljiv.
- Između vodiča i stranice za izbor zemlje može se jasno navigirati. Postojeći linkovi sa početne stranice i iz menija i dalje vode na izbor zemlje.
- Stari linkovi sa `?zemlja=norveska` i `?zemlja=nemacka` nastavljaju da otvaraju odgovarajući vodič na novoj adresi, bez gubitka postojeće funkcionalnosti.

## Tehnički detalji
- Iskoristiti postojeći zajednički prikaz osam koraka i zasebne module sadržaja po zemlji; ne duplirati vodiče niti mešati informacije.
- Zastave tretirati kao dekoraciju u pozadini uvoda, sa pristupačnim kontrastom teksta i blagim prelazom ka `background` tokenu; bez zastava u sadržaju koraka.
- Datum provere zadržati nezavisnim po zemlji u postojećoj komponenti oznaka. Metapodaci naslovnih strana biće specifični za zemlju, bez menjanja drugih stranica.
- Proveriti direktan ulazak na obe adrese, stare linkove, izbor zemlje, prikaz na telefonu i računaru, kao i prelaz od uvoda ka koracima.
