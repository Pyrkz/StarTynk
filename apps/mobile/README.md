# StarTynk Mobile

Aplikacja mobilna dla systemu zarządzania projektami budowlanymi.

## 🚀 Uruchamianie aplikacji

### Metoda 1: Uruchom backend i frontend jednocześnie
```bash
npm run dev
```
To uruchomi:
- Backend na http://localhost:3000
- Expo Metro Bundler na http://localhost:8081

### Metoda 2: Uruchom osobno

#### Backend:
```bash
cd backend
npm run dev
```

#### Frontend (w nowym terminalu):
```bash
npm start
# lub
expo start
```

## 📱 Uruchamianie na urządzeniu

Po uruchomieniu `npm run dev` lub `npm start`:

1. **Na telefonie z iOS:**
   - Zainstaluj aplikację Expo Go z App Store
   - Zeskanuj kod QR wyświetlony w terminalu

2. **Na telefonie z Android:**
   - Zainstaluj aplikację Expo Go z Google Play
   - Zeskanuj kod QR wyświetlony w terminalu

3. **W symulatorze iOS:**
   - Naciśnij `i` w terminalu

4. **W emulatorze Android:**
   - Naciśnij `a` w terminalu

5. **W przeglądarce:**
   - Naciśnij `w` w terminalu

## 🔐 Testowe konta

| Typ konta | Email | Telefon | Hasło |
|-----------|-------|---------|-------|
| Admin | admin@startynk.com | +48123456789 | password123 |
| User | user@startynk.com | +48987654321 | password123 |
| Manager | manager@startynk.com | +48555666777 | password123 |

## 🛠️ Komendy

```bash
# Instalacja zależności
npm install

# Uruchomienie dev (backend + frontend)
npm run dev

# Tylko frontend
npm start

# Tylko backend
npm run backend

# Backend bezpośrednio
cd backend && npm run dev

# Seed bazy danych
cd backend && npm run prisma:seed

# Prisma Studio (podgląd bazy)
cd backend && npm run prisma:studio
```

## 📋 Wymagania

- Node.js 18+
- npm lub yarn
- Expo Go app na telefonie (dla testowania na urządzeniu)
- Xcode (dla iOS simulator) - opcjonalnie
- Android Studio (dla Android emulator) - opcjonalnie

## ⚠️ Rozwiązywanie problemów

### Ostrzeżenia o wersjach pakietów
Możesz je zignorować lub zaktualizować:
```bash
npm update @react-native-async-storage/async-storage react-native-reanimated react-native-safe-area-context react-native-screens
```

### Problem z Watchman
Jeśli widzisz ostrzeżenie o Watchman:
```bash
watchman watch-del '/Users/marcinpyrkosz/Desktop/Aplikacje/startynk-mobile/startynk-mobile'
watchman watch-project '/Users/marcinpyrkosz/Desktop/Aplikacje/startynk-mobile/startynk-mobile'
```

### Backend nie łączy się z bazą
Sprawdź plik `backend/.env` i upewnij się, że DATABASE_URL jest poprawny.

### Aplikacja nie łączy się z backend

1. **Sprawdź czy backend działa** - powinien być dostępny na http://localhost:3000

2. **Konfiguracja automatyczna** - aplikacja automatycznie wybiera odpowiedni adres:
   - iOS Simulator: `http://localhost:3000`
   - Android Emulator: `http://10.0.2.2:3000`
   - Fizyczne urządzenie: `http://192.168.1.31:3000` (twój lokalny IP)

3. **Jeśli używasz fizycznego urządzenia:**
   - Znajdź swój lokalny IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Zaktualizuj `src/config/api.config.ts` - zmień IP w linii 15
   - Upewnij się, że telefon i komputer są w tej samej sieci WiFi
   - Sprawdź czy firewall nie blokuje portu 3000

4. **Restart aplikacji** - po zmianie konfiguracji zrestartuj Expo (Ctrl+C i `npm start`)

## 🏗️ Struktura projektu

### Frontend (React Native + Expo)
```
src/
├── features/           # Funkcjonalności aplikacji (features-based)
├── shared/            # Współdzielone komponenty i utils
├── navigation/        # Konfiguracja nawigacji
├── store/            # State management (Zustand)
└── config/           # Konfiguracja aplikacji
```

### Backend (Fastify + Prisma)
```
backend/src/
├── features/          # Funkcjonalności API (features-based)
├── shared/           # Współdzielone middleware i utils
├── config/           # Konfiguracja serwera
└── server.ts         # Entry point
```

## 🛡️ Technologie

- **React Native 0.79.5** + **Expo SDK 53**
- **TypeScript** - type safety
- **NativeWind** - Tailwind CSS dla React Native
- **React Navigation v7** - nawigacja
- **Zustand** - state management
- **Fastify v5** - backend framework
- **Prisma ORM** - baza danych MySQL
- **JWT** - autoryzacja