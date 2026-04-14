import { useEffect, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  FlatList,
  Modal,
  useWindowDimensions,
} from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useLocalSearchParams } from 'expo-router'
import { Camera, Plus, X, ChevronLeft } from 'lucide-react-native'
import {
  VictoryBar,
  VictoryChart,
  VictoryLine,
  VictoryAxis,
} from 'victory-native'
import { useHistory } from '../../../hooks/useHistory'
import type { HistoryEntry } from '../../../hooks/useHistory'
import {
  usePhotos,
  useRecentDoseLogs,
  useUploadPhoto,
  type PhotoEntry,
  type RecentDoseLog,
} from '../../../hooks/usePhotos'
import { colors } from '../../../lib/colors'

type Section = 'log' | 'stats' | 'photos'
type MetricView = 'weight' | 'bf'

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (date.toDateString() === today.toDateString()) return `Today, ${timeStr}`
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Spinner() {
  return (
    <View className="items-center pt-10">
      <View
        style={{
          width: 20,
          height: 20,
          borderWidth: 2,
          borderColor: colors.teal,
          borderTopColor: 'transparent',
          borderRadius: 10,
        }}
      />
    </View>
  )
}

// ─── Log section ─────────────────────────────────────────────────────────────

function MetricCards({
  entries,
  view,
  onToggle,
}: {
  entries: HistoryEntry[]
  view: MetricView
  onToggle: (v: MetricView) => void
}) {
  const { width } = useWindowDimensions()
  const chartWidth = width - 32

  const withMetrics = entries.filter((e) => e.body_metric !== null)
  const latest = withMetrics[0]?.body_metric
  const weightKg = latest?.weight_kg ?? null
  const weightLbs = weightKg !== null ? (weightKg * 2.20462).toFixed(1) : null
  const bf = latest?.body_fat_pct ?? null

  const chartEntries = withMetrics.slice(0, 7).reverse()
  const chartData = chartEntries.map((e, idx) => ({
    x: idx,
    y:
      view === 'weight'
        ? e.body_metric!.weight_kg !== null
          ? e.body_metric!.weight_kg * 2.20462
          : 0
        : e.body_metric!.body_fat_pct ?? 0,
  }))
  const maxIdx = chartData.length - 1

  if (withMetrics.length === 0) return null

  return (
    <View className="px-4 mb-4">
      <View className="flex-row gap-2 mb-3">
        <Pressable
          onPress={() => onToggle('weight')}
          className="flex-1 rounded-lg px-3 py-2.5 bg-bg-secondary"
          style={view === 'weight' ? { borderWidth: 1, borderColor: colors.teal } : null}
        >
          <Text className="text-[18px] font-medium text-txt-primary">
            {weightLbs ?? '—'}
          </Text>
          <Text className="text-[10px] text-txt-tertiary mt-0.5">lbs</Text>
        </Pressable>
        <Pressable
          onPress={() => onToggle('bf')}
          className="flex-1 rounded-lg px-3 py-2.5 bg-bg-secondary"
          style={view === 'bf' ? { borderWidth: 1, borderColor: colors.teal } : null}
        >
          <Text className="text-[18px] font-medium text-txt-primary">
            {bf !== null ? `${bf}%` : '—'}
          </Text>
          <Text className="text-[10px] text-txt-tertiary mt-0.5">Body fat</Text>
        </Pressable>
      </View>
      {chartData.length > 1 && (
        <View style={{ height: 80 }}>
          <VictoryChart
            width={chartWidth}
            height={80}
            padding={{ top: 8, bottom: 8, left: 8, right: 8 }}
            domainPadding={{ x: 12 }}
          >
            <VictoryAxis
              style={{
                axis: { stroke: 'transparent' },
                tickLabels: { fill: 'transparent' },
              }}
            />
            <VictoryBar
              data={chartData}
              cornerRadius={{ top: 2 }}
              style={{
                data: {
                  fill: ({ datum }: any) =>
                    datum.x === maxIdx ? colors.teal : `${colors.teal}66`,
                  width: 14,
                },
              }}
            />
          </VictoryChart>
        </View>
      )}
    </View>
  )
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <View
      style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border.tertiary }}
    >
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center justify-between py-2.5"
      >
        <View className="flex-1 mr-2">
          <Text className="text-[13px] font-medium text-txt-primary">
            {entry.peptide?.name ?? '—'}
          </Text>
          {entry.injection_site ? (
            <Text className="text-[11px] text-txt-secondary mt-0.5">
              {entry.injection_site}
            </Text>
          ) : null}
        </View>
        <Text className="text-[11px] text-txt-secondary">
          {formatRelativeDate(entry.administered_at)}
        </Text>
      </Pressable>
      {expanded && (
        <View className="pb-3 gap-1">
          <Text className="text-[12px] text-txt-secondary">
            <Text className="text-txt-tertiary">Dose: </Text>
            {entry.dose_mcg} mcg
            {entry.units_drawn !== null ? ` · ${entry.units_drawn} units` : ''}
          </Text>
          {entry.body_metric?.weight_kg ? (
            <Text className="text-[12px] text-txt-secondary">
              <Text className="text-txt-tertiary">Weight: </Text>
              {(entry.body_metric.weight_kg * 2.20462).toFixed(1)} lbs
              {entry.body_metric.body_fat_pct !== null
                ? ` · ${entry.body_metric.body_fat_pct}% BF`
                : ''}
            </Text>
          ) : null}
          {entry.notes ? (
            <Text className="text-[12px] text-txt-secondary">
              <Text className="text-txt-tertiary">Notes: </Text>
              {entry.notes}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  )
}

function LogSection() {
  const { data, isLoading, error } = useHistory()
  const [search, setSearch] = useState('')
  const [metricView, setMetricView] = useState<MetricView>('weight')
  const filtered = (data ?? []).filter((e) =>
    e.peptide?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <View>
      <View className="px-4 pb-3">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by peptide…"
          placeholderTextColor={colors.text.tertiary}
          style={{
            height: 40,
            paddingHorizontal: 12,
            fontSize: 14,
            backgroundColor: colors.bg.secondary,
            borderColor: colors.border.tertiary,
            borderWidth: 1,
            borderRadius: 8,
            color: colors.text.primary,
          }}
        />
      </View>

      {isLoading && <Spinner />}
      {error ? (
        <Text className="px-4 text-[13px]" style={{ color: colors.text.danger }}>
          Failed to load history.
        </Text>
      ) : null}
      {!isLoading && !error && (
        <>
          <MetricCards entries={data ?? []} view={metricView} onToggle={setMetricView} />
          <View className="px-4">
            {filtered.length === 0 ? (
              <Text className="text-[14px] text-txt-secondary pt-4">
                {search ? 'No results.' : 'No doses logged yet.'}
              </Text>
            ) : (
              filtered.map((entry) => <HistoryRow key={entry.id} entry={entry} />)
            )}
          </View>
        </>
      )}
    </View>
  )
}

// ─── Stats section ────────────────────────────────────────────────────────────

function StatsChart({
  label,
  data,
  width,
}: {
  label: string
  data: { x: number; y: number }[]
  width: number
}) {
  if (data.length < 2) return null
  return (
    <View className="mb-6">
      <Text className="text-[11px] font-medium uppercase tracking-widest text-txt-secondary mb-3">
        {label}
      </Text>
      <VictoryChart
        width={width}
        height={140}
        padding={{ top: 8, bottom: 28, left: 40, right: 8 }}
      >
        <VictoryAxis
          style={{
            axis: { stroke: 'transparent' },
            grid: { stroke: 'transparent' },
            ticks: { stroke: 'transparent' },
            tickLabels: { fill: colors.text.tertiary, fontSize: 10 },
          }}
          tickCount={2}
        />
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: 'transparent' },
            grid: { stroke: 'transparent' },
            ticks: { stroke: 'transparent' },
            tickLabels: { fill: colors.text.tertiary, fontSize: 10 },
          }}
        />
        <VictoryLine
          data={data}
          style={{ data: { stroke: colors.teal, strokeWidth: 2 } }}
        />
      </VictoryChart>
    </View>
  )
}

