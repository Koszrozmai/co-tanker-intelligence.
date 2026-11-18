# CO Tanker Intelligence 1.6

**Najprostszy start na statku:** otwórz prywatną aplikację na komputerze lub Samsungu i wybierz **Watch briefing**. Publikacje i quizy są po angielsku. Przy pierwszym otwarciu potrzebujesz internetu i dostępu do własnego konta ChatGPT.

https://co-tanker-intelligence-watch.koszykrozmaity.chatgpt.site/#watch

## Samsung lub komputer

1. Otwórz powyższy adres w Chrome. Jeśli pojawi się logowanie, wybierz konto, do którego należy aplikacja.
2. Na Samsungu otwórz menu przeglądarki i wybierz **Dodaj do ekranu głównego** lub **Zainstaluj aplikację**, jeśli przeglądarka pokaże tę opcję.
3. Przed wyjściem z zasięgu otwórz Watch online, a następnie sprawdź ponowne otwarcie bez internetu. Do użycia na komputerze statkowym bez instalacji służy także plik **CO_Tanker_Intelligence_Offline_v1.6.html**. Otwórz go bezpośrednio w przeglądarce. Ma osadzone publikacje, quizy, checklisty, planner i formularz backupu.
4. W widoku **Watch briefing** masz datę ostatniego zapisu serwera w UTC i osobno daty poszczególnych publikacji. W **Source health** sprawdzisz dostęp do każdego źródła. Filtr **Since last visit** zaczyna porównywać po pierwszej udanej synchronizacji na tym urządzeniu.
5. Otwórz tytuł, żeby przeczytać publikację u wydawcy. **Mark reviewed** zapisuje przeczytanie na urządzeniu. Przy zmianie publikacja pojawi się do ponownego przeglądu. Wnioski dla konkretnego statku zatwierdza oficer.

## Rozszerzenie Chrome na Windows

1. W starszej wersji otwórz **Sources & settings → Export backup** i zachowaj plik JSON.
2. Rozpakuj ZIP **CO_Tanker_Intelligence_Chrome_v1.6.zip** do stałego folderu. W wydaniu zbiorczym gotowy folder nazywa się **Windows_Chrome**.
3. Wpisz w pasku adresu Chrome **chrome://extensions**, włącz **Tryb dewelopera** i wybierz **Załaduj rozpakowane**. Wskaż folder, w którym bezpośrednio widzisz **manifest.json**. Jeśli aktualizujesz już rozpakowane rozszerzenie w tej samej ścieżce, po podmianie plików wybierz **Odśwież** na kafelku rozszerzenia.
4. Otwórz rozszerzenie. W razie potrzeby wybierz **Sources & settings → Import backup** i wskaż wcześniejszy plik. Sprawdź jedną notatkę, checklistę i zadanie. Import zastępuje dane na tym urządzeniu.
5. W **Always-On Watch → Feed connection** wybierz **Open private Watch**, zaloguj się w otwartej karcie, a następnie w rozszerzeniu wybierz **Connect feed** i zaakceptuj dostęp do domeny. Gdy przeglądarka oddziela sesję rozszerzenia od sesji strony, korzystaj z zalogowanej karty **Open private Watch**. Odczyt własnego publicznego kanału HTTPS jest również dostępny.

## Co działa podczas zamknięcia programu

W prywatnej aplikacji przegląd publikacji odbywa się po stronie serwera. Zapis obejmuje publiczne źródła, poprawki i materiały do nauki. Dostępność wydawcy, stan serwera i opóźnienia wpływają na świeżość. Pakiet do samodzielnego hostowania ma oddzielny harmonogram GitHub Actions, który wymaga aktywacji w repozytorium.

**Notatki, dowody inspekcyjne, stan checklist i osobiste odpowiedzi są lokalne.** Do przenoszenia ich między Samsungiem, rozszerzeniem i plikiem HTML użyj **Export backup / Import backup**. Zapisy otwartego pliku lokalnego zależą od przeglądarki i jego położenia.

Zakres testów i listę zmian znajdziesz w **QA_v1.6.md** oraz **CHANGELOG_v1.6.md**.

Instrukcje producenta: [instalacja rozszerzenia Chrome](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world) oraz [aplikacje internetowe w Chrome na Androidzie](https://support.google.com/chrome/answer/9658361?hl=pl).
