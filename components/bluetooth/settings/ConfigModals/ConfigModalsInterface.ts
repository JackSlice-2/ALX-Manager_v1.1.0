import { WifiData } from "@/components/utils/types"

export interface WiFiProps {
  onClose: () => void
  wifi: WifiData
  refreshWifi: any
}