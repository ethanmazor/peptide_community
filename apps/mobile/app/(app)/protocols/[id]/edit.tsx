import { useLocalSearchParams } from 'expo-router'
import ProtocolBuilder from '../../../../components/ProtocolBuilder'

export default function EditProtocol() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <ProtocolBuilder editId={id} />
}
