# StarTynk Mobile - Architektura Features-Based

## 📁 Struktura Projektu

```
src/
├── features/                   # Funkcjonalności aplikacji
│   ├── auth/                  # Autoryzacja i uwierzytelnianie
│   │   ├── screens/           # Ekrany logowania, rejestracji
│   │   ├── components/        # Komponenty specyficzne dla auth
│   │   ├── hooks/             # Custom hooks (useAuth)
│   │   ├── services/          # API calls dla auth
│   │   └── types/             # Typy dla feature auth
│   ├── loading/               # Ekran ładowania aplikacji
│   ├── home/                  # Główny ekran aplikacji
│   ├── profile/               # Profil użytkownika
│   └── settings/              # Ustawienia aplikacji
├── shared/                    # Współdzielone zasoby
│   ├── components/            # Komponenty wielokrotnego użytku
│   ├── hooks/                 # Globalne custom hooks
│   ├── utils/                 # Funkcje pomocnicze
│   └── types/                 # Globalne typy
├── navigation/                # Konfiguracja nawigacji
├── store/                     # State management (Zustand)
├── types/                     # Globalne definicje typów
├── config/                    # Konfiguracja aplikacji
├── utils/                     # Globalne utility functions
└── constants/                 # Stałe aplikacji
```

## 🏗️ Architektura

### Features-Based Architecture
Każda funkcjonalność (feature) ma własną strukturę katalogów:
- **screens/** - Ekrany związane z daną funkcjonalnością
- **components/** - Komponenty specyficzne dla feature
- **hooks/** - Custom hooks używane tylko w tej funkcjonalności
- **services/** - API calls i logika biznesowa
- **types/** - Definicje typów TypeScript dla feature

### State Management - Zustand
```typescript
// Prosty, lekki store z Zustand
export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
}));
```

### Nawigacja - React Navigation v7
- **AppNavigator** - Główny navigator z trzema głównymi screen'ami:
  - Loading - Ekran ładowania
  - Auth - Stack navigator dla autoryzacji
  - Main - Tab navigator dla głównej aplikacji

### Typy TypeScript
Kompleksowy system typów dla nawigacji i danych użytkownika:
```typescript
export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  Main: undefined;
};
```

## 🚀 Flow Aplikacji

1. **LoadingScreen** - Pierwszy ekran, sprawdza stan autoryzacji
2. **AuthNavigator** (jeśli nie zalogowany):
   - LoginScreen
   - RegisterScreen  
   - ForgotPasswordScreen
3. **MainNavigator** (jeśli zalogowany):
   - HomeScreen (Tab)
   - ProfileScreen (Tab)
   - SettingsScreen (Tab)

## 📱 Główne Funkcjonalności

### Authentication Feature
- ✅ Login z email/hasło
- ✅ Rejestracja nowych użytkowników  
- ✅ Resetowanie hasła
- ✅ Pamiętanie sesji (AsyncStorage)
- ✅ Auto-logowanie przy starcie

### Loading Feature
- ✅ Animowany ekran ładowania
- ✅ Sprawdzanie stanu autoryzacji
- ✅ Automatyczne przekierowanie

### Navigation
- ✅ Stack navigation dla auth
- ✅ Tab navigation dla głównej aplikacji
- ✅ Typesafe navigation z TypeScript

### State Management
- ✅ Zustand store z TypeScript
- ✅ Persistent storage z AsyncStorage
- ✅ Reactive UI updates

## 🛠️ Technologie

- **React Native 0.79.5** - Framework mobilny
- **Expo SDK 53** - Development platform
- **TypeScript** - Type safety
- **React Navigation v7** - Navigation
- **Zustand** - State management
- **AsyncStorage** - Local storage
- **React Native Reanimated** - Animations

## 📦 Instalacja i Uruchomienie

```bash
# Instalacja zależności
npm install

# Uruchomienie aplikacji
npm start

# Uruchomienie z backend
npm run dev
```

## 🔧 Dodawanie Nowych Feature

1. Utwórz folder w `src/features/new-feature/`
2. Dodaj strukturę katalogów (screens, components, hooks, services, types)
3. Zaimplementuj screen i dodaj do odpowiedniego navigator
4. Dodaj typy do navigation.types.ts
5. Utwórz potrzebne hooki i services

## 🎯 Best Practices

- Używaj TypeScript dla wszystkich plików
- Każdy feature ma własne komponenty i hooki
- Shared komponenty tylko dla rzeczy używanych w >1 feature
- Wszystkie API calls przez services
- State management przez Zustand store
- Navigation z typesafe params
- Error handling w każdym service
- Consistent naming conventions

## 🔒 Bezpieczeństwo

- Tokens w AsyncStorage z proper cleanup
- Walidacja inputów
- Error handling bez expose sensitive info
- Proper logout cleanup