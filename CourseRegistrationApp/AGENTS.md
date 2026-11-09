# Zasady projektu: Asystent Koła

Ten plik czytają agenci AI (Copilot w VS Code, Codex, OpenCode) przy każdym poleceniu.

## Projekt
- Node.js 24, moduły ES (`import`/`export`), bez TypeScriptu.
- Specyfikacja jest w `SPEC.md`. Rób dokładnie to, co w niej opisano — nie dodawaj funkcji, o które nikt nie prosił.
- Testy uruchamia `npm test`. Po każdej zmianie uruchom testy i pokaż wynik.

## Granice
- Nie instaluj nowych bibliotek. Tylko moduły wbudowane w Node (`node:fs`, `node:path`, `node:test`, `node:assert`).
- **Nie zmieniaj plików w `test/`, `pytania-kontrolne.json`, `src/model.js`, `pytaj.js`, `ocena.js`.** Jeśli test wydaje się błędny, napisz to zamiast go poprawiać.
- Zmieniaj tylko plik wskazany w poleceniu.
- Nie czytaj i nie wypisuj pliku `.env`. Nigdy nie wpisuj kluczy API do kodu.

## Styl
- Nazwy funkcji i zmiennych po polsku, jak w istniejącym kodzie. Krótkie komentarze tylko tam, gdzie kod nie jest oczywisty.
