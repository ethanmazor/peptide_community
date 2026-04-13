import { Tabs } from 'expo-router'
import {
  Home, TrendingUp, Calculator, FlaskConical, Settings,
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
      <Tabs.Screen name="index" options={{
        title: 'Home',
        tabBarIcon: ({ color }) => <Home size={20} color={color} strokeWidth={1.75} />,
      }} />
      <Tabs.Screen name="progress" options={{
        title: 'Progress',
        tabBarIcon: ({ color }) => <TrendingUp size={20} color={color} strokeWidth={1.75} />,
      }} />
      <Tabs.Screen name="calc" options={{
        title: 'Calc',
        tabBarIcon: ({ color }) => <Calculator size={20} color={color} strokeWidth={1.75} />,
      }} />
      <Tabs.Screen name="peptides" options={{
        title: 'Peptides',
        tabBarIcon: ({ color }) => <FlaskConical size={20} color={color} strokeWidth={1.75} />,
      }} />
      <Tabs.Screen name="settings" options={{
        title: 'Settings',
        tabBarIcon: ({ color }) => <Settings size={20} color={color} strokeWidth={1.75} />,
      }} />
    </Tabs>
  )
}