function StatsSection() {
  const { data, isLoading } = useHistory()
  const { width } = useWindowDimensions()
  const chartWidth = width - 32

  if (isLoading) return <Spinner />

  const withMetrics = (data ?? [])
    .filter((e) => e.body_metric !== null)
    .slice(0, 30)
    .reverse()

  if (withMetrics.length === 0) {
    return (
      <View className="px-4 pt-10 items-center">
        <Text className="text-[15px] font-medium text-txt-primary mb-1">
          No metrics yet
        </Text>
        <Text className="text-[13px] text-txt-secondary text-center">
          Log weight or body fat when recording a dose to see trends here.
        </Text>
      </View>
    )
  }

  const weightData = withMetrics
    .filter((e) => e.body_metric!.weight_kg !== null)
    .map((e, idx) => ({
      x: idx,
      y: parseFloat((e.body_metric!.weight_kg! * 2.20462).toFixed(1)),
    }))

  const bfData = withMetrics
    .filter((e) => e.body_metric!.body_fat_pct !== null)
    .map((e, idx) => ({ x: idx, y: e.body_metric!.body_fat_pct! }))

  const leanData = withMetrics
    .filter((e) => e.body_metric!.lean_mass_kg !== null)
    .map((e, idx) => ({
      x: idx,
      y: parseFloat(((e.body_metric!.lean_mass_kg ?? 0) * 2.20462).toFixed(1)),
    }))

  return (
    <View className="px-4 pt-2 pb-6">
      <StatsChart label="Weight (lbs)" data={weightData} width={chartWidth} />
      <StatsChart label="Body fat %" data={bfData} width={chartWidth} />
      <StatsChart label="Lean mass (lbs)" data={leanData} width={chartWidth} />
    </View>
  )
}

