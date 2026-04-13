import { useState } from 'react'
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
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
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.replace('/(app)/(tabs)')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSignupDone(true)
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setError(null)
    const redirectUrl = Linking.createURL('/auth/callback')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
    })
    if (error) { setError(error.message); return }
    if (data.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)
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
        <Text className="text-xl font-medium text-txt-primary mb-3">Check your email</Text>
        <Text className="text-sm text-txt-secondary text-center">
          We sent a confirmation link to {email}. Click it to activate your account.
        </Text>
        <Pressable onPress={() => { setSignupDone(false); setTab('signin') }} className="mt-6">
          <Text className="text-sm font-medium text-teal">Back to sign in</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-bg-primary">
      <ScrollView contentContainerClassName="px-6 pt-16 pb-10" keyboardShouldPersistTaps="handled">
        <Text className="text-xl font-medium text-txt-primary mb-8">Peptide Tracker</Text>

        {/* Tabs */}
        <View className="flex-row mb-6" style={{ borderBottomWidth: 1, borderBottomColor: colors.border.primary }}>
          {(['signin', 'signup'] as const).map((t) => (
            <Pressable key={t} onPress={() => { setTab(t); setError(null) }} className="flex-1 pb-2.5 items-center"
              style={tab === t ? { borderBottomWidth: 2, borderBottomColor: colors.teal } : undefined}>
              <Text className="text-sm font-medium" style={{ color: tab === t ? colors.teal : colors.text.secondary }}>
                {t === 'signin' ? 'Sign in' : 'Sign up'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Form */}
        <View className="gap-3">
          <View className="gap-1">
            <Text className="text-[10px] font-medium uppercase tracking-widest text-txt-secondary">Email</Text>
            <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email"
              className="h-10 px-3 text-sm text-txt-primary bg-bg-secondary rounded-lg"
              style={{ borderWidth: 1, borderColor: colors.border.tertiary }} placeholderTextColor={colors.text.tertiary} />
          </View>
          <View className="gap-1">
            <Text className="text-[10px] font-medium uppercase tracking-widest text-txt-secondary">Password</Text>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry
              autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
              className="h-10 px-3 text-sm text-txt-primary bg-bg-secondary rounded-lg"
              style={{ borderWidth: 1, borderColor: colors.border.tertiary }} placeholderTextColor={colors.text.tertiary} />
          </View>
          {error && <Text className="text-[13px] text-txt-danger">{error}</Text>}
          <Pressable onPress={handleSubmit} disabled={loading}
            className="h-11 mt-1 bg-teal rounded-lg items-center justify-center" style={{ opacity: loading ? 0.6 : 1 }}>
            {loading ? <ActivityIndicator color="#fff" /> :
              <Text className="text-sm font-medium text-white">{tab === 'signin' ? 'Sign in' : 'Create account'}</Text>}
          </Pressable>
        </View>

        {/* Divider */}
        <View className="flex-row items-center gap-3 my-5">
          <View className="flex-1 h-px" style={{ backgroundColor: colors.border.primary }} />
          <Text className="text-xs text-txt-tertiary">or</Text>
          <View className="flex-1 h-px" style={{ backgroundColor: colors.border.primary }} />
        </View>

        {/* Google */}
        <Pressable onPress={handleGoogle} className="h-11 flex-row items-center justify-center rounded-lg"
          style={{ borderWidth: 1, borderColor: colors.border.primary }}>
          <Text className="text-sm font-medium text-txt-primary">Continue with Google</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
