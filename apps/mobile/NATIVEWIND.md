# NativeWind v4 Setup & Usage Guide

## 🎨 NativeWind v4 zainstalowane i skonfigurowane!

NativeWind pozwala na używanie Tailwind CSS do stylowania komponentów React Native. Wszystkie style są kompilowane na czas budowania dla maksymalnej wydajności.

## 📁 Konfiguracja

### Główne pliki konfiguracyjne:
- `global.css` - główny plik CSS z @theme definitions
- `tailwind.config.js` - konfiguracja Tailwind CSS  
- `metro.config.js` - konfiguracja Metro bundler
- `babel.config.js` - konfiguracja Babel z NativeWind preset
- `nativewind-env.d.ts` - TypeScript types dla className

### Zainstalowane pakiety:
- `nativewind@^4.1.23` - główna biblioteka
- `tailwindcss@^3.4.17` - Tailwind CSS compiler
- `prettier-plugin-tailwindcss@^0.5.14` - formatowanie klas
- `expo-linear-gradient@~14.1.5` - gradienty liniowe
- `@react-native-masked-view/masked-view@0.3.2` - gradient text

## 🎨 Custom Theme Colors

### Brand Colors (StarTynk)
```css
bg-brand-orange     # #FFA500 (pomarańczowy StarTynk)
text-brand-orange   # Tekst w kolorze brand
border-brand-orange # Border w kolorze brand
bg-brand-black      # #000000 (czarny StarTynk)  
bg-brand-dark       # #333333 (ciemny szary)
```

### Gradient Colors (StarTynk)
```css
bg-gradient-start   # #FEAD00 (żółty gradient start)
bg-gradient-end     # #D75200 (pomarańczowy gradient end)
```

### Semantic Colors
```css
# Primary (niebieski)
bg-primary-500    # #3b82f6
text-primary-600  # #2563eb
border-primary-300 # #93c5fd

# Success (zielony)  
bg-success-500    # #22c55e
text-success-700  # #15803d

# Warning (pomarańczowy)
bg-warning-500    # #f59e0b
text-warning-700  # #b45309

# Error (czerwony)
bg-error-500      # #ef4444
text-error-700    # #b91c1c
```

## 💻 Użycie w komponentach

### Przed (StyleSheet):
```tsx
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#FFA500',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

<View style={styles.container}>
  <TouchableOpacity style={styles.button}>
    <Text style={styles.buttonText}>Przycisk</Text>
  </TouchableOpacity>
</View>
```

### Po (NativeWind):
```tsx
<View className="flex-1 bg-white justify-center items-center">
  <TouchableOpacity className="bg-brand-orange py-4 px-6 rounded-xl">
    <Text className="text-white text-lg font-bold">Przycisk</Text>
  </TouchableOpacity>
</View>
```

## 🧩 Migracja komponentów

### Logo Component (przykład):
```tsx
// Przed
<View style={styles.container}>
  <Text style={[styles.logoText, { fontSize: 48, color: '#FFA500' }]}>Star</Text>
  <Text style={[styles.logoText, { fontSize: 48, color: '#000' }]}>Tynk</Text>
</View>

// Po  
<View className="flex-row items-center">
  <Text className="font-bold tracking-tighter text-brand-orange text-5xl">Star</Text>
  <Text className="font-bold tracking-tighter text-black text-5xl">Tynk</Text>
</View>
```

## 📐 Najczęściej używane klasy

### Layout & Flexbox:
```css
flex-1          # flex: 1
flex-row        # flexDirection: 'row'  
items-center    # alignItems: 'center'
justify-center  # justifyContent: 'center'
justify-between # justifyContent: 'space-between'
```

### Spacing:
```css
p-4   # padding: 16px
px-6  # paddingHorizontal: 24px  
py-4  # paddingVertical: 16px
m-4   # margin: 16px
mb-8  # marginBottom: 32px
```

