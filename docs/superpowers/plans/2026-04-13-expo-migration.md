# Expo Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `apps/web` (React + Vite + Capacitor) to `apps/mobile` (Expo + React Native), dropping the web target entirely.

**Architecture:** File-based routing via Expo Router with NativeWind for styling. All hooks and business logic port with minimal changes (swap env vars, storage adapter). Each screen is rewritten from HTML/Tailwind to RN primitives + NativeWind.

**Tech Stack:** Expo SDK 52, Expo Router 4, NativeWind 4, @gorhom/bottom-sheet, victory-native, react-native-svg, lucide-react-native, @supabase/supabase-js, @tanstack/react-query, expo-image-picker, expo-secure-store

---

### Task 1: Scaffold Expo app with core dependencies

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/tsconfig.json`
- Create: `apps/mobile/babel.config.js`
- Create: `apps/mobile/metro.config.js`
- Create: `apps/mobile/tailwind.config.ts`
- Create: `apps/mobile/nativewind-env.d.ts`
- Create: `apps/mobile/global.css`
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: Create `apps/mobile/package.json`**

```json
{
  "name": "@peptide/mobile",
  "version": "0.0.1",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "build:ios": "eas build --platform ios",
    "build:android": "eas build --platform android",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "@gorhom/bottom-sheet": "^5.1.0",
    "@peptide/types": "workspace:*",
    "@react-native-async-storage/async-storage": "2.1.2",
    "@supabase/supabase-js": "^2.43.5",
    "@tanstack/react-query": "^5.45.0",
    "expo": "~52.0.0",
    "expo-constants": "~17.0.0",
    "expo-image": "~2.0.0",
    "expo-image-picker": "~16.0.0",
    "expo-linking": "~7.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-status-bar": "~2.0.0",
    "expo-web-browser": "~14.0.0",
    "lucide-react-native": "^0.395.0",
    "nativewind": "^4.1.0",
    "react": "18.3.1",
    "react-native": "0.76.7",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-safe-area-context": "~4.12.0",
    "react-native-screens": "~4.4.0",
    "react-native-svg": "~15.8.0",
    "victory-native": "^41.0.0"
  },
  "devDependencies": {
    "@types/react": "~18.3.3",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 2: Create `apps/mobile/app.json`**

```json
{
  "expo": {
    "name": "Peptide Tracker",
    "slug": "peptide-tracker",
    "version": "1.0.0",
    "scheme": "peptidetracker",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "icon": "./assets/icon.png",
    "splash": {
      "backgroundColor": "#0f0f0f"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.peptidetracker.app"
    },
    "android": {
      "package": "com.peptidetracker.app",
      "adaptiveIcon": {
        "backgroundColor": "#0f0f0f"
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-image-picker"
    ],
    "extra": {
      "eas": {
        "projectId": ""
      }
    }
  }
}
```

- [ ] **Step 3: Create `apps/mobile/tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts",
    "nativewind-env.d.ts"
  ]
}
```

- [ ] **Step 4: Create `apps/mobile/babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: ['react-native-reanimated/plugin'],
  }
}
```

- [ ] **Step 5: Create `apps/mobile/metro.config.js`**

```js
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [monorepoRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

module.exports = withNativeWind(config, { input: './global.css' })
```

- [ ] **Step 6: Create `apps/mobile/tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#1D9E75',
          light: '#E1F5EE',
          dark: '#0F6E56',
        },
        bg: {
          primary: '#0f0f0f',
          secondary: '#1a1a1a',
          tertiary: '#252525',
        },
        txt: {
          primary: '#f5f5f5',
          secondary: '#a3a3a3',
          tertiary: '#737373',
          danger: '#f87171',
        },
        bdr: {
          primary: 'rgba(255,255,255,0.12)',
          secondary: 'rgba(255,255,255,0.08)',
          tertiary: 'rgba(255,255,255,0.06)',
        },
      },
    },
  },
} satisfies Config
```

- [ ] **Step 7: Create `apps/mobile/nativewind-env.d.ts`**

```ts
/// <reference types="nativewind/types" />
```

- [ ] **Step 8: Create `apps/mobile/global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 9: Create `apps/mobile/assets/` placeholder directory**

```bash
mkdir -p apps/mobile/assets
# Create a placeholder icon (replace with real asset later)
cp apps/web/public/icon-192.png apps/mobile/assets/icon.png 2>/dev/null || true
```

- [ ] **Step 10: Verify `pnpm-workspace.yaml` includes `apps/mobile`**

Read `pnpm-workspace.yaml`. It should already match `apps/*` via glob. If it uses explicit entries, add `apps/mobile`.

- [ ] **Step 11: Install dependencies**

```bash
cd apps/mobile && pnpm install
```

- [ ] **Step 12: Commit scaffold**

```bash
git add apps/mobile/
git commit -m "scaffold: Expo app with NativeWind, Expo Router, and core deps"
```

---

### Task 2: Port lib/ files (supabase, api, cycleUtils, colors, platform)

**Files:**
- Create: `apps/mobile/lib/supabase.ts`
- Create: `apps/mobile/lib/api.ts`
- Create: `apps/mobile/lib/cycleUtils.ts`
- Create: `apps/mobile/lib/colors.ts`

- [ ] **Step 1: Create `apps/mobile/lib/supabase.ts`**

Port from `apps/web/src/lib/supabase.ts`. Replace Capacitor with RN storage, `import.meta.env` with `process.env`.

```ts
import 'react-native-url-polyfill/dist/polyfill'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

- [ ] **Step 2: Create `apps/mobile/lib/api.ts`**

Port from `apps/web/src/lib/api.ts`. Only change: env var access.

```ts
import { supabase } from './supabase'

const baseUrl = process.env.EXPO_PUBLIC_API_URL!

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}
```

- [ ] **Step 3: Create `apps/mobile/lib/cycleUtils.ts`**

Copy `apps/web/src/lib/cycleUtils.ts` verbatim — it's pure logic with no web dependencies. Only change the import path for `HomeProtocolPeptide`:

```ts
import type { Protocol } from '@peptide/types'
import type { HomeProtocolPeptide } from '../hooks/useHomeData'

export interface PeptideCycleProgress {
  day: number
  total: number
  pct: number
}

export function getPeptideCycleProgress(
  item: HomeProtocolPeptide,
  protocol: Protocol
): PeptideCycleProgress | null {
  if (!item.cycle_length_days || !protocol.start_date) return null

  const start = new Date(protocol.start_date)
  const now = new Date()
  const msPerDay = 86400000
  const elapsed = Math.floor((now.getTime() - start.getTime()) / msPerDay)

  const cycleDay = (elapsed % item.cycle_length_days) + 1
  const pct = cycleDay / item.cycle_length_days

  return { day: cycleDay, total: item.cycle_length_days, pct }
}
```

- [ ] **Step 4: Create `apps/mobile/lib/colors.ts`**

Extract CSS variables from `apps/web/src/index.css` into a constants file for use in inline styles where NativeWind classes aren't sufficient:

```ts
export const colors = {
  teal: '#1D9E75',
  tealLight: '#E1F5EE',
  tealDark: '#0F6E56',
  bg: {
    primary: '#0f0f0f',
    secondary: '#1a1a1a',
    tertiary: '#252525',
  },
  text: {
    primary: '#f5f5f5',
    secondary: '#a3a3a3',
    tertiary: '#737373',
    danger: '#f87171',
  },
  border: {
    primary: 'rgba(255,255,255,0.12)',
    secondary: 'rgba(255,255,255,0.08)',
    tertiary: 'rgba(255,255,255,0.06)',
  },
  warning: {
    bg: '#2d2000',
    text: '#fbbf24',
  },
  success: {
    bg: '#0a2e22',
    text: '#4ade9d',
  },
} as const
```

- [ ] **Step 5: Add `react-native-url-polyfill` dependency**

```bash
cd apps/mobile && pnpm add react-native-url-polyfill
```

- [ ] **Step 6: Create `.env` file for mobile**

```bash
cat > apps/mobile/.env << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=http://localhost:3001
EOF
```

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/lib/ apps/mobile/.env
git commit -m "feat: port lib/ files to Expo (supabase, api, cycleUtils, colors)"
```

---

### Task 3: Port hooks

**Files:**
- Create: `apps/mobile/hooks/useHomeData.ts`
- Create: `apps/mobile/hooks/useLogDose.ts`
- Create: `apps/mobile/hooks/useHistory.ts`
- Create: `apps/mobile/hooks/useDecayData.ts`
- Create: `apps/mobile/hooks/usePhotos.ts`
- Create: `apps/mobile/hooks/useProtocol.ts`
- Create: `apps/mobile/hooks/usePeptides.ts`
- Create: `apps/mobile/hooks/useSettings.ts`
- Create: `apps/mobile/hooks/useCreateVial.ts`

All hooks are pure React hooks using TanStack Query + Supabase. The only changes needed:
1. Replace `import.meta.env.VITE_PREVIEW_MODE` with `__DEV__` or remove preview mode
2. Fix import paths (`../lib/supabase` stays the same relative path)
3. Remove `@capacitor/*` imports

- [ ] **Step 1: Copy and adapt each hook**

For each hook file, copy from `apps/web/src/hooks/` to `apps/mobile/hooks/`. Changes per file:

**useHomeData.ts**: Remove `PREVIEW_MODE` / `MOCK_DATA` block (or replace `import.meta.env.VITE_PREVIEW_MODE` with a `__DEV__` flag). Keep the `HomeProtocolPeptide` and `HomeData` interfaces and `fetchHomeData` function unchanged. Update import of `SessionContext` to `../contexts/SessionContext`.

**useLogDose.ts**: No changes needed beyond import paths.

**useHistory.ts**: No changes needed beyond import paths.

**useDecayData.ts**: Remove `PREVIEW_MODE` references or replace with `__DEV__`.

**usePhotos.ts**: No changes needed beyond import paths. The `File` type in `useUploadPhoto` will need adjustment in a later task since React Native doesn't have `File` — we'll use a blob/uri approach instead. For now, copy as-is and we'll fix the photo upload in the Photos screen task.

**useProtocol.ts**: No changes needed beyond import paths.

**usePeptides.ts**: No changes needed beyond import paths.

**useSettings.ts**: No changes needed beyond import paths.

**useCreateVial.ts**: No changes needed beyond import paths.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hooks/
git commit -m "feat: port all hooks to Expo (minimal changes, same business logic)"
```

---

### Task 4: Port SessionContext and create root layout

**Files:**
- Create: `apps/mobile/contexts/SessionContext.tsx`
- Create: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Create `apps/mobile/contexts/SessionContext.tsx`**

Port from `apps/web/src/contexts/SessionContext.tsx`. Remove Capacitor deep link listener — Expo Router handles deep links via URL scheme automatically.

```tsx
import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface SessionContextValue {
  session: Session | null
  loading: boolean
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  loading: true,
})

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
```

- [ ] **Step 2: Create `apps/mobile/app/_layout.tsx`**

Root layout wraps everything in providers. This replaces `main.tsx`.

```tsx
import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from '../contexts/SessionContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }} />
        </SessionProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/contexts/ apps/mobile/app/_layout.tsx
git commit -m "feat: add SessionContext and root layout with providers"
```

---

### Task 5: Create auth group and protected layout

**Files:**
- Create: `apps/mobile/app/(auth)/_layout.tsx`
- Create: `apps/mobile/app/(auth)/login.tsx`
- Create: `apps/mobile/app/(auth)/callback.tsx`
- Create: `apps/mobile/app/(app)/_layout.tsx`
- Create: `apps/mobile/app/index.tsx`

- [ ] **Step 1: Create `apps/mobile/app/index.tsx`** (auth redirect)

```tsx
import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useSession } from '../contexts/SessionContext'

export default function Index() {
  const { session, loading } = useSession()

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-primary">
        <ActivityIndicator color="#1D9E75" />
      </View>
    )
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return <Redirect href="/(app)/(tabs)" />
}
```

- [ ] **Step 2: Create `apps/mobile/app/(auth)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

- [ ] **Step 3: Create `apps/mobile/app/(auth)/login.tsx`**

Port from `apps/web/src/pages/AuthPage.tsx`. Replace HTML with RN primitives.

```tsx
import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from '../../lib/supabase'
import { colors } from '../../lib/colors'

type Tab = 'signin' | 'signup'

export default function LoginScreen() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signupDone, setSignupDone] = useState(false)

  async function handleSubmit() {
    setError(null)
    setLoading(true)

    if (tab === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        router.replace('/(app)/(tabs)')
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSignupDone(true)
      }
    }

    setLoading(false)
  }

  async function handleGoogle() {
    setError(null)
    const redirectUrl = Linking.createURL('/auth/callback')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    })
    if (error) {
      setError(error.message)
      return
    }
    if (data.url) {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      )
      if (result.type === 'success' && result.url) {
        const params = new URL(result.url).searchParams
        const code = params.get('code')
        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
          router.replace('/(app)/(tabs)')
        }
      }
    }
  }

  if (signupDone) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-primary px-6">
        <Text className="text-xl font-medium text-txt-primary mb-3">
          Check your email
        </Text>
        <Text className="text-sm text-txt-secondary text-center">
          We sent a confirmation link to {email}. Click it to activate your
          account.
        </Text>
        <Pressable
          onPress={() => {
            setSignupDone(false)
            setTab('signin')
          }}
          className="mt-6"
        >
          <Text className="text-sm font-medium text-teal">
            Back to sign in
          </Text>
        </Pressable>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bg-primary"
    >
      <ScrollView
        contentContainerClassName="px-6 pt-16 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-xl font-medium text-txt-primary mb-8">
          Peptide Tracker
        </Text>

        {/* Tabs */}
        <View
          className="flex-row mb-6"
          style={{ borderBottomWidth: 1, borderBottomColor: colors.border.primary }}
        >
          {(['signin', 'signup'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                setTab(t)
                setError(null)
              }}
              className="flex-1 pb-2.5 items-center"
              style={
                tab === t
                  ? { borderBottomWidth: 2, borderBottomColor: colors.teal }
                  : undefined
              }
            >
              <Text
                className="text-sm font-medium"
                style={{
                  color: tab === t ? colors.teal : colors.text.secondary,
                }}
              >
                {t === 'signin' ? 'Sign in' : 'Sign up'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Form */}
        <View className="gap-3">
          <View className="gap-1">
            <Text className="text-[10px] font-medium uppercase tracking-widest text-txt-secondary">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              className="h-10 px-3 text-sm text-txt-primary bg-bg-secondary rounded-lg"
              style={{ borderWidth: 1, borderColor: colors.border.tertiary }}
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          <View className="gap-1">
            <Text className="text-[10px] font-medium uppercase tracking-widest text-txt-secondary">
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={
                tab === 'signin' ? 'current-password' : 'new-password'
              }
              className="h-10 px-3 text-sm text-txt-primary bg-bg-secondary rounded-lg"
              style={{ borderWidth: 1, borderColor: colors.border.tertiary }}
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          {error && (
            <Text className="text-[13px] text-txt-danger">{error}</Text>
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="h-11 mt-1 bg-teal rounded-lg items-center justify-center"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-sm font-medium text-white">
                {tab === 'signin' ? 'Sign in' : 'Create account'}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Divider */}
        <View className="flex-row items-center gap-3 my-5">
          <View
            className="flex-1 h-px"
            style={{ backgroundColor: colors.border.primary }}
          />
          <Text className="text-xs text-txt-tertiary">or</Text>
          <View
            className="flex-1 h-px"
            style={{ backgroundColor: colors.border.primary }}
          />
        </View>

        {/* Google */}
        <Pressable
          onPress={handleGoogle}
          className="h-11 flex-row items-center justify-center rounded-lg"
          style={{ borderWidth: 1, borderColor: colors.border.primary }}
        >
          <Text className="text-sm font-medium text-txt-primary">
            Continue with Google
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
```

- [ ] **Step 4: Create `apps/mobile/app/(auth)/callback.tsx`**

```tsx
import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const params = useLocalSearchParams<{ code?: string }>()

  useEffect(() => {
    if (params.code) {
      supabase.auth.exchangeCodeForSession(params.code).then(() => {
        router.replace('/(app)/(tabs)')
      })
    }
  }, [params.code])

  return (
    <View className="flex-1 items-center justify-center bg-bg-primary">
      <ActivityIndicator color="#1D9E75" />
    </View>
  )
}
```

- [ ] **Step 5: Create `apps/mobile/app/(app)/_layout.tsx`** (protected)

```tsx
import { Redirect, Stack } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { useSession } from '../../contexts/SessionContext'

export default function AppLayout() {
  const { session, loading } = useSession()

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-primary">
        <ActivityIndicator color="#1D9E75" />
      </View>
    )
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/app/
git commit -m "feat: add auth screens and protected layout"
```

---

### Task 6: Create tab navigator layout

**Files:**
- Create: `apps/mobile/app/(app)/(tabs)/_layout.tsx`

- [ ] **Step 1: Create tab layout**

Port from `apps/web/src/layouts/TabLayout.tsx`.

```tsx
import { Tabs } from 'expo-router'
import {
  Home,
  TrendingUp,
  Calculator,
  FlaskConical,
  Settings,
} from 'lucide-react-native'
import { colors } from '../../../lib/colors'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.bg.primary,
          borderTopColor: colors.border.primary,
          borderTopWidth: 1,
          height: 52,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home size={20} color={color} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => (
            <TrendingUp size={20} color={color} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="calc"
        options={{
          title: 'Calc',
          tabBarIcon: ({ color }) => (
            <Calculator size={20} color={color} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="peptides"
        options={{
          title: 'Peptides',
          tabBarIcon: ({ color }) => (
            <FlaskConical size={20} color={color} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Settings size={20} color={color} strokeWidth={1.75} />
          ),
        }}
      />
    </Tabs>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/\(app\)/\(tabs\)/_layout.tsx
git commit -m "feat: add bottom tab navigator"
```

---

### Task 7: Port shared components

**Files:**
- Create: `apps/mobile/components/CycleProgressBar.tsx`
- Create: `apps/mobile/components/DoseCard.tsx`
- Create: `apps/mobile/components/FAB.tsx`
- Create: `apps/mobile/components/ActiveInSystemSection.tsx`
- Create: `apps/mobile/components/LogDoseSheet.tsx`
- Create: `apps/mobile/components/SyringeVisual.tsx`
- Create: `apps/mobile/components/ui/Spinner.tsx`
- Create: `apps/mobile/components/ui/FieldLabel.tsx`

- [ ] **Step 1: Create `apps/mobile/components/ui/Spinner.tsx`**

Shared loading indicator used across screens:

```tsx
import { View, ActivityIndicator } from 'react-native'

export function Spinner() {
  return (
    <View className="flex-1 items-center justify-center pt-20">
      <ActivityIndicator color="#1D9E75" />
    </View>
  )
}
```

- [ ] **Step 2: Create `apps/mobile/components/ui/FieldLabel.tsx`**

```tsx
import { Text } from 'react-native'

export function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="text-[10px] font-medium uppercase tracking-widest text-txt-secondary mb-1">
      {children}
    </Text>
  )
}
```

- [ ] **Step 3: Create `apps/mobile/components/CycleProgressBar.tsx`**

```tsx
import { View, Text } from 'react-native'
import type { Protocol } from '@peptide/types'
import { colors } from '../lib/colors'

function getDayProgress(protocol: Protocol) {
  const today = new Date()
  const start = protocol.start_date ? new Date(protocol.start_date) : null
  const end = protocol.end_date ? new Date(protocol.end_date) : null

  if (!start || !end) return { day: 1, total: 1, pct: 0 }

  const totalMs = end.getTime() - start.getTime()
  const elapsedMs = today.getTime() - start.getTime()
  const total = Math.round(totalMs / (1000 * 60 * 60 * 24)) + 1
  const day = Math.max(
    1,
    Math.min(total, Math.round(elapsedMs / (1000 * 60 * 60 * 24)) + 1)
  )
  const pct = Math.min(100, Math.max(0, ((day - 1) / (total - 1)) * 100))

  return { day, total, pct }
}

export default function CycleProgressBar({
  protocol,
}: {
  protocol: Protocol
}) {
  const { day, total, pct } = getDayProgress(protocol)

  return (
    <View className="px-4 pt-5 pb-3">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-xs text-txt-secondary">{protocol.name}</Text>
        <Text className="text-xs font-medium text-teal">
          Day {day} / {total}
        </Text>
      </View>
      <View
        className="h-[5px] rounded-full overflow-hidden"
        style={{ backgroundColor: colors.bg.tertiary }}
      >
        <View
          className="h-full rounded-full bg-teal"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  )
}
```

- [ ] **Step 4: Create `apps/mobile/components/DoseCard.tsx`**

```tsx
import { View, Text, Pressable } from 'react-native'
import type { HomeProtocolPeptide } from '../hooks/useHomeData'
import type { PeptideCycleProgress } from '../lib/cycleUtils'
import { colors } from '../lib/colors'

type DoseState = 'due' | 'logged'

function getDoseState(item: HomeProtocolPeptide): DoseState {
  return item.todays_logs.length > 0 ? 'logged' : 'due'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface Props {
  item: HomeProtocolPeptide
  onLog: (item: HomeProtocolPeptide) => void
  peptideCycle?: PeptideCycleProgress | null
}

export default function DoseCard({ item, onLog, peptideCycle }: Props) {
  const state = getDoseState(item)

  return (
    <Pressable
      onPress={() => state !== 'logged' && onLog(item)}
      disabled={state === 'logged'}
      className="w-full px-4 py-3.5 rounded-lg"
      style={{
        backgroundColor: colors.bg.primary,
        borderWidth: state === 'due' ? 1 : 0.5,
        borderColor:
          state === 'due' ? colors.teal : colors.border.tertiary,
      }}
    >
      <View className="flex-row justify-between items-start gap-3">
        <View className="flex-1">
          <Text
            className="text-sm font-medium text-txt-primary"
            numberOfLines={1}
          >
            {item.peptide.name}
          </Text>
          <Text className="text-xs text-txt-secondary mt-0.5">
            {item.dose_mcg} mcg · {item.frequency}
            {item.active_vial
              ? ` · ${item.active_vial.concentration_mcg_per_unit.toFixed(1)} mcg/unit`
              : ''}
          </Text>
          {peptideCycle && (
            <View className="mt-1.5">
              <Text className="text-[11px] text-txt-tertiary mb-0.5">
                Day {peptideCycle.day} / {peptideCycle.total}
              </Text>
              <View
                className="h-1 w-24 rounded-full overflow-hidden"
                style={{ backgroundColor: colors.bg.secondary }}
              >
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(peptideCycle.pct * 100, 100)}%`,
                    backgroundColor: 'rgba(29,158,117,0.5)',
                  }}
                />
              </View>
            </View>
          )}
        </View>
        <View className="pt-0.5">
          {state === 'logged' ? (
            <View
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: colors.bg.secondary }}
            >
              <Text className="text-[10px] font-medium text-txt-secondary">
                Logged {formatTime(item.todays_logs[0].administered_at)}
              </Text>
            </View>
          ) : (
            <View className="px-2 py-0.5 rounded-full bg-teal">
              <Text className="text-[10px] font-medium text-white">
                Due now
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  )
}
```

- [ ] **Step 5: Create `apps/mobile/components/FAB.tsx`**

```tsx
import { Pressable } from 'react-native'
import { Plus } from 'lucide-react-native'

interface Props {
  onPress: () => void
}

export default function FAB({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="absolute right-4 bottom-4 w-10 h-10 bg-teal rounded-full items-center justify-center shadow-lg"
      accessibilityLabel="Log dose"
    >
      <Plus size={20} color="#fff" strokeWidth={2.5} />
    </Pressable>
  )
}
```

- [ ] **Step 6: Create `apps/mobile/components/ActiveInSystemSection.tsx`**

```tsx
import { View, Text } from 'react-native'
import {
  useDecayData,
  type DecayPeptideResult,
} from '../hooks/useDecayData'
import type { HomeProtocolPeptide } from '../hooks/useHomeData'
import { colors } from '../lib/colors'

function formatClearLabel(timeUntilClearHours: number): string {
  if (timeUntilClearHours <= 0) return 'cleared'
  if (timeUntilClearHours < 1) return 'clears in <1h'
  if (timeUntilClearHours < 24)
    return `clears in ~${Math.round(timeUntilClearHours)}h`
  const days = Math.round(timeUntilClearHours / 24)
  return `clears in ~${days}d`
}

function PeptideDecayRow({ result }: { result: DecayPeptideResult }) {
  const barPct = Math.min(
    100,
    (result.currentRemainingMcg / result.peakRemainingMcg) * 100
  )
  const mcgDisplay =
    result.currentRemainingMcg < 0.5
      ? '< 1 mcg'
      : result.currentRemainingMcg < 1000
      ? `${result.currentRemainingMcg.toFixed(1)} mcg`
      : `${(result.currentRemainingMcg / 1000).toFixed(2)} mg`

  const isActive = result.currentRemainingMcg >= 0.5

  return (
    <View>
      <View className="flex-row items-baseline justify-between mb-1.5">
        <View className="flex-row items-baseline gap-2 flex-1">
          <Text
            className="text-[13px] font-medium text-txt-primary"
            numberOfLines={1}
          >
            {result.peptideName}
          </Text>
          <Text className="text-[11px] text-txt-tertiary">
            {formatClearLabel(result.timeUntilClearHours)}
          </Text>
        </View>
        <Text
          className="text-xs font-medium ml-3"
          style={{
            color: isActive ? colors.teal : colors.text.tertiary,
            fontVariant: ['tabular-nums'],
          }}
        >
          {mcgDisplay}
        </Text>
      </View>
      <View
        className="h-[3px] w-full rounded-full overflow-hidden"
        style={{ backgroundColor: colors.bg.tertiary }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${barPct}%`,
            backgroundColor: isActive
              ? colors.teal
              : colors.text.tertiary,
          }}
        />
      </View>
    </View>
  )
}

export default function ActiveInSystemSection({
  items,
}: {
  items: HomeProtocolPeptide[]
}) {
  const { data } = useDecayData(items)
  const activeResults = data?.results ?? []

  if (activeResults.length === 0) return null

  return (
    <View className="px-4 mt-4 mb-1">
      <Text className="text-[13px] font-medium uppercase tracking-widest text-txt-tertiary mb-3">
        Active in system
      </Text>
      <View className="gap-3.5">
        {activeResults.map((result) => (
          <PeptideDecayRow
            key={result.protocolPeptideId}
            result={result}
          />
        ))}
      </View>
    </View>
  )
}
```

- [ ] **Step 7: Create `apps/mobile/components/LogDoseSheet.tsx`**

Port from `apps/web/src/components/LogDoseSheet.tsx`. Replace vaul Drawer with @gorhom/bottom-sheet.

```tsx
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { useLogDose } from '../hooks/useLogDose'
import type { HomeProtocolPeptide } from '../hooks/useHomeData'
import { colors } from '../lib/colors'
import { FieldLabel } from './ui/FieldLabel'

const INJECTION_SITES = [
  'Left abdomen',
  'Right abdomen',
  'Left thigh',
  'Right thigh',
  'Left deltoid',
  'Right deltoid',
]

interface Props {
  item: HomeProtocolPeptide | null
  open: boolean
  onClose: () => void
  onDepleted?: (item: HomeProtocolPeptide) => void
}

export default function LogDoseSheet({
  item,
  open,
  onClose,
  onDepleted,
}: Props) {
  const logDose = useLogDose()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ['85%'], [])

  const [injectionSite, setInjectionSite] = useState('')
  const [weightLbs, setWeightLbs] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (item) {
      setInjectionSite('')
      setWeightLbs('')
      setBodyFat('')
      setNotes('')
    }
  }, [item])

  useEffect(() => {
    if (open) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [open])

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    []
  )

  if (!item) return null

  const concentration = item.active_vial?.concentration_mcg_per_unit ?? null
  const unitsDrawn = concentration ? item.dose_mcg / concentration : null
  const isDepletingVial =
    item.active_vial &&
    unitsDrawn !== null &&
    (item.active_vial.units_remaining ?? 0) - unitsDrawn <= 0

  async function handleSave() {
    if (!item) return
    const today = new Date().toISOString().split('T')[0]
    const administeredAt = `${today}T${new Date().toTimeString().slice(0, 5)}:00`

    await logDose.mutateAsync({
      protocol_peptide_id: item.id,
      vial_id: item.active_vial?.id ?? null,
      administered_at: administeredAt,
      dose_mcg: item.dose_mcg,
      units_drawn: unitsDrawn,
      injection_site: injectionSite || null,
      notes: notes || null,
      weight_lbs: weightLbs ? Number(weightLbs) : null,
      body_fat_pct: bodyFat ? Number(bodyFat) : null,
    })

    if (isDepletingVial && onDepleted) {
      onClose()
      onDepleted(item)
    } else {
      onClose()
    }
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.bg.primary }}
      handleIndicatorStyle={{ backgroundColor: colors.border.secondary }}
    >
      <ScrollView className="flex-1 px-4 pb-6">
        <Text className="text-base font-medium text-txt-primary mt-2 mb-5">
          Log {item.peptide.name}
        </Text>

        <View className="gap-4">
          {/* Dose + Units */}
          <View className="flex-row gap-2">
            <View className="flex-1 gap-1">
              <FieldLabel>Dose</FieldLabel>
              <View
                className="h-10 px-3 justify-center bg-bg-secondary rounded-lg"
                style={{
                  borderWidth: 1,
                  borderColor: colors.border.tertiary,
                }}
              >
                <Text className="text-sm text-txt-tertiary">
                  {item.dose_mcg} mcg
                </Text>
              </View>
            </View>
            <View className="flex-1 gap-1">
              <FieldLabel>Units drawn</FieldLabel>
              <View
                className="h-10 px-3 justify-center bg-bg-secondary rounded-lg"
                style={{
                  borderWidth: 1,
                  borderColor: colors.border.tertiary,
                }}
              >
                <Text className="text-sm text-txt-tertiary">
                  {unitsDrawn !== null ? unitsDrawn.toFixed(2) : '—'}
                </Text>
              </View>
            </View>
          </View>

          {/* Injection site buttons */}
          <View className="gap-1">
            <FieldLabel>Injection site</FieldLabel>
            <View className="flex-row flex-wrap gap-2">
              {INJECTION_SITES.map((site) => (
                <Pressable
                  key={site}
                  onPress={() =>
                    setInjectionSite(injectionSite === site ? '' : site)
                  }
                  className="px-3 py-1.5 rounded-full"
                  style={{
                    borderWidth: 1,
                    borderColor:
                      injectionSite === site
                        ? colors.teal
                        : colors.border.tertiary,
                    backgroundColor:
                      injectionSite === site
                        ? 'rgba(29,158,117,0.1)'
                        : 'transparent',
                  }}
                >
                  <Text
                    className="text-[13px]"
                    style={{
                      color:
                        injectionSite === site
                          ? colors.teal
                          : colors.text.secondary,
                    }}
                  >
                    {site}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Vial depletion warning */}
          {isDepletingVial && (
            <View
              className="px-3 py-2.5 rounded-lg"
              style={{ backgroundColor: colors.warning.bg }}
            >
              <Text
                className="text-[13px]"
                style={{ color: colors.warning.text }}
              >
                This will finish your vial. You'll be prompted to set up a new
                one after saving.
              </Text>
            </View>
          )}

          {/* Optional section */}
          <View
            className="pt-4 mt-1 gap-4"
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.border.tertiary,
            }}
          >
            <Text className="text-[11px] text-txt-tertiary -mb-2">
              Optional
            </Text>
            <View className="flex-row gap-2">
              <View className="flex-1 gap-1">
                <FieldLabel>Weight (lbs)</FieldLabel>
                <TextInput
                  value={weightLbs}
                  onChangeText={setWeightLbs}
                  keyboardType="decimal-pad"
                  placeholder="185"
                  placeholderTextColor={colors.text.tertiary}
                  className="h-10 px-3 text-sm text-txt-primary bg-bg-secondary rounded-lg"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border.tertiary,
                  }}
                />
              </View>
              <View className="flex-1 gap-1">
                <FieldLabel>Body fat %</FieldLabel>
                <TextInput
                  value={bodyFat}
                  onChangeText={setBodyFat}
                  keyboardType="decimal-pad"
                  placeholder="18"
                  placeholderTextColor={colors.text.tertiary}
                  className="h-10 px-3 text-sm text-txt-primary bg-bg-secondary rounded-lg"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border.tertiary,
                  }}
                />
              </View>
            </View>
            <View className="gap-1">
              <FieldLabel>Notes</FieldLabel>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Any observations..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={3}
                className="px-3 py-2.5 text-sm text-txt-primary bg-bg-secondary rounded-lg"
                style={{
                  borderWidth: 1,
                  borderColor: colors.border.tertiary,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save button */}
      <View
        className="px-4 pb-8 pt-3"
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border.primary,
        }}
      >
        <Pressable
          onPress={handleSave}
          disabled={logDose.isPending}
          className="w-full h-11 bg-teal rounded-lg items-center justify-center"
          style={{ opacity: logDose.isPending ? 0.6 : 1 }}
        >
          <Text className="text-sm font-medium text-white">
            {logDose.isPending ? 'Saving...' : 'Save dose'}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  )
}
```

- [ ] **Step 8: Create `apps/mobile/components/SyringeVisual.tsx`**

Port using react-native-svg instead of DOM SVG:

```tsx
import { View, Text } from 'react-native'
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg'
import { colors } from '../lib/colors'

