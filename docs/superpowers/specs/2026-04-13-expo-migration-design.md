# Expo Migration Design

## Goal

Migrate `apps/web` (React + Vite + Capacitor) to a native Expo (React Native) app. Drop the web target entirely — this is mobile-only going forward. The Hono API backend (`apps/api`) and shared types (`packages/types`) remain unchanged.

## Motivation

- Capacitor's web-view approach feels sluggish; truly native UI components provide a better experience
- App is mobile-only — no web version needed

## Architecture Decisions

### Stack

| Concern | Current (Web) | New (Expo) |
|---------|--------------|------------|
| Framework | React + Vite | Expo SDK 52 + expo-router |
| Styling | Tailwind CSS | NativeWind v4 (Tailwind → RN StyleSheet) |
| Navigation | react-router-dom | expo-router (file-based) |
| Icons | lucide-react | lucide-react-native |
| Charts | recharts (SVG/DOM) | victory-native (react-native-svg) |
| Bottom sheet | vaul (DOM) | @gorhom/bottom-sheet |
| Camera | @capacitor/camera | expo-image-picker |
| Push notifications | @capacitor/push-notifications | expo-notifications |
| Splash screen | @capacitor/splash-screen | expo-splash-screen |
| Status bar | @capacitor/status-bar | expo-status-bar |
| Deep links | @capacitor/app (appUrlOpen) | expo-linking (built into expo-router) |
| Data fetching | @tanstack/react-query | @tanstack/react-query (unchanged) |
| Auth | @supabase/supabase-js | @supabase/supabase-js (unchanged) |
| Token storage | localStorage | expo-secure-store (Keychain/Keystore) |
| Storage (env) | import.meta.env.VITE_* | expo-constants + app.config.ts |

### What Stays the Same

- **`packages/types`** — no changes, imported as `@peptide/types`
- **`apps/api`** — no changes, Hono backend stays on Railway
- **All hooks** (`useHomeData`, `useProfile`, `useLogDose`, etc.) — business logic is pure React hooks using react-query + supabase. Only change: replace `import.meta.env` with Constants.
- **`lib/supabase.ts`** — swap env access, add `@react-native-async-storage/async-storage` for session persistence
- **`lib/api.ts`** — swap env access only
- **`lib/cycleUtils.ts`** — pure functions, no changes

### What Changes

Every `.tsx` component file must be rewritten from HTML/Tailwind to React Native primitives + NativeWind:

- `<div>` → `<View>`
- `<p>`, `<span>`, `<h1>` → `<Text>`
- `<button>` → `<Pressable>` or `<TouchableOpacity>`
- `<input>` → `<TextInput>`
- `<select>` → Custom picker or `@react-native-picker/picker`
- `<img>` → `<Image>` from expo-image
- `<a>`, `<Link>` → `<Link>` from expo-router
- `<NavLink>` → expo-router tab config
- `className` props remain (NativeWind), but web-only utilities need adjustment
- CSS variables (`var(--color-*)`) → NativeWind theme or constants
- `useNavigate()` → `useRouter()` from expo-router
- `useParams()` → `useLocalSearchParams()` from expo-router

### File Structure

