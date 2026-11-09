// Implementacja zgodna z sekcją 1 SPEC.md.
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

export function podzielNaFragmenty(tekst, zrodlo) {
  const bloki = tekst.replace(/\r\n/g, '\n').split(/\n[ \t]*\n+/);
  const fragmenty = [];

  for (const blok of bloki) {
    const oczyszczony = blok.trim();
    if (!oczyszczony) continue;

    const linie = oczyszczony.split('\n');
    if (linie.every(linia => linia.trimStart().startsWith('#'))) continue;

    fragmenty.push({
      id: `${zrodlo}#${fragmenty.length + 1}`,
      zrodlo,
      tekst: oczyszczony,
    });
  }

  return fragmenty;
}

export function wczytajDokumenty(folder) {
  const pliki = readdirSync(folder, { withFileTypes: true })
    .filter(wpis => wpis.isFile() && extname(wpis.name) === '.md')
    .map(wpis => wpis.name)
    .sort();

  return pliki.flatMap(nazwa =>
    podzielNaFragmenty(readFileSync(join(folder, nazwa), 'utf8'), nazwa)
  );
}