interface Props {
  syringeSize: 30 | 50 | 100
  unitsToDraw: number | null
  doseMcg?: number | null
}

function formatUnits(u: number): string {
  return Number.isInteger(u) || u >= 10 ? String(Math.round(u)) : u.toFixed(1)
}

export default function SyringeVisual({
  syringeSize,
  unitsToDraw,
  doseMcg,
}: Props) {
  const overflow = unitsToDraw !== null && unitsToDraw > syringeSize
  const fillPct =
    unitsToDraw !== null ? Math.min(unitsToDraw / syringeSize, 1) : 0

  const majorInterval = syringeSize === 100 ? 10 : 5
  const minorInterval = syringeSize === 100 ? 2 : 1

  const W = 300
  const BAR_Y = 16
  const BAR_H = 22
  const LABEL_Y = BAR_Y + BAR_H + 12
  const SVG_H = LABEL_Y + 4

  const ticks: { u: number; major: boolean }[] = []
  for (let u = minorInterval; u <= syringeSize; u += minorInterval) {
    ticks.push({ u, major: u % majorInterval === 0 })
  }

  const xOf = (u: number) => (u / syringeSize) * W

  return (
    <View
      className="rounded-xl px-4 pt-4 pb-3"
      style={{ backgroundColor: colors.bg.secondary }}
    >
      {unitsToDraw !== null && (
        <Text className="text-[13px] text-txt-primary mb-3">
          {doseMcg != null
            ? `To have a dose of ${doseMcg} mcg pull the syringe to ${formatUnits(unitsToDraw)}`
            : `Pull the syringe to ${formatUnits(unitsToDraw)}`}
        </Text>
      )}

      <Svg width="100%" height={SVG_H} viewBox={`0 0 ${W} ${SVG_H}`}>
        <Rect
          x={0}
          y={BAR_Y}
          width={W}
          height={BAR_H}
          rx={3}
          fill={colors.bg.primary}
          stroke={colors.border.tertiary}
          strokeWidth={1}
        />
        {fillPct > 0 && (
          <Rect
            x={0}
            y={BAR_Y}
            width={fillPct * W}
            height={BAR_H}
            rx={3}
            fill={overflow ? '#ef4444' : '#38bdf8'}
          />
        )}
        {ticks.map(({ u, major }) => (
          <G key={u}>
            <Line
              x1={xOf(u)}
              y1={BAR_Y}
              x2={xOf(u)}
              y2={BAR_Y + BAR_H / 2}
              stroke={colors.text.primary}
              strokeWidth={major ? 1.5 : 0.75}
              opacity={major ? 0.6 : 0.3}
            />
            {major && (
              <SvgText
                x={xOf(u)}
                y={LABEL_Y}
                textAnchor="middle"
                fontSize={9}
                fill={colors.text.secondary}
              >
                {u}
              </SvgText>
            )}
          </G>
        ))}
        {unitsToDraw !== null && !overflow && unitsToDraw > 0 && (
          <Line
            x1={xOf(unitsToDraw)}
            y1={BAR_Y - 1}
            x2={xOf(unitsToDraw)}
            y2={BAR_Y + BAR_H + 1}
            stroke="rgba(0,0,0,0.6)"
            strokeWidth={2}
          />
        )}
      </Svg>

      {overflow && (
        <Text className="text-[11px] mt-1" style={{ color: '#ef4444' }}>
          Exceeds {syringeSize}u capacity — split into multiple draws.
        </Text>
      )}
    </View>
  )
}
```

- [ ] **Step 9: Commit**

```bash
git add apps/mobile/components/
git commit -m "feat: port all shared components to React Native"
```

---

### Task 8: Port Home screen

**Files:**
- Create: `apps/mobile/app/(app)/(tabs)/index.tsx`

- [ ] **Step 1: Create Home screen**

Port from `apps/web/src/pages/Home.tsx`:

```tsx
import { useState } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useHomeData } from '../../../hooks/useHomeData'
import { useProfile } from '../../../hooks/useSettings'
import CycleProgressBar from '../../../components/CycleProgressBar'
import DoseCard from '../../../components/DoseCard'
import LogDoseSheet from '../../../components/LogDoseSheet'
import FAB from '../../../components/FAB'
import ActiveInSystemSection from '../../../components/ActiveInSystemSection'
import { getPeptideCycleProgress } from '../../../lib/cycleUtils'
import { Spinner } from '../../../components/ui/Spinner'
import type { HomeProtocolPeptide } from '../../../hooks/useHomeData'

