import { View, ActivityIndicator } from 'react-native'

export function Spinner() {
  return (
    <View className="flex-1 items-center justify-center pt-20">
      <ActivityIndicator color="#1D9E75" />
    </View>
  )
}