// ─── Photos section ───────────────────────────────────────────────────────────

interface UploadSheetProps {
  previewUri: string
  recentLogs: RecentDoseLog[]
  onSave: (doseLogId: string, caption: string | null) => void
  onClose: () => void
  isSaving: boolean
}

function UploadSheet({
  previewUri,
  recentLogs,
  onSave,
  onClose,
  isSaving,
}: UploadSheetProps) {
  const [selectedLogId, setSelectedLogId] = useState<string>(recentLogs[0]?.id ?? '')
  const [caption, setCaption] = useState('')

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <View className="flex-1 bg-bg-primary">
        <View
          className="flex-row items-center gap-3 px-4 pt-12 pb-4"
          style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border.primary }}
        >
          <Pressable onPress={onClose}>
            <ChevronLeft size={22} color={colors.text.secondary} />
          </Pressable>
          <Text className="text-[16px] font-medium text-txt-primary">Add photo</Text>
        </View>
        <ScrollView className="flex-1 px-4 py-5" contentContainerStyle={{ gap: 20 }}>
          <Image
            source={{ uri: previewUri }}
            style={{ width: '100%', height: 256, borderRadius: 8 }}
            contentFit="cover"
          />
          <View>
            <Text className="text-[10px] font-medium uppercase tracking-widest text-txt-secondary mb-2">
              Attach to dose log
            </Text>
            {recentLogs.length === 0 ? (
              <Text className="text-[13px] text-txt-secondary">No dose logs yet.</Text>
            ) : (
              <View
                style={{
                  borderRadius: 8,
                  borderWidth: 0.5,
                  borderColor: colors.border.tertiary,
                  overflow: 'hidden',
                }}
              >
                {recentLogs.map((log, idx) => {
                  const selected = selectedLogId === log.id
                  return (
                    <Pressable
                      key={log.id}
                      onPress={() => setSelectedLogId(log.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        backgroundColor: selected ? `${colors.teal}1a` : 'transparent',
                        borderBottomWidth: idx < recentLogs.length - 1 ? 0.5 : 0,
                        borderBottomColor: colors.border.tertiary,
                      }}
                    >
                      <Text className="text-[14px] text-txt-primary flex-1">
                        {log.peptide_name}
                      </Text>
                      <Text className="text-[11px] text-txt-secondary">
                        {formatDate(log.administered_at)}
                      </Text>
                      {selected && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: colors.teal,
                            marginLeft: 8,
                          }}
                        />
                      )}
                    </Pressable>
                  )
                })}
              </View>
            )}
          </View>
          <View>
            <Text className="text-[10px] font-medium uppercase tracking-widest text-txt-secondary mb-1">
              Caption (optional)
            </Text>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a note…"
              placeholderTextColor={colors.text.tertiary}
              style={{
                height: 40,
                paddingHorizontal: 12,
                fontSize: 14,
                backgroundColor: colors.bg.secondary,
                borderColor: colors.border.tertiary,
                borderWidth: 1,
                borderRadius: 8,
                color: colors.text.primary,
              }}
            />
          </View>
        </ScrollView>
        <View
          className="px-4 pt-3 pb-8"
          style={{ borderTopWidth: 0.5, borderTopColor: colors.border.primary }}
        >
          <Pressable
            onPress={() => onSave(selectedLogId, caption || null)}
            disabled={!selectedLogId || isSaving}
            className="w-full h-11 bg-teal rounded-lg items-center justify-center"
            style={{ opacity: !selectedLogId || isSaving ? 0.4 : 1 }}
          >
            <Text className="text-[14px] font-medium text-white">
              {isSaving ? 'Saving…' : 'Save photo'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

function PhotoViewer({ photo, onClose }: { photo: PhotoEntry; onClose: () => void }) {
  const peptideName = photo.dose_log?.protocol_peptide?.peptide?.name ?? null
  const administeredAt = photo.dose_log?.administered_at ?? null
  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen">
      <View className="flex-1 bg-black">
        <View className="flex-row items-center justify-between px-4 pt-14 pb-3">
          <Pressable onPress={onClose}>
            <X size={24} color="rgba(255,255,255,0.8)" />
          </Pressable>
          {administeredAt ? (
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              {formatDate(administeredAt)}
            </Text>
          ) : null}
        </View>
        <View className="flex-1 items-center justify-center px-4">
          <Image
            source={{ uri: photo.signed_url }}
            style={{ width: '100%', aspectRatio: 1, borderRadius: 4 }}
            contentFit="contain"
          />
        </View>
        {(peptideName || photo.caption) && (
          <View className="px-4 pt-3 pb-10">
            {peptideName ? (
              <Text style={{ fontSize: 14, fontWeight: '500', color: 'white' }}>
                {peptideName}
              </Text>
            ) : null}
            {photo.dose_log ? (
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                {photo.dose_log.dose_mcg} mcg
              </Text>
            ) : null}
            {photo.caption ? (
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                {photo.caption}
              </Text>
            ) : null}
          </View>
        )}
      </View>
    </Modal>
  )
}

