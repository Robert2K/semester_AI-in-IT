// Implementacja zgodna z sekcjami 2 i 4 SPEC.md.

export const STOP = ['ile', 'jak', 'czy', 'sie', 'nie', 'ale', 'oraz', 'dla', 'jest', 'sa', 'to', 'na', 'do', 'co', 'kto',
  'gdzie', 'kiedy', 'mam', 'moge', 'musze', 'jaki', 'jaka', 'jakie', 'przez', 'tak', 'lub', 'albo', 'mnie', 'jesli',
  'ktora', 'ktory', 'ktore'];

export const SYNONIMY = {
  laptop: ['komputer', 'przenosny'],
  wifi: ['internet'],
  nagrania: ['nagrywane'],
};

const ZAMIENNIKI = {
  ą: 'a',
  ć: 'c',
  ę: 'e',
  ł: 'l',
  ń: 'n',
  ó: 'o',
  ś: 's',
  ź: 'z',
  ż: 'z',
};
const STOP_ZBIOR = new Set(STOP);

export function normalizuj(tekst) {
  return tekst
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, znak => ZAMIENNIKI[znak])
    .split(/[^a-z0-9]+/)
    .filter(slowo => slowo.length >= 3 && !STOP_ZBIOR.has(slowo));
}

export function szukaj(pytanie, fragmenty, ile = 3) {
  const slowaPytania = [...new Set(normalizuj(pytanie))];
  if (slowaPytania.length === 0 || ile <= 0) return [];

  const rdzen = slowo => slowo.slice(0, 5);
  const zestawPytania = slowaPytania.map(slowo => {
    const wpisSynonimow = Object.entries(SYNONIMY)
      .find(([haslo]) => rdzen(haslo) === rdzen(slowo));
    const powiazane = wpisSynonimow?.[1] ?? [];
    return new Set([slowo, ...powiazane].map(rdzen));
  });

  return fragmenty
    .map((fragment, indeks) => {
      const slowaFragmentu = new Set(normalizuj(fragment.tekst).map(rdzen));
      const wynik = zestawPytania.reduce((suma, powiazane) =>
        suma + ([...powiazane].some(slowo => slowaFragmentu.has(slowo)) ? 1 : 0), 0);
      return { ...fragment, wynik, indeks };
    })
    .filter(fragment => fragment.wynik > 0)
    .sort((a, b) => b.wynik - a.wynik || a.indeks - b.indeks)
    .slice(0, ile)
    .map(({ indeks, ...fragment }) => fragment);
}
