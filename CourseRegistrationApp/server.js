import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { obsluzPytanie } from './src/obsluz-pytanie.js';

const ADRES = '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);
const MAKSYMALNY_ROZMIAR_ZAPYTANIA = 100 * 1024 * 1024;
const MAKSYMALNY_ROZMIAR_PLIKU = 10_000_000;
const DOZWOLONE_ROZSZERZENIA = new Set([
  '.pdf', '.doc', '.docx', '.odt', '.docm', '.dotx', '.xls', '.xlsx', '.xlsm',
  '.png', '.bmp', '.jpg', '.txt',
]);
const PLIKI = {
  '/': ['web/index.html', 'text/html; charset=utf-8'],
  '/style.css': ['web/style.css', 'text/css; charset=utf-8'],
  '/app.js': ['web/app.js', 'text/javascript; charset=utf-8'],
};

function odpowiedz(res, status, typ, tresc) {
  res.writeHead(status, {
    'content-type': typ,
    'x-content-type-options': 'nosniff',
    'cache-control': 'no-store',
  });
  res.end(tresc);
}

function odpowiedzJson(res, status, dane) {
  odpowiedz(res, status, 'application/json; charset=utf-8', JSON.stringify(dane));
}

async function odczytajCialo(req, limit = MAKSYMALNY_ROZMIAR_ZAPYTANIA) {
  const kawalki = [];
  let rozmiar = 0;

  for await (const kawalek of req) {
    rozmiar += kawalek.length;
    if (rozmiar > limit) {
      const blad = new Error('Zapytanie lub załączniki przekraczają łączny limit 100 MB.');
      blad.status = 413;
      throw blad;
    }
    kawalki.push(kawalek);
  }

  return Buffer.concat(kawalki);
}

function odczytajMultipart(cialo, boundary) {
  const granica = Buffer.from(`--${boundary}`);
  const separatorNaglowkow = Buffer.from('\r\n\r\n');
  const separatorPartu = Buffer.from(`\r\n--${boundary}`);
  const pola = [];
  let pozycja = cialo.indexOf(granica);

  while (pozycja !== -1) {
    pozycja += granica.length;
    if (cialo.subarray(pozycja, pozycja + 2).toString() === '--') break;
    if (cialo.subarray(pozycja, pozycja + 2).toString() !== '\r\n') break;
    pozycja += 2;

    const koniecNaglowkow = cialo.indexOf(separatorNaglowkow, pozycja);
    if (koniecNaglowkow === -1) break;
    const naglowki = cialo.subarray(pozycja, koniecNaglowkow).toString('latin1');
    const poczatekDanych = koniecNaglowkow + separatorNaglowkow.length;
    const koniecDanych = cialo.indexOf(separatorPartu, poczatekDanych);
    if (koniecDanych === -1) break;

    const dyspozycja = naglowki.match(/content-disposition:\s*form-data;([^\r\n]+)/i)?.[1] ?? '';
    const nazwa = dyspozycja.match(/(?:^|;)\s*name="([^"]*)"/i)?.[1];
    const plik = dyspozycja.match(/(?:^|;)\s*filename="([^"]*)"/i)?.[1];
    pola.push({
      nazwa,
      nazwaPliku: plik,
      dane: cialo.subarray(poczatekDanych, koniecDanych),
    });
    pozycja = koniecDanych + 2;
  }

  return pola;
}

const serwer = createServer(async (req, res) => {
  const adres = new URL(req.url, `http://${ADRES}`);

  if (req.method === 'GET' && Object.hasOwn(PLIKI, adres.pathname)) {
    const [sciezka, typ] = PLIKI[adres.pathname];
    try {
      const tresc = await readFile(new URL(sciezka, import.meta.url));
      odpowiedz(res, 200, typ, tresc);
    } catch (blad) {
      console.error('Nie można odczytać pliku interfejsu:', blad);
      odpowiedz(res, 500, 'text/plain; charset=utf-8', 'Nie można wczytać interfejsu.');
    }
    return;
  }

  if (adres.pathname === '/api/pytaj') {
    if (req.method !== 'POST') {
      res.setHeader('allow', 'POST');
      odpowiedzJson(res, 405, { blad: 'Ta ścieżka przyjmuje tylko zapytania POST.' });
      return;
    }

    const typTresci = req.headers['content-type'] ?? '';
    const multipart = typTresci.match(/^multipart\/form-data;\s*boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!multipart) {
      odpowiedzJson(res, 415, { blad: 'Wyślij pytanie oraz dokumenty jako formularz.' });
      return;
    }

    try {
      const granica = (multipart[1] ?? multipart[2]).trim();
      const cialo = await odczytajCialo(req);
      const pola = odczytajMultipart(cialo, granica);
      const pytaniePole = pola.find(pole => pole.nazwa === 'pytanie');
      const pytanie = pytaniePole?.dane.toString('utf8').trim() ?? '';
      if (!pytanie) {
        odpowiedzJson(res, 400, { blad: 'Wpisz pytanie.' });
        return;
      }
      if (pytanie.length > 1000) {
        odpowiedzJson(res, 400, { blad: 'Pytanie może mieć maksymalnie 1000 znaków.' });
        return;
      }

      const pliki = pola.filter(pole => pole.nazwa === 'dokumenty' && pole.nazwaPliku);
      const dokumentyWlasne = [];
      for (const [indeks, plik] of pliki.entries()) {
        const nazwa = plik.nazwaPliku.split(/[\\/]/).pop();
        const rozszerzenie = nazwa.slice(nazwa.lastIndexOf('.')).toLowerCase();
        if (!DOZWOLONE_ROZSZERZENIA.has(rozszerzenie)) {
          odpowiedzJson(res, 415, { blad: `Nieobsługiwany typ pliku: ${nazwa}.` });
          return;
        }
        if (plik.dane.length > MAKSYMALNY_ROZMIAR_PLIKU) {
          odpowiedzJson(res, 413, { blad: `Plik ${nazwa} przekracza maksymalny rozmiar 10 MB.` });
          return;
        }
        if (rozszerzenie !== '.txt') {
          odpowiedzJson(res, 415, {
            blad: `${nazwa} ma dozwolone rozszerzenie, ale odczyt tego formatu nie jest jeszcze dostępny. Na razie można używać dokumentów TXT.`,
          });
          return;
        }

        let tekst;
        try {
          tekst = new TextDecoder('utf-8', { fatal: true }).decode(plik.dane);
        } catch {
          odpowiedzJson(res, 400, { blad: `Nie udało się odczytać pliku ${nazwa} jako tekstu UTF-8.` });
          return;
        }
        dokumentyWlasne.push({ nazwa: `dokument-${indeks + 1}.txt`, tekst });
      }

      odpowiedzJson(res, 200, await obsluzPytanie(pytanie, dokumentyWlasne));
    } catch (blad) {
      if (blad.status === 413) {
        odpowiedzJson(res, 413, { blad: blad.message });
        return;
      }

      console.error('Nie udało się obsłużyć pytania:', blad);
      odpowiedzJson(res, 502, {
        blad: 'Nie udało się uzyskać odpowiedzi. Sprawdź połączenie z modelem i jego konfigurację.',
      });
    }
    return;
  }

  odpowiedzJson(res, 404, { blad: 'Nie znaleziono tej strony.' });
});

serwer.listen(PORT, ADRES, () => {
  console.log(`Asystent Koła działa pod adresem http://${ADRES}:${PORT}`);
});

serwer.on('error', blad => {
  console.error('Nie udało się uruchomić serwera:', blad);
  process.exitCode = 1;
});
