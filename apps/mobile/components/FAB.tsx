import { Pressable } from 'react-native'
import { Plus } from 'lucide-react-native'

export default function FAB({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel="Log dose"
      className="absolute right-4 bottom-4 w-10 h-10 bg-teal rounded-full items-center justify-center shadow-lg">
      <Plus size={20} color="#fff" strokeWidth={2.5} />
    </Pressable>
  )
}