```
apps/mobile/
├── app/
│   ├── _layout.tsx              # Root: SessionProvider, QueryClientProvider, fonts
│   ├── (auth)/
│   │   ├── _layout.tsx          # Auth stack layout
│   │   ├── login.tsx            # AuthPage
│   │   └── callback.tsx         # AuthCallback (deep link handler)
│   ├── (app)/
│   │   ├── _layout.tsx          # Protected layout (redirect if no session)
│   │   ├── onboarding.tsx       # Onboarding flow
│   │   ├── vial-setup.tsx       # Vial setup
│   │   ├── protocols/
│   │   │   ├── new.tsx          # ProtocolBuilder (create)
│   │   │   └── [id]/
│   │   │       └── edit.tsx     # ProtocolBuilder (edit)
│   │   └── (tabs)/
│   │       ├── _layout.tsx      # Bottom tab navigator
│   │       ├── index.tsx        # Home
│   │       ├── progress.tsx     # Progress (was History + Photos)
│   │       ├── calc.tsx         # Calculator
│   │       ├── peptides.tsx     # Peptide Database
│   │       └── settings.tsx     # Settings
├── components/
│   ├── ActiveInSystemSection.tsx
│   ├── CycleProgressBar.tsx
│   ├── DoseCard.tsx
│   ├── FAB.tsx
│   ├── LogDoseSheet.tsx
│   └── SyringeVisual.tsx
├── hooks/                       # Copied from web, env vars updated
│   ├── useHomeData.ts
│   ├── useHistory.ts
│   ├── usePeptides.ts
│   ├── useProtocol.ts
│   ├── useLogDose.ts
│   ├── usePhotos.ts
│   ├── useSettings.ts
│   ├── useCreateVial.ts
│   └── useDecayData.ts
├── contexts/
│   └── SessionContext.tsx       # Remove Capacitor, use expo-linking
├── lib/
│   ├── supabase.ts              # AsyncStorage adapter, Constants for env
│   ├── api.ts                   # Constants for env
│   ├── cycleUtils.ts            # Unchanged
│   └── colors.ts                # CSS variable values as constants
├── app.config.ts                # Expo config (env vars, deep linking scheme)
├── tailwind.config.ts           # NativeWind tailwind config
├── nativewind-env.d.ts
├── package.json
├── tsconfig.json
└── babel.config.js
```

### CSS Variables → Color Constants

Current web app uses CSS custom properties. For React Native, define them as a colors module:

```ts
// lib/colors.ts
export const colors = {
  teal: '#1D9E75',
  background: { primary: '#000000', secondary: '#1C1C1E' },
  text: { primary: '#FFFFFF', secondary: '#ABABAB', tertiary: '#636366', danger: '#FF453A' },
  border: { primary: '#2C2C2E', tertiary: '#1C1C1E' },
}
```

These can also be registered in the NativeWind tailwind config for class-based usage.

### Supabase Auth on Native

```ts
// lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

const url = Constants.expoConfig?.extra?.supabaseUrl
const key = Constants.expoConfig?.extra?.supabaseAnonKey

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // native doesn't use URL-based auth
  },
})
```

### Deep Linking

Expo Router handles deep links via the `scheme` in app.config.ts:

```ts
// app.config.ts
export default {
  scheme: 'peptidetracker',
  // ... expo-router picks up the scheme automatically
}
```

Auth callback handled by expo-router's URL handling — no manual `appUrlOpen` listener needed.

## Migration Order

1. Scaffold Expo app (`apps/mobile`) with expo-router, NativeWind, core deps
2. Port lib/ files (supabase, api, cycleUtils, colors)
3. Port hooks/ (mostly copy, fix imports)
4. Port contexts/SessionContext (remove Capacitor)
5. Set up layouts (_layout files, tab navigator, protected route)
6. Port screens one by one: Home → Progress → Calculator → Peptides → Settings → Auth → Onboarding → ProtocolBuilder → VialSetup
7. Port components as needed by screens
8. Remove `apps/web` and update workspace config
9. Update CLAUDE.md and build scripts

## Environment Variables

`apps/mobile/.env`:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=https://api.example.com
```

Expo uses `EXPO_PUBLIC_` prefix instead of `VITE_`.

## What Gets Dropped

- `@capacitor/*` (core, ios, android, camera, push-notifications, splash-screen, status-bar, app)
- `react-dom`, `react-router-dom`
- `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa`
- `postcss`, `autoprefixer`
- `vaul` (replaced by @gorhom/bottom-sheet)
- `recharts` (replaced by victory-native)
- PWA manifest, service worker, Capacitor config files
- `apps/web/android/` directory (Capacitor Android shell)

## Out of Scope

- Backend changes (apps/api stays as-is)
- Database changes
- New features during migration
- Push notification implementation (stub only — requires native config per platform)