function PhotosSection() {
  const { data: photos, isLoading, error } = usePhotos()
  const { data: recentLogs } = useRecentDoseLogs()
  const uploadPhoto = useUploadPhoto()
  const { width } = useWindowDimensions()

  const [pendingUri, setPendingUri] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<PhotoEntry | null>(null)

  async function handleAddPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    })
    if (result.canceled) return
    const asset = result.assets[0]
    setPendingUri(asset.uri)
    const res = await fetch(asset.uri)
    const blob = await res.blob()
    const ext = asset.uri.split('.').pop() ?? 'jpeg'
    const file = new File([blob], `photo.${ext}`, {
      type: asset.mimeType ?? `image/${ext}`,
    })
    setPendingFile(file)
  }

  function handleCloseUpload() {
    setPendingUri(null)
    setPendingFile(null)
  }

  async function handleSavePhoto(doseLogId: string, caption: string | null) {
    if (!pendingFile) return
    await uploadPhoto.mutateAsync({ file: pendingFile, doseLogId, caption })
    handleCloseUpload()
  }

  const isEmpty = !isLoading && !error && (photos ?? []).length === 0
  const colWidth = (width - 40) / 2

  return (
    <View>
      <View className="px-4 pb-3 items-end">
        <Pressable
          onPress={handleAddPhoto}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.teal,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel="Add photo"
        >
          <Plus size={18} color="white" />
        </Pressable>
      </View>

      {isLoading && <Spinner />}
      {error ? (
        <Text className="px-4 text-[13px]" style={{ color: colors.text.danger }}>
          Failed to load photos.
        </Text>
      ) : null}
      {isEmpty && (
        <View className="items-center px-6 pt-12">
          <Camera size={40} color={colors.text.tertiary} strokeWidth={1.25} />
          <Text className="text-[16px] font-medium text-txt-primary mt-3 mb-1">
            No photos yet
          </Text>
          <Text className="text-[13px] text-txt-secondary text-center">
            Tap + to add your first progress photo.
          </Text>
        </View>
      )}
      {!isLoading && !error && (photos ?? []).length > 0 && (
        <FlatList
          data={photos}
          numColumns={2}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          columnWrapperStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setViewingPhoto(item)}
              style={{
                width: colWidth,
                aspectRatio: 1,
                borderRadius: 8,
                overflow: 'hidden',
                backgroundColor: colors.bg.secondary,
              }}
            >
              <Image
                source={{ uri: item.signed_url }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)' }}>
                  {formatDate(item.taken_at)}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      {pendingUri && pendingFile && (
        <UploadSheet
          previewUri={pendingUri}
          recentLogs={recentLogs ?? []}
          onSave={handleSavePhoto}
          onClose={handleCloseUpload}
          isSaving={uploadPhoto.isPending}
        />
      )}
      {viewingPhoto && (
        <PhotoViewer photo={viewingPhoto} onClose={() => setViewingPhoto(null)} />
      )}
    </View>
  )
}

