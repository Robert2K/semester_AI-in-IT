import { podzielNaFragmenty, wczytajDokumenty } from './fragmenty.js';
import { szukaj } from './szukaj.js';
import { zbudujPrompt, NIE_WIEM } from './prompt.js';
import { zapytajModel } from './model.js';
import { weryfikujZrodla } from './weryfikuj-zrodla.js';

export async function obsluzPytanie(pytanie, dokumentyWlasne = []) {
  const fragmentyWlasne = dokumentyWlasne.flatMap(({ nazwa, tekst }, indeks) =>
    podzielNaFragmenty(tekst, `wlasny-${indeks + 1}-${nazwa}`)
  );
  const znalezione = szukaj(pytanie, [...wczytajDokumenty('dokumenty'), ...fragmentyWlasne], 3);

  if (znalezione.length === 0) {
    return {
      odpowiedz: NIE_WIEM,
      zrodla: [],
      ostrzezenie: '',
    };
  }

  const odpowiedz = await zapytajModel(zbudujPrompt(pytanie, znalezione));
  const weryfikacja = weryfikujZrodla(odpowiedz, znalezione);

  return {
    odpowiedz,
    zrodla: znalezione.map(({ id, zrodlo, tekst }) => ({ id, zrodlo, tekst })),
    ostrzezenie: weryfikacja.ostrzezenie,
  };
}
