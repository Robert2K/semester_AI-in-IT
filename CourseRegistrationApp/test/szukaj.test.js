// Testy to umowa: kod z Copilota ma je spełnić. Nie zmieniaj tego pliku.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizuj, szukaj } from '../src/szukaj.js';

test('normalizuj: małe litery, bez krótkich słów i słów z listy STOP', () => {
  assert.deepEqual(normalizuj('Ile kosztuje Warsztat z Gita?'), ['kosztuje', 'warsztat', 'gita']);
});

test('normalizuj: polskie znaki bez ogonków', () => {
  assert.deepEqual(normalizuj('Zażółć gęślą jaźń'), ['zazolc', 'gesla', 'jazn']);
});

const fragmenty = [
  { id: 'a.md#1', zrodlo: 'a.md', tekst: 'Pogoda na weekend będzie słoneczna.' },
  { id: 'b.md#1', zrodlo: 'b.md', tekst: 'Python w sobotę.' },
  { id: 'c.md#1', zrodlo: 'c.md', tekst: 'Warsztat Python kosztuje 20 zł.' },
  { id: 'd.md#1', zrodlo: 'd.md', tekst: 'Kurs Python online.' },
];

test('szukaj: najlepiej pasujący fragment jest pierwszy', () => {
  const wynik = szukaj('Ile kosztuje warsztat Python?', fragmenty);
  assert.equal(wynik[0].id, 'c.md#1');
  assert.equal(wynik[0].wynik, 3);
});

test('szukaj: remis zachowuje kolejność z wejścia, limit ile', () => {
  const wynik = szukaj('Python', fragmenty, 2);
  assert.deepEqual(wynik.map(f => f.id), ['b.md#1', 'c.md#1']);
});

test('szukaj: brak dopasowań daje pustą tablicę', () => {
  assert.deepEqual(szukaj('mundial piłkarski', fragmenty), []);
});

test('szukaj: nie zmienia fragmentów wejściowych', () => {
  szukaj('Python', fragmenty);
  assert.equal('wynik' in fragmenty[1], false);
});
