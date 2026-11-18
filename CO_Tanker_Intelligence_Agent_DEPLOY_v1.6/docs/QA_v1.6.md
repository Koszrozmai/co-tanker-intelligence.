# Testy i ograniczenia v1.6 · 18 listopada 2026

| Sprawdzenie | Wynik |
|---|---|
| Prywatna aplikacja i trwały zapis | Wdrożenie potwierdzone. Odczyt rejestru i instrukcji, zapis pierwszych czterech publikacji oraz osobny odczyt wyników z serwera zakończone powodzeniem. |
| Kolejny przegląd źródeł | Potwierdzono identyfikator watch-20261118-2100-warsaw w trwałym raporcie. Zapisano 10 prób, z czego osiem zakończyło się dostępem do co najmniej indeksu źródła. Dodano sześć rekordów i poprawiono jeden wcześniejszy. Wynik to dziesięć rekordów i dziewięć ćwiczeń. |
| Prywatny serwer | Dziesięć automatycznych testów. Obejmują ponowne i równoległe zapisy, źródło niedostępne, częściową awarię, zachowanie istniejącej publikacji, wersję quizu, walidację danych i zatrzymanie materiałów do przeglądu. |
| Kolektor do samodzielnego hostowania | Dziewięć testów Python. Sprawdzają m.in. deduplikację, domeny źródeł, daty RSS/Atom, cypryjski wiersz tabeli, historię zmiany tytułu i opóźnienie ponownej próby. Użyto kontrolowanych odpowiedzi źródeł. |
| Interfejs w przeglądarce | Otworzono Overview i Watch, wyszukano kampanię cargo securing, zaznaczono przeczytanie, udzielono poprawnej odpowiedzi w quizie. Po przeładowaniu nadal widoczne były zaznaczenie i odpowiedź. |
| Zgodność danych | Syntetyczny backup poprzedniej generacji zaimportowano przez kod obu warstw zapisu. Odczytano notatki, status checklisty, zadanie i postęp nauki. Sprawdzono odrzucenie wadliwego backupu, eksport i import oznaczeń Watch oraz zapis na lokalnej warstwie pamięci aplikacji. |
| Pliki dystrybucyjne | Sprawdzono integralność ZIP, manifesty i ikony, komplet importów i składnię JavaScript. Samodzielny HTML zawiera kod aplikacji, style i dane bez zewnętrznych zależności uruchomieniowych. |

Nie przeprowadzono instalacji na fizycznym Samsungu ani instalacji rozszerzenia na Windows. Fizyczny tryb samolotowy, reguły firmowe, zachowanie sesji rozszerzenia i push w poszczególnych przeglądarkach wymagają próby na docelowym urządzeniu. GitHub Actions jest opcjonalnym wariantem do samodzielnego wdrożenia. Repozytorium GitHub użytkownika nie brało udziału w teście.

W przeglądzie z 18 listopada cypryjski wykaz zwrócił HTTP 403, a odczyt strony BIMCO nie ujawnił listy datowanych publikacji. Pełny artykuł INTERTANKO wymagał zalogowania. Status dostępnego indeksu jest opisany oddzielnie od sprawdzenia pełnego dokumentu. Serwer archiwizuje przebiegi w prywatnym magazynie danych. Interfejs prezentuje do czterech wcześniejszych wersji wpisu.
