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
