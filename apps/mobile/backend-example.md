# Backend dla Startynk Mobile

## Opcja 1: Next.js Backend (Rekomendowane)

### Struktura projektu:
```
startynk-workspace/
├── startynk-mobile/     (Twoja aplikacja React Native)
├── startynk-backend/    (Next.js API)
└── startynk-web/        (Opcjonalnie: strona web)
```

### Kroki implementacji:

1. **Stwórz projekt Next.js:**
```bash
cd ../
npx create-next-app@latest startynk-backend --typescript --app
cd startynk-backend
```

2. **Zainstaluj Prisma i dependencies:**
```bash
npm install prisma @prisma/client bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

3. **Skopiuj schema.prisma z web app**

4. **Przykład API Route** (`app/api/auth/login/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@repo/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { identifier, password, loginMethod } = await request.json();

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: loginMethod === 'email' 
        ? { email: identifier }
        : { phone: identifier }
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return user data and tokens
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Opcja 2: Express.js Backend

### Przykład struktury:
```typescript
// server.ts
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@repo/database';
import authRoutes from './routes/auth';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Opcja 3: Supabase (Backend as a Service)

Jeśli nie chcesz zarządzać własnym backendem:

1. **Stwórz projekt na supabase.com**
2. **Użyj Supabase Auth i Database**
3. **Zainstaluj w React Native:**
```bash
npm install @supabase/supabase-js
```

## Deployment

### Next.js Backend:
- **Vercel** (darmowy dla projektów osobistych)
- **Railway** (łatwy deployment z bazą danych)
- **Render** (darmowy tier)

### Express Backend:
- **Railway**
- **Render**
- **Heroku** (płatny)
- **DigitalOcean App Platform**

## Połączenie z React Native

W pliku `.env` aplikacji mobilnej ustaw:
```
API_URL=http://localhost:3000  # Development
API_URL=https://twoj-backend.vercel.app  # Production
```

## Wskazówki:

1. **CORS**: Pamiętaj o konfiguracji CORS dla Expo Go
2. **HTTPS**: W produkcji zawsze używaj HTTPS
3. **Autoryzacja**: Implementuj middleware do weryfikacji JWT
4. **Rate Limiting**: Dodaj ochronę przed nadmiernym użyciem
5. **Walidacja**: Używaj bibliotek jak Zod lub Joi

## Przykład pełnego flow:

1. Mobile App → Login Request → Backend API
2. Backend → Validate credentials → Generate JWT
3. Backend → Return token → Mobile App
4. Mobile App → Store token → Use for future requests
5. Mobile App → API Request with token → Backend validates → Returns data