### Typography:
```css
text-lg      # fontSize: 18px
text-xl      # fontSize: 20px
text-2xl     # fontSize: 24px
font-bold    # fontWeight: 'bold'
font-semibold # fontWeight: '600'
text-center  # textAlign: 'center'
```

### Styling:
```css
bg-white     # backgroundColor: '#fff'
rounded-lg   # borderRadius: 8px
rounded-xl   # borderRadius: 12px
shadow-md    # box-shadow (elevation na Android)
border       # borderWidth: 1px
```

## 🎯 Przykłady patterns

### Card Component:
```tsx
<View className="bg-white rounded-xl p-6 shadow-md mb-4">
  <Text className="text-xl font-bold text-gray-800 mb-2">Tytuł</Text>
  <Text className="text-gray-600">Treść karty...</Text>
</View>
```

### Button Variants:
```tsx
// Primary Button
<TouchableOpacity className="bg-brand-orange py-4 px-6 rounded-xl">
  <Text className="text-white text-lg font-semibold text-center">Primary</Text>
</TouchableOpacity>

// Secondary Button  
<TouchableOpacity className="bg-gray-100 border border-gray-300 py-4 px-6 rounded-xl">
  <Text className="text-gray-800 text-lg font-semibold text-center">Secondary</Text>
</TouchableOpacity>

// Danger Button
<TouchableOpacity className="bg-error-500 py-4 px-6 rounded-xl">
  <Text className="text-white text-lg font-semibold text-center">Delete</Text>
</TouchableOpacity>
```

### Input Field:
```tsx
<TextInput 
  className="bg-white border border-gray-300 rounded-xl px-4 py-4 text-lg"
  placeholder="Email"
  placeholderTextColor="#9ca3af"
/>
```

## 🚀 Korzyści NativeWind

- **Szybszy development** - mniej kodu, więcej produktywności
- **Consistency** - ujednolicone kolory i spacing
- **Performance** - style kompilowane na build time  
- **TypeScript** - pełne wsparcie typów dla className
- **Hot Reload** - zmiany w CSS od razu widoczne
- **Web Compatible** - te same style działają na web
- **Design System** - łatwe utrzymanie spójności

## 🔧 Debugging

### Sprawdzenie czy NativeWind działa:
```tsx
import { verifyInstallation } from 'nativewind';

function MyComponent() {
  verifyInstallation(); // Uruchom w komponencie
  return <View className="bg-red-500" />;
}
```

### Kompilacja CSS:
```bash
npx tailwindcss --input ./global.css --output output.css
```

### Debug mode:
```bash
DEBUG=nativewind npx expo start --clear
```

## 📚 Przydatne linki

- [NativeWind Documentation](https://www.nativewind.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [NativeWind v4 Migration Guide](https://www.nativewind.dev/v4/migration)

## 🌈 Gradienty w React Native

### Logo Component z Gradientem
```tsx
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

// "Star" z gradientem żółty → pomarańczowy  
<MaskedView
  style={{ height: fontSize + 8, width: fontSize * 2.2 }}
  maskElement={
    <Text style={{ fontSize, fontWeight: 'bold' }}>Star</Text>
  }
>
  <LinearGradient
    colors={['#FEAD00', '#D75200']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={{ flex: 1 }}
  />
</MaskedView>
```

### Gradient Background
```tsx
// Gradient jako tło
<LinearGradient
  colors={['#FEAD00', '#D75200']}
  style={{ flex: 1, padding: 20 }}
>
  <Text className="text-white text-xl">Treść na gradiencie</Text>
</LinearGradient>
```

### Brand Gradient Colors
- **Start**: `#FEAD00` (żółty)
- **End**: `#D75200` (pomarańczowy)

## 🎨 Next Steps

Po zapoznaniu się z podstawami, można eksplorować:
- Animations i Transitions (experimental w v4)
- Container Queries dla responsive design  
- Custom CSS classes
- Dark mode support
- Media queries
- Advanced gradients (radial, conic)