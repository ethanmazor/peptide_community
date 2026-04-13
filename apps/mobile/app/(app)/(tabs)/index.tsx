// apps/mobile/app/(app)/(tabs)/index.tsx
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
