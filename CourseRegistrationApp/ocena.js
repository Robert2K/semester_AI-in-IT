// GOTOWE — nie zmieniaj. Sprawdza, czy wyszukiwanie znajduje właściwy dokument dla pytań kontrolnych (bez AI, za darmo).
import { readFileSync } from 'node:fs';
import { wczytajDokumenty } from './src/fragmenty.js';
import { szukaj } from './src/szukaj.js';

const pytania = JSON.parse(readFileSync('pytania-kontrolne.json', 'utf8'));
const fragmenty = wczytajDokumenty('dokumenty');
let trafienia = 0;
for (const { pytanie, zrodlo } of pytania) {
  const wynik = szukaj(pytanie, fragmenty, 3);
  const ok = wynik.some(f => f.zrodlo === zrodlo);
  if (ok) trafienia++;
  console.log((ok ? 'OK   ' : 'BRAK ') + pytanie + '  →  ' + (wynik.map(f => f.id).join(', ') || 'nic') + (ok ? '' : '  (oczekiwano: ' + zrodlo + ')'));
}
console.log('\nTrafienia: ' + trafienia + '/' + pytania.length);
