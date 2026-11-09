export function weryfikujZrodla(odpowiedz, fragmenty) {
  const dostepneZrodla = new Set(fragmenty.map(fragment => fragment.id));
  const tekst = odpowiedz.replace(
    /([.!?])(\s*(?:\[[a-z0-9._-]+\.(?:md|pdf|docx?|odt|docm|dotx|xlsx?|xlsm|png|bmp|jpg|txt)#\d+\]\s*)+)/gi,
    '$2$1'
  );
  const zdania = tekst
    .split(/(?<=[.!?])\s+|\n+/u)
    .map(zdanie => zdanie.trim())
    .filter(Boolean);
  const zdaniaBezZrodla = [];
  const cytowania = [];

  for (const [indeks, zdanie] of zdania.entries()) {
    if (zdanie === 'Nie wiem — nie ma tego w dokumentach Koła.') continue;

    const cytowaniaZdania = [...zdanie.matchAll(/\[([a-z0-9._-]+\.(?:md|pdf|docx?|odt|docm|dotx|xlsx?|xlsm|png|bmp|jpg|txt)#\d+)\]/gi)]
      .map(([, zrodlo]) => zrodlo);
    if (cytowaniaZdania.length === 0) {
      zdaniaBezZrodla.push(indeks + 1);
    } else {
      cytowania.push(...cytowaniaZdania);
    }
  }

  const unikalneCytowania = [...new Set(cytowania)];
  const nieznaneZrodla = unikalneCytowania.filter(zrodlo => !dostepneZrodla.has(zrodlo));

  const powody = [];
  if (zdaniaBezZrodla.length > 0) {
    powody.push(`brak źródła przy ${zdaniaBezZrodla.length} zdaniu/zdaniach`);
  }
  if (nieznaneZrodla.length > 0) {
    powody.push(`cytowanie fragmentu spoza przekazanych: ${nieznaneZrodla.join(', ')}`);
  }
  const ostrzezenie = powody.length
    ? `Możliwa halucynacja: ${powody.join('; ')}.`
    : '';

  return { cytowania: unikalneCytowania, nieznaneZrodla, zdaniaBezZrodla, ostrzezenie };
}
