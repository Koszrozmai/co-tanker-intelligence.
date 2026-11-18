# Własne wdrożenie CO Tanker Intelligence 1.6

Do korzystania z gotowej prywatnej aplikacji wystarczy otworzyć adres z pliku START_v1.6_PL.md. Ta instrukcja dotyczy osobnej kopii na własnym hostingu.

## GitHub Actions i Pages

1. Utwórz repozytorium z dostępem do GitHub Actions i Pages. Rozpakuj wydanie zbiorcze. Umieść katalogi **.github**, **agent** i **docs** w katalogu głównym repozytorium, razem na gałęzi domyślnej. Zapisz pliki w repozytorium.
2. Otwórz **Settings → Pages → Build and deployment**. W obszarze **Source** wybierz **GitHub Actions**. W ustawieniach organizacji lub repozytorium potrzebne są uprawnienia workflow do zapisania historii kanału oraz wdrożenia Pages.
3. Otwórz kartę **Actions**, wybierz **CO Tanker Intelligence — Scheduled Public-Source Watch** i uruchom **Run workflow** z gałęzi domyślnej. Sprawdź wynik kroków pobierania i publikowania oraz adres strony podany w zadaniu deployment.
4. Otwórz opublikowaną stronę. Jej kanał znajduje się pod adresem strony z dopisanym **/data/intelligence.json**. W rozszerzeniu Chrome wklej ten adres w **Always-On Watch → Feed connection → Connect feed**.
5. Datę rzeczywistego ostatniego przebiegu sprawdzisz w **Watch briefing** oraz w historii **Actions**. Workflow próbuje pobierać publiczne indeksy co trzy godziny. Wyniki tego kolektora mają status odsyłaczy do przeglądu i odrębne ćwiczenia badawcze. Prywatny Watch wykorzystuje dodatkowo odczyt treści źródeł i quizy przygotowane na ich podstawie.

Własna kopia PWA może być też serwowana jako statyczna zawartość folderu **docs** na HTTPS. Dowolny operator hostingu może wymagać zalogowania lub odpowiedniego planu dla swoich usług. Do testu bez hostingu otwórz pojedynczy plik HTML.

## Pliki serwerowe i testy

**agent/collector.py** i **.github/workflows/collect.yml** obsługują wariant GitHub. W środowisku Python 3.11 lub nowszym zainstaluj zależności z **agent/requirements.txt**. Uruchom testy przez `python -m unittest discover -s agent`. Polecenie `node --test agent/test_watch.mjs` sprawdza logikę prywatnego kanału w środowisku Node 22 lub nowszym.

Folder **server** zawiera źródła obsługujące prywatny interfejs do zapisu. Do uruchomienia tego wariantu potrzebne są uwierzytelnianie dostępu właściciela, prywatny magazyn obiektowy zgodny z R2 oraz zadanie z dostępem serwisowym opisane w **agent/RESEARCH_RUNBOOK.md**. Klucze i tokeny są nadawane przez środowisko wdrożeniowe.

Polecenie `node server/build.mjs` buduje plik `server/dist/server/index.js` z kodu aplikacji. Endpoint zapisu wymaga prywatnej usługi z kontrolą dostępu na poziomie hostingu. [Konfiguracja publikacji GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
