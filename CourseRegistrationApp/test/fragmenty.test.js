// Testy to umowa: kod z Copilota ma je spełnić. Nie zmieniaj tego pliku.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { podzielNaFragmenty, wczytajDokumenty } from '../src/fragmenty.js';

test('dzieli tekst na fragmenty po pustych liniach', () => {
  const wynik = podzielNaFragmenty('Pierwszy akapit.\n\nDrugi akapit.', 'x.md');
  assert.deepEqual(wynik, [
    { id: 'x.md#1', zrodlo: 'x.md', tekst: 'Pierwszy akapit.' },
    { id: 'x.md#2', zrodlo: 'x.md', tekst: 'Drugi akapit.' },
  ]);
});

test('pomija same nagłówki i puste bloki, numeruje bez dziur', () => {
  const tekst = '# Tytuł\n\n## Opłaty\nWarsztat kosztuje 20 zł.\n\n\n\n   \n\nOstatni blok.';
  const wynik = podzielNaFragmenty(tekst, 'r.md');
  assert.equal(wynik.length, 2);
  assert.equal(wynik[0].id, 'r.md#1');
  assert.equal(wynik[0].tekst, '## Opłaty\nWarsztat kosztuje 20 zł.');
  assert.equal(wynik[1].id, 'r.md#2');
  assert.equal(wynik[1].tekst, 'Ostatni blok.');
});

test('radzi sobie z końcami linii z Windowsa (\r\n)', () => {
  const wynik = podzielNaFragmenty('Jeden.\r\n\r\nDwa.\r\n', 'w.md');
  assert.deepEqual(wynik.map(f => f.tekst), ['Jeden.', 'Dwa.']);
});

test('pusty tekst daje pustą tablicę', () => {
  assert.deepEqual(podzielNaFragmenty('', 'p.md'), []);
});

test('wczytuje wszystkie dokumenty Koła w kolejności alfabetycznej', () => {
  const fragmenty = wczytajDokumenty('dokumenty');
  const pliki = [...new Set(fragmenty.map(f => f.zrodlo))];
  assert.deepEqual(pliki, ['faq.md', 'opinie-uczestnikow.md', 'regulamin.md', 'sprzet-i-sala.md', 'warsztaty.md']);
  for (const f of fragmenty) {
    assert.match(f.id, /^[a-z-]+\.md#\d+$/);
    assert.ok(f.tekst.length > 0);
  }
  assert.ok(fragmenty.some(f => f.tekst.includes('20 zł')), 'brak fragmentu o opłacie 20 zł');
});