export default function HomeScreen() {
  const router = useRouter()
  const { data, isLoading, error } = useHomeData()
  const { data: profile } = useProfile()
  const [sheetItem, setSheetItem] = useState<HomeProtocolPeptide | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  function openSheet(item: HomeProtocolPeptide) {
    setSheetItem(item)
    setSheetOpen(true)
  }

  function openFABSheet() {
    const unlogged = data?.items.find((i) => i.todays_logs.length === 0)
    const target = unlogged ?? data?.items[0] ?? null
    setSheetItem(target)
    setSheetOpen(true)
  }

  function handleDepleted(item: HomeProtocolPeptide) {
    router.push({
      pathname: '/(app)/vial-setup',
      params: {
        protocolId: item.protocol_id,
        data: JSON.stringify([{ ...item, peptide: item.peptide }]),
      },
    })
  }

  if (isLoading) return <Spinner />

  if (error) {
    return (
      <View className="px-4 pt-10">
        <Text className="text-[13px] text-txt-danger">
          Failed to load data.
        </Text>
      </View>
    )
  }

  const { protocol, items } = data ?? { protocol: null, items: [] }

  if (!protocol) {
    if (profile && !profile.onboarding_completed) {
      return (
        <View className="flex-1 items-center justify-center px-6 bg-bg-primary">
          <Text className="text-base font-medium text-txt-primary mb-2">
            Welcome
          </Text>
          <Text className="text-[13px] text-txt-secondary text-center mb-6">
            Before creating a protocol, tell us a bit about yourself so we can
            personalise your experience.
          </Text>
          <Link href="/(app)/onboarding" asChild>
            <Pressable className="h-11 px-6 bg-teal rounded-lg items-center justify-center">
              <Text className="text-sm font-medium text-white">
                Set up my profile
              </Text>
            </Pressable>
          </Link>
          <Link href="/(app)/protocols/new" asChild>
            <Pressable className="mt-3">
              <Text className="text-[13px] text-txt-secondary">
                Skip — create a protocol
              </Text>
            </Pressable>
          </Link>
        </View>
      )
    }

    return (
      <View className="flex-1 items-center justify-center px-6 bg-bg-primary">
        <Text className="text-base font-medium text-txt-primary mb-2">
          No active protocol
        </Text>
        <Text className="text-[13px] text-txt-secondary text-center mb-6">
          Create a protocol to start tracking your doses.
        </Text>
        <Link href="/(app)/protocols/new" asChild>
          <Pressable className="h-11 px-6 bg-teal rounded-lg items-center justify-center">
            <Text className="text-sm font-medium text-white">
              Create protocol
            </Text>
          </Pressable>
        </Link>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-bg-primary">
      <ScrollView className="flex-1">
        <View className="px-4 pt-5">
          <Text className="text-xl font-medium text-txt-primary">
            {new Date().toLocaleDateString([], {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>

        <CycleProgressBar protocol={protocol} />
        <ActiveInSystemSection items={items} />

        <View className="px-4 mt-1 gap-2.5 pb-6">
          <Text className="text-[13px] font-medium uppercase tracking-widest text-txt-tertiary mb-1">
            Doses
          </Text>
          {items.length === 0 ? (
            <Text className="text-sm text-txt-secondary">
              No peptides in this protocol.
            </Text>
          ) : (
            items.map((item) => (
              <DoseCard
                key={item.id}
                item={item}
                onLog={openSheet}
                peptideCycle={getPeptideCycleProgress(item, protocol)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <FAB onPress={openFABSheet} />

      <LogDoseSheet
        item={sheetItem}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onDepleted={handleDepleted}
      />
    </View>
  )
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd apps/mobile && npx expo start --no-dev --minify 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/\(app\)/\(tabs\)/index.tsx
git commit -m "feat: port Home screen to React Native"
```

---

### Task 9: Port Calculator screen

**Files:**
- Create: `apps/mobile/app/(app)/(tabs)/calc.tsx`

- [ ] **Step 1: Create Calculator screen**

Port from `apps/web/src/pages/Calculator.tsx`. Replace HTML inputs with `<TextInput>`, buttons with `<Pressable>`. Reuse `SyringeVisual`. The calculation logic is unchanged.

Same pattern as Home: `<View>`, `<Text>`, `<TextInput>`, `<Pressable>`, NativeWind classes. Use `keyboardType="decimal-pad"` for number inputs. Use `useRouter()` instead of `useNavigate()`.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/\(app\)/\(tabs\)/calc.tsx
git commit -m "feat: port Calculator screen to React Native"
```

---

### Task 10: Port Peptide Database screen

**Files:**
- Create: `apps/mobile/app/(app)/(tabs)/peptides.tsx`

- [ ] **Step 1: Create Peptides screen**

Port from `apps/web/src/pages/PeptideDatabase.tsx`. Use `<FlatList>` for the peptide list. Replace `<Search>` icon from lucide-react with lucide-react-native. Search bar uses `<TextInput>`.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/\(app\)/\(tabs\)/peptides.tsx
git commit -m "feat: port Peptide Database screen to React Native"
```

---

### Task 11: Port Settings screen

**Files:**
- Create: `apps/mobile/app/(app)/(tabs)/settings.tsx`

- [ ] **Step 1: Create Settings screen**

Port from `apps/web/src/pages/Settings.tsx`. This is the largest screen. Key changes:
- `<Link to="...">` → `<Link href="...">` from expo-router
- `<input>` → `<TextInput>`
- `<select>` → row of `<Pressable>` buttons (no native `<select>` in RN)
- `useNavigate()` → `useRouter()`
- All `className` with CSS vars → NativeWind + `colors` constants

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/\(app\)/\(tabs\)/settings.tsx
git commit -m "feat: port Settings screen to React Native"
```

---

### Task 12: Port Progress screen

**Files:**
- Create: `apps/mobile/app/(app)/(tabs)/progress.tsx`

- [ ] **Step 1: Create Progress screen**

Port from `apps/web/src/pages/Progress.tsx`. This is the most complex screen. Key changes:
- **Log section**: `<FlatList>` for history entries instead of `.map()`
- **Stats section**: Replace Recharts `<LineChart>` with victory-native `<VictoryChart>` + `<VictoryLine>`
- **Photos section**: Replace `<input type="file">` with `expo-image-picker`. Replace `File` with blob URI from the picker. Grid uses `<FlatList numColumns={2}>`.
- **Segmented control**: Row of `<Pressable>` buttons

Victory-native chart replacement for the bar chart in MetricCards:
```tsx
import { VictoryBar, VictoryChart, VictoryAxis } from 'victory-native'
```

And for the line charts in StatsSection:
```tsx
import { VictoryLine, VictoryChart, VictoryAxis } from 'victory-native'
```

- [ ] **Step 2: Update `usePhotos` for React Native**

The `useUploadPhoto` hook uses `File` which doesn't exist in RN. Create a helper:

```ts
// In usePhotos.ts, change the mutationFn to accept { uri, filename, type }
// instead of { file: File }
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/\(app\)/\(tabs\)/progress.tsx apps/mobile/hooks/usePhotos.ts
git commit -m "feat: port Progress screen with victory-native charts and expo-image-picker"
```

---

### Task 13: Port Onboarding flow

**Files:**
- Create: `apps/mobile/app/(app)/onboarding.tsx`

- [ ] **Step 1: Create Onboarding screen**

Port from `apps/web/src/pages/Onboarding.tsx`. Same form, RN primitives. Use `KeyboardAvoidingView` + `ScrollView`. Goal pills use `<Pressable>` with teal border toggle. Weight unit toggle same pattern. `useRouter()` for navigation, `useLocalSearchParams()` for `?edit=true`.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/\(app\)/onboarding.tsx
git commit -m "feat: port Onboarding flow to React Native"
```

---

### Task 14: Port Protocol Builder flow

**Files:**
- Create: `apps/mobile/app/(app)/protocols/new.tsx`
- Create: `apps/mobile/app/(app)/protocols/[id]/edit.tsx`

- [ ] **Step 1: Create shared ProtocolBuilder component**

Port from `apps/web/src/pages/ProtocolBuilder.tsx`. This is a multi-step form with local state. Create the component in `apps/mobile/components/ProtocolBuilder.tsx` and reference from both route files.

Key changes:
- Step indicator: `<View>` with `<View>` circles instead of `<div>` 
- `<select>` for frequency → row of `<Pressable>` or a modal picker
- Day-of-week toggle → same `<Pressable>` pattern
- AddPeptideSheet → full-screen modal `<View>` (same as web's fixed overlay, but using RN)
- `<textarea>` → `<TextInput multiline>`
- `useParams()` → `useLocalSearchParams()`

- [ ] **Step 2: Create route files that reference the component**

`apps/mobile/app/(app)/protocols/new.tsx`:
```tsx
import ProtocolBuilder from '../../../components/ProtocolBuilder'
export default function NewProtocol() {
  return <ProtocolBuilder />
}
```

`apps/mobile/app/(app)/protocols/[id]/edit.tsx`:
```tsx
import { useLocalSearchParams } from 'expo-router'
import ProtocolBuilder from '../../../../components/ProtocolBuilder'
export default function EditProtocol() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <ProtocolBuilder editId={id} />
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/\(app\)/protocols/ apps/mobile/components/ProtocolBuilder.tsx
git commit -m "feat: port Protocol Builder to React Native"
```

---

### Task 15: Port Vial Setup flow

**Files:**
- Create: `apps/mobile/app/(app)/vial-setup.tsx`

- [ ] **Step 1: Create VialSetup screen**

Port from `apps/web/src/pages/VialSetup.tsx`. Since Expo Router doesn't support `location.state`, pass data via search params (JSON-encoded) or a lightweight store. The simplest approach: pass `protocolId` as a param, and fetch the protocol peptides from the API within the screen.

Alternative: use `useLocalSearchParams` with a `data` param that's a JSON string, decoded on mount.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/\(app\)/vial-setup.tsx
git commit -m "feat: port Vial Setup flow to React Native"
```

---

### Task 16: Update monorepo config and CLAUDE.md

**Files:**
- Modify: `package.json` (root)
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update root `package.json` scripts**

Add/update scripts for the mobile app:

```json
{
  "scripts": {
    "dev": "pnpm --parallel --filter './apps/*' dev",
    "dev:api": "pnpm --filter api dev",
    "dev:mobile": "pnpm --filter mobile dev",
    "build": "pnpm --filter './packages/*' build && pnpm --filter './apps/*' build",
    "typecheck": "pnpm --recursive typecheck"
  }
}
```

- [ ] **Step 2: Update CLAUDE.md**

Update the monorepo structure, commands, and architecture sections to reflect `apps/mobile` replacing `apps/web`. Remove Capacitor, Vite, and web-specific references. Add Expo commands.

- [ ] **Step 3: Commit**

```bash
git add package.json CLAUDE.md
git commit -m "chore: update monorepo config and CLAUDE.md for Expo migration"
```

---

### Task 17: Delete `apps/web`

**Files:**
- Delete: `apps/web/` (entire directory)

- [ ] **Step 1: Verify mobile app compiles and runs**

```bash
cd apps/mobile && npx tsc --noEmit
```

- [ ] **Step 2: Remove `apps/web`**

```bash
rm -rf apps/web
```

- [ ] **Step 3: Clean up root workspace references**

Verify `pnpm-workspace.yaml` still works with just `apps/mobile` and `apps/api`.

```bash
pnpm install
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove apps/web (migration to Expo complete)"
```

---

### Task 18: Smoke test and verify

- [ ] **Step 1: Install all dependencies**

```bash
pnpm install
```

- [ ] **Step 2: Type check the mobile app**

```bash
cd apps/mobile && npx tsc --noEmit
```

- [ ] **Step 3: Start the Expo dev server**

```bash
cd apps/mobile && npx expo start
```

- [ ] **Step 4: Test on iOS Simulator or Android Emulator**

Verify each tab screen loads, navigation works, and the auth flow functions.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: verify Expo migration passes typecheck and starts"
```
