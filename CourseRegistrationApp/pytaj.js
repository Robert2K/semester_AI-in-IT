// GOTOWE — nie zmieniaj. Użycie: npm run pytaj -- "Ile kosztuje warsztat?"
import { wczytajDokumenty } from './src/fragmenty.js';
import { szukaj } from './src/szukaj.js';
import { zbudujPrompt, NIE_WIEM } from './src/prompt.js';
import { zapytajModel, MODEL } from './src/model.js';
import { weryfikujZrodla } from './src/weryfikuj-zrodla.js';

const pytanie = process.argv.slice(2).join(' ').trim();
if (!pytanie) {
  console.log('Podaj pytanie, np.: npm run pytaj -- "Ile kosztuje warsztat?"');
  process.exit(1);
}

const znalezione = szukaj(pytanie, wczytajDokumenty('dokumenty'), 3);
console.log('\nPytanie: ' + pytanie);
console.log('Znalezione fragmenty: ' + (znalezione.map(f => f.id + ' (' + f.wynik + ')').join(', ') || 'brak'));

if (znalezione.length === 0) {
  console.log('\n' + NIE_WIEM + '\n(bez wywołania modelu: nic nie pasowało, więc nie płacimy za zapytanie)\n');
} else {
  console.log('\nŹródła przekazane modelowi:');
  for (const fragment of znalezione) {
    console.log('- [' + fragment.id + ']');
  }

  const odpowiedz = await zapytajModel(zbudujPrompt(pytanie, znalezione));
  const weryfikacja = weryfikujZrodla(odpowiedz, znalezione);
  console.log('\nModel: ' + (process.env.OLLAMA_MODEL || MODEL) + '\n\n' + odpowiedz);
  console.log(weryfikacja.ostrzezenie
    ? '\n⚠ ' + weryfikacja.ostrzezenie
    : '\nWeryfikacja źródeł: cytowania wskazują na przekazane fragmenty.');
  console.log('Uwaga: sprawdzenie cytowań nie potwierdza prawdziwości treści odpowiedzi.\n');
}
