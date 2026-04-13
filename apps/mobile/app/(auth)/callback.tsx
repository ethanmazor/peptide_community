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
