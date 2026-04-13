import { Text } from 'react-native'

export function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="text-[10px] font-medium uppercase tracking-widest text-txt-secondary mb-1">
      {children}
    </Text>
  )
}
