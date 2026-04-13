import { useState, useMemo } from 'react'
import { View, Text, TextInput, Pressable, FlatList } from 'react-native'
import { Search } from 'lucide-react-native'
import { usePeptides } from '../../../hooks/usePeptides'
import { Spinner } from '../../../components/ui/Spinner'
import { colors } from '../../../lib/colors'
import type { Peptide } from '@peptide/types'

function formatHalfLife(hours: number | null): string {
  if (hours === null) return '—'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

function PeptideCard({
  peptide,
  expanded,
  onToggle,
}: {
  peptide: Peptide
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <Pressable
      onPress={onToggle}
      className="w-full bg-bg-secondary rounded-xl px-4 py-3"
    >
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center flex-wrap gap-2">
            <Text className="text-sm font-semibold text-txt-primary">
              {peptide.name}
            </Text>
            {peptide.alias ? (
              <View
                className="px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: `${colors.teal}1A` }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: colors.teal }}
                >
                  {peptide.alias}
                </Text>
              </View>
            ) : null}
          </View>
          <View className="mt-1 flex-row items-center gap-3">
            {peptide.half_life_hours !== null ? (
              <Text className="text-xs text-txt-secondary">
                t½ {formatHalfLife(peptide.half_life_hours)}
              </Text>
            ) : null}
            {peptide.typical_dose_mcg !== null ? (
              <Text className="text-xs text-txt-secondary">
                {peptide.typical_dose_mcg >= 1000
                  ? `${peptide.typical_dose_mcg / 1000}mg`
                  : `${peptide.typical_dose_mcg}mcg`}
                {peptide.typical_frequency ? ` · ${peptide.typical_frequency}` : ''}
              </Text>
            ) : null}
          </View>
        </View>
        <Text className="text-sm text-txt-secondary mt-0.5">
          {expanded ? '▲' : '▼'}
        </Text>
      </View>

      {expanded ? (
        <View
          className="mt-3 pt-3 gap-2"
          style={{ borderTopWidth: 1, borderTopColor: colors.border.primary }}
        >
          {peptide.description ? (
            <Text className="text-sm leading-relaxed text-txt-primary">
              {peptide.description}
            </Text>
          ) : null}
          <View
            className="self-start px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: peptide.is_default
                ? colors.bg.tertiary
                : `${colors.teal}1A`,
            }}
          >
            <Text
              className="text-xs font-medium"
              style={{
                color: peptide.is_default ? colors.text.secondary : colors.teal,
              }}
            >
              {peptide.is_default ? 'Library' : 'Your peptide'}
            </Text>
          </View>
        </View>
      ) : null}
    </Pressable>
  )
}

export default function PeptideDatabaseScreen() {
  const { data: peptides = [], isLoading } = usePeptides()
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return peptides
    return peptides.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.alias?.toLowerCase().includes(q) ?? false) ||
        (p.description?.toLowerCase().includes(q) ?? false),
    )
  }, [peptides, query])

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (isLoading) return <Spinner />

  return (
    <View className="flex-1 bg-bg-primary">
      {/* Header */}
      <View className="px-4 pt-5 pb-3">
        <Text className="text-xl font-medium text-txt-primary mb-3">
          Peptide Database
        </Text>

        {/* Search bar */}
        <View
          className="flex-row items-center gap-2 rounded-xl px-3 h-10"
          style={{ backgroundColor: colors.bg.secondary }}
        >
          <Search size={16} color={colors.text.tertiary} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search peptides…"
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            className="flex-1 text-sm text-txt-primary"
            style={{ color: colors.text.primary }}
          />
        </View>
      </View>

      {/* Count */}
      <View className="px-4 pb-2">
        <Text className="text-xs text-txt-tertiary uppercase tracking-widest font-medium">
          {filtered.length} {filtered.length === 1 ? 'peptide' : 'peptides'}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}
        renderItem={({ item }) => (
          <PeptideCard
            peptide={item}
            expanded={expandedId === item.id}
            onToggle={() => toggleExpanded(item.id)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center pt-16">
            <Text className="text-sm text-txt-secondary">No peptides found.</Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
      />
    </View>
  )
}
