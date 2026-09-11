import { reportsApiBaseUrl } from '../constants'
import type { GameDetails, Devices, GameInfo, GameSearchResult, GitHubIssueLabel } from '../interfaces'
import { fetchNoCors } from '@decky/api'

// A 404 means the API has nothing for this title, which is a normal answer.
// Anything else is a failure, and callers must be able to tell the two apart
// instead of presenting a broken lookup as "this game has no data".
const assertLookupSucceeded = (res: Response, context: string): boolean => {
  if (res.ok) return true
  if (res.status === 404) return false
  console.error(`[decky-game-settings:deckVerifiedApi] ${context}: ${res.status} ${res.statusText}`)
  throw new Error(`${context} failed with status ${res.status}`)
}

export const fetchGameDataByAppId = async (appId: number): Promise<GameDetails | null> => {
  const url = `${reportsApiBaseUrl}/game_details?appid=${appId}&include_external=true`
  const res = await fetchNoCors(url, {
    method: 'GET',
  })
  if (!assertLookupSucceeded(res, 'Failed to fetch game by app ID')) {
    return null
  }
  return await res.json() as GameDetails
}

export const fetchGameDataByGameName = async (gameName: string): Promise<GameDetails | null> => {
  const url = `${reportsApiBaseUrl}/game_details?name=${encodeURIComponent(gameName)}&include_external=false`
  const res = await fetchNoCors(url, {
    method: 'GET',
  })
  if (!assertLookupSucceeded(res, 'Failed to fetch game by name')) {
    return null
  }
  return await res.json() as GameDetails
}

export const getGamesBySearchTerm = async (term: string): Promise<GameInfo[] | null> => {
  // The guard used &&, so a one or two character term slipped through to the API.
  if (!term || term.trim().length < 3) {
    return []
  }
  const url = `${reportsApiBaseUrl}/search_games?term=${encodeURIComponent(term)}&include_external=true`
  const res = await fetchNoCors(url, {
    method: 'GET',
  })
  if (!assertLookupSucceeded(res, 'Failed to search games')) {
    return []
  }
  const data = await res.json() as GameSearchResult[]
  const results: GameInfo[] = []
  data.forEach((app) => {
    results.push({
      title: app.gameName,
      appId: app.appId,
    })
  })
  return results
}

export const fetchDeviceList = async (): Promise<Devices[]> => {
  const url = `${reportsApiBaseUrl}/issue_labels`
  const res = await fetchNoCors(url, {
    method: 'GET',
  })
  if (!res.ok) {
    console.error(`[decky-game-settings:deckVerifiedApi] Failed to fetch report form details: ${res.status} ${res.statusText}`)
    return []
  }

  const issueLabels = await res.json()

  if (!Array.isArray(issueLabels)) {
    console.error('[decky-game-settings:deckVerifiedApi] Invalid issue labels data format')
    return []
  }

  // Map and filter the labels
  const devices: Devices[] = issueLabels
    .filter((label: GitHubIssueLabel) => label.name.startsWith('DEVICE:'))
    .map((label: GitHubIssueLabel) => ({
      name: label.name.trim(),
      description: label.description || 'No description available',
    }))

  return devices
}

const reportFormSchemaKey = `${__PLUGIN_NAME__}:reportFormSchema`
export const fetchReportFormDefinition = async (): Promise<any | null> => {
  const oneHourMs = 60 * 60 * 1000
  try {
    const cached = window.localStorage.getItem(reportFormSchemaKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (parsed && parsed.ts && (Date.now() - parsed.ts) < oneHourMs) {
          return parsed.data
        }
      } catch (e) {
        // ignore cache parse error
      }
    }

    const url = `${reportsApiBaseUrl}/report_form`
    const res = await fetchNoCors(url, {
      method: 'GET',
    })
    if (!res.ok) {
      console.error(`[decky-game-settings:deckVerifiedApi] Failed to fetch report form: ${res.status} ${res.statusText}`)
      return null
    }
    const data = await res.json()
    try {
      window.localStorage.setItem(reportFormSchemaKey, JSON.stringify({ ts: Date.now(), data }))
    } catch (e) {
      // ignore cache write errors
    }
    return data
  } catch (err) {
    console.error('[decky-game-settings:deckVerifiedApi] fetchReportFormDefinition error', err)
    return null
  }
}
