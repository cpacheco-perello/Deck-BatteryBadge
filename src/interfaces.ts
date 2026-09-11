export type BatteryBadgeSize = 'compact' | 'regular' | 'large'
export type BatteryBadgeCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface PluginConfig {
  installationId?: string
  filterDevices: string[]
  showAllApps: boolean
  // Which corner of the game page the badge is pinned to, plus how far it sits
  // from that corner. Anchoring beats absolute coordinates because right and
  // bottom edges follow the screen instead of assuming a 1280x800 panel.
  batteryBadgeCorner: BatteryBadgeCorner
  batteryBadgeOffsetX: number
  batteryBadgeOffsetY: number
  batteryBadgeSize: BatteryBadgeSize
  useBatteryTrackerTdp: boolean
  reportDraft?: ReportDraft
  notificationSettings?: NotificationSettings
}

export interface NotificationSettings {
  onGameStartWithReports: boolean
  onGameStartWithoutReports: boolean
  onGameStopWithReports: boolean
  onGameStopWithoutReports: boolean
  notifyOncePerGame: boolean
}

export type NotificationEventKey =
  | 'onGameStartWithReports'
  | 'onGameStartWithoutReports'
  | 'onGameStopWithReports'
  | 'onGameStopWithoutReports'

export type NotificationRecord = Record<string, Partial<Record<NotificationEventKey, boolean>>>

export type PluginPage = 'game_select' | 'search_results' | 'game_data' | 'plugin_config' | 'report_form'

export interface Devices {
  name: string
  description: string
}

export interface GameInfo {
  title: string
  appId?: number
  sortAs?: string
}

export interface GameSearchResult {
  gameName: string
  appId: number
  metadata: GameMetadata
}

export interface GameMetadata {
  poster: string | null
  hero: string | null
  banner: string | null
  background: string | null
}

export interface GameDetails {
  gameName: string
  appId?: number
  metadata: GameMetadata
  reports: GameReport[]
  external_reviews: ExternalReview[]
}



export interface GameReport {
  id: number
  number: number
  title: string
  html_url: string
  data: GameReportData
  reactions: GameReportReactions
  labels: {
    name: string
    color: string
    description: string
  }[]
  user: GitHubUser
  created_at: string // ISO 8601 formatted date string
  updated_at: string // ISO 8601 formatted date string
}

export interface GameReportReactions {
  reactions_thumbs_up: number
  reactions_thumbs_down: number
}

export interface GameReportData {
  summary: string
  game_name: string
  app_id: number
  launcher: string
  target_framerate: string
  average_battery_power_draw: string | null
  calculated_battery_life_minutes: number | null
  device: string
  os_version: string
  undervolt_applied: string | null
  steam_play_compatibility_tool_used: string
  compatibility_tool_version: string
  game_resolution: string
  custom_launch_options: string | null
  frame_limit: number | null
  disable_frame_limit: string
  enable_vrr: string
  allow_tearing: string
  half_rate_shading: string
  tdp_limit: number | null
  manual_gpu_clock: number | null
  scaling_mode: string
  scaling_filter: string
  game_display_settings: string
  game_graphics_settings: string
  additional_notes: string
}

export type ReportDraft = Record<string, any> & {
  images?: string[]
}

export interface GitHubUser {
  login: string
  avatar_url: string
}

export interface GitHubIssueLabel {
  id: number
  node_id: string
  url: string
  name: string
  color: string
  default: boolean
  description: string | null
}

export interface ExternalReview {
  id: number
  title: string
  html_url: string
  data: GameReportData
  source: {
    name: string
    avatar_url: string
    report_count: number
  }
  created_at: string
  updated_at: string
}
