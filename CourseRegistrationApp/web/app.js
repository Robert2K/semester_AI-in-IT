const formularz = document.querySelector('#formularz');
const polePytania = document.querySelector('#pytanie');
const przycisk = document.querySelector('#wyslij');
const poleDokumentow = document.querySelector('#dokumenty');
const listaDokumentow = document.querySelector('#lista-dokumentow');
const status = document.querySelector('#status');
const blad = document.querySelector('#blad');
const wynik = document.querySelector('#wynik');
const odpowiedz = document.querySelector('#odpowiedz');
const ostrzezenie = document.querySelector('#ostrzezenie');
const listaZrodel = document.querySelector('#zrodla');
const brakZrodel = document.querySelector('#brak-zrodel');
const dozwoloneRozszerzenia = [
  '.pdf', '.doc', '.docx', '.odt', '.docm', '.dotx', '.xls', '.xlsx', '.xlsm',
  '.png', '.bmp', '.jpg', '.txt',
];
let dokumentyWlasne = [];

formularz.addEventListener('submit', async zdarzenie => {
  zdarzenie.preventDefault();
  const pytanie = polePytania.value.trim();
  if (!pytanie) {
    polePytania.focus();
    return;
  }

  przycisk.disabled = true;
  status.textContent = 'Szukam odpowiedzi w dokumentach…';
  blad.hidden = true;
  wynik.hidden = true;

  try {
    const daneFormularza = new FormData();
    daneFormularza.append('pytanie', pytanie);
    for (const plik of dokumentyWlasne) {
      daneFormularza.append('dokumenty', plik, plik.name);
    }

    const odpowiedzApi = await fetch('/api/pytaj', {
      method: 'POST',
      body: daneFormularza,
    });

    let dane;
    try {
      dane = await odpowiedzApi.json();
    } catch {
      throw new Error('Serwer zwrócił odpowiedź, której nie udało się odczytać.');
    }
    if (!odpowiedzApi.ok) {
      throw new Error(dane.blad || 'Nie udało się uzyskać odpowiedzi.');
    }

    odpowiedz.textContent = dane.odpowiedz;
    ostrzezenie.textContent = dane.ostrzezenie || '';
    ostrzezenie.hidden = !dane.ostrzezenie;
    listaZrodel.replaceChildren();

    for (const zrodlo of dane.zrodla) {
      const element = document.createElement('li');
      const identyfikator = document.createElement('span');
      identyfikator.className = 'zrodlo-id';
      identyfikator.textContent = `[${zrodlo.id}]`;
      const tekst = document.createElement('p');
      tekst.className = 'zrodlo-tekst';
      tekst.textContent = zrodlo.tekst;
      element.append(identyfikator, tekst);
      listaZrodel.append(element);
    }

    brakZrodel.hidden = dane.zrodla.length > 0;
    wynik.hidden = false;
    status.textContent = 'Gotowe.';
  } catch (bladZapytania) {
    blad.textContent = bladZapytania.message;
    blad.hidden = false;
    status.textContent = '';
  } finally {
    przycisk.disabled = false;
  }
});

poleDokumentow.addEventListener('change', () => {
  const wybrane = [...poleDokumentow.files];
  const nieprawidlowy = wybrane.find(plik => {
    const rozszerzenie = plik.name.slice(plik.name.lastIndexOf('.')).toLowerCase();
    return plik.size > 10_000_000 || !dozwoloneRozszerzenia.includes(rozszerzenie);
  });

  if (nieprawidlowy) {
    const rozszerzenie = nieprawidlowy.name.slice(nieprawidlowy.name.lastIndexOf('.')).toLowerCase();
    blad.textContent = nieprawidlowy.size > 10 * 1024 * 1024
      ? `Plik ${nieprawidlowy.name} przekracza maksymalny rozmiar 10 MB.`
      : `Typ pliku ${rozszerzenie || '(brak rozszerzenia)'} nie jest dozwolony.`;
    blad.hidden = false;
  } else {
    blad.hidden = true;
    for (const plik of wybrane) {
      const duplikat = dokumentyWlasne.some(dodany =>
        dodany.name === plik.name && dodany.size === plik.size && dodany.lastModified === plik.lastModified
      );
      if (!duplikat) dokumentyWlasne.push(plik);
    }
  }

  poleDokumentow.value = '';
  listaDokumentow.replaceChildren();
  for (const [indeks, plik] of dokumentyWlasne.entries()) {
    const pozycja = document.createElement('li');
    const rozmiar = (plik.size / 1_000_000).toFixed(2);
    const opis = document.createElement('span');
    opis.textContent = `${plik.name} (${rozmiar} MB)`;
    const usun = document.createElement('button');
    usun.type = 'button';
    usun.className = 'usun-dokument';
    usun.textContent = 'Usuń';
    usun.setAttribute('aria-label', `Usuń plik ${plik.name}`);
    usun.addEventListener('click', () => {
      dokumentyWlasne = dokumentyWlasne.filter((_, numer) => numer !== indeks);
      poleDokumentow.dispatchEvent(new Event('change'));
    });
    pozycja.append(opis, usun);
    listaDokumentow.append(pozycja);
  }
});