// ─── Segmented control ────────────────────────────────────────────────────────

function SegmentedControl({
  section,
  onChange,
}: {
  section: Section
  onChange: (s: Section) => void
}) {
  const options: { key: Section; label: string }[] = [
    { key: 'log', label: 'Log' },
    { key: 'stats', label: 'Stats' },
    { key: 'photos', label: 'Photos' },
  ]
  return (
    <View
      className="flex-row mx-4 mb-4 p-0.5 rounded-lg"
      style={{ backgroundColor: colors.bg.secondary }}
    >
      {options.map(({ key, label }) => {
        const selected = section === key
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={{
              flex: 1,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              backgroundColor: selected ? colors.bg.primary : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: selected ? colors.text.primary : colors.text.secondary,
              }}
            >
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const params = useLocalSearchParams<{ section?: string }>()
  const initialSection = (params.section as Section | undefined) ?? 'log'
  const [section, setSection] = useState<Section>(initialSection)

  useEffect(() => {
    const s = params.section as Section | undefined
    if (s && s !== section) setSection(s)
  }, [params.section])

  return (
    <View className="flex-1 bg-bg-primary">
      <ScrollView className="flex-1">
        <View className="px-4 pt-5 pb-3">
          <Text className="text-[20px] font-medium text-txt-primary">Progress</Text>
        </View>
        <SegmentedControl section={section} onChange={setSection} />
        {section === 'log' && <LogSection />}
        {section === 'stats' && <StatsSection />}
        {section === 'photos' && <PhotosSection />}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}
