import React, { useEffect, useMemo, useState } from 'react'
import { Button, DialogButton, Navigation, showModal } from '@decky/ui'
import { MdBattery5Bar } from 'react-icons/md'
import {
  batteryBadgeAverageTdpRange,
  formatMinutes,
  formatMinutesCompact,
  getGameTdpOverrideWatts,
  getPluginConfig,
  makeGameTdpOverrideKey,
  reportsWebsiteBaseUrl,
  setGameTdpOverrideWatts,
} from '../../constants'
import { useBatteryBadgeData } from '../../hooks/useBatteryBadgeData'
import { TextFieldModal } from './TextFieldModal'
import { useGameIdentity } from '../../hooks/useGameIdentity'
import { useGamePageVisibility } from '../../hooks/useGamePageVisibility'
import { useBatteryTrackerTdp } from '../../hooks/useBatteryTrackerTdp'
import { calculateEstimatedMinutesFromTdp, useDeviceBatteryProfile } from '../../hooks/useDeviceBatteryProfile'
import {
  cardBaseStyle,
  collapsedCardBaseStyle,
  containerBaseStyle,
  footerButtonsStyle,
  footerStyle,
  getBatteryTone,
  getCornerPlacement,
  getResponsiveMaxWidth,
  metricLabelStyle,
  metricValueStyle,
  secondaryTextStyle,
  sizePresets,
} from './gameBatteryBadge/theme'

type GameBatteryBadgeProps = {
  'data-dgs-battery-badge'?: boolean
}

const GameBatteryBadge: React.FC<GameBatteryBadgeProps> = () => {
  // A state-backed callback ref, not useRef: the visibility hook has to re-run
  // whenever this node is attached or detached.
  const [badgeNode, setBadgeNode] = useState<HTMLDivElement | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const { validAppId, routeGameName, shouldPreferNameLookup } = useGameIdentity()

  const pluginConfig = getPluginConfig()
  const badgeCorner = pluginConfig.batteryBadgeCorner
  const badgeOffsetX = pluginConfig.batteryBadgeOffsetX
  const badgeOffsetY = pluginConfig.batteryBadgeOffsetY
  const badgeSize = pluginConfig.batteryBadgeSize
  const sizePreset = sizePresets[badgeSize]
  const perGameTdpKey = useMemo(() => makeGameTdpOverrideKey(validAppId, routeGameName), [validAppId, routeGameName])

  const shouldHideBadge = useGamePageVisibility({ appId: validAppId, badgeNode })
  const { deviceLabel, deviceBatteryCapacityWh } = useDeviceBatteryProfile()
  const [perGameTdpWatts, setPerGameTdpWatts] = useState<number | null>(null)
  const { importedTdpWatts, isBatteryTrackerDetected } = useBatteryTrackerTdp({
    enabled: pluginConfig.useBatteryTrackerTdp,
    gameName: routeGameName,
  })

  useEffect(() => {
    setPerGameTdpWatts(getGameTdpOverrideWatts(perGameTdpKey))
  }, [perGameTdpKey])

  const summary = useBatteryBadgeData({
    appId: shouldHideBadge ? undefined : validAppId,
    gameName: shouldHideBadge ? undefined : routeGameName ?? undefined,
    filterDevices: pluginConfig.filterDevices,
    preferNameLookup: shouldPreferNameLookup,
  })

  if (!validAppId && !routeGameName) return null

  const isTrackerPriorityMode = pluginConfig.useBatteryTrackerTdp && isBatteryTrackerDetected
  const activeTdpWatts = isTrackerPriorityMode
    ? (importedTdpWatts ?? 0)
    : (perGameTdpWatts ?? 0)
  const tdpSourceLabel = isTrackerPriorityMode ? 'Battery Tracker' : 'per-game'
  const expectedMinutesFromCustomTdp = calculateEstimatedMinutesFromTdp(deviceBatteryCapacityWh, activeTdpWatts)
  // Colour the badge after whichever figure it actually leads with, so the tone
  // never disagrees with the number next to it.
  const colorMinutes =
    activeTdpWatts > 0 && expectedMinutesFromCustomTdp !== null
      ? expectedMinutesFromCustomTdp
      : summary.batteryLifeMinutes ?? expectedMinutesFromCustomTdp
  const tone = getBatteryTone(colorMinutes)

  const openPerGameTdpModal = () => {
    if (isTrackerPriorityMode) {
      return
    }

    showModal(
      <TextFieldModal
        label='Set per-game average TDP (W)'
        placeholder={`Range ${batteryBadgeAverageTdpRange.min}-${batteryBadgeAverageTdpRange.max}. Empty or 0 clears override.`}
        initialValue={perGameTdpWatts !== null ? String(perGameTdpWatts) : ''}
        onClosed={(value) => {
          const trimmed = value.trim()
          if (trimmed.length === 0) {
            setGameTdpOverrideWatts(perGameTdpKey, null)
            setPerGameTdpWatts(null)
            return
          }

          const parsed = Number(trimmed.replace(',', '.'))
          if (!Number.isFinite(parsed)) {
            return
          }

          const rounded = Math.round(parsed)
          const clamped = Math.max(
            batteryBadgeAverageTdpRange.min,
            Math.min(batteryBadgeAverageTdpRange.max, rounded)
          )

          if (clamped <= 0) {
            setGameTdpOverrideWatts(perGameTdpKey, null)
            setPerGameTdpWatts(null)
            return
          }

          setGameTdpOverrideWatts(perGameTdpKey, clamped)
          setPerGameTdpWatts(clamped)
        }}
      />
    )
  }

  const openGameReport = () => {
    if (summary.resolvedReportAppId) {
      Navigation.NavigateToExternalWeb(`${reportsWebsiteBaseUrl}/app/${summary.resolvedReportAppId}`)
      return
    }

    if (summary.resolvedReportGameName) {
      Navigation.NavigateToExternalWeb(`${reportsWebsiteBaseUrl}/game/${encodeURIComponent(summary.resolvedReportGameName)}`)
      return
    }

    if (validAppId && !shouldPreferNameLookup) {
      Navigation.NavigateToExternalWeb(`${reportsWebsiteBaseUrl}/app/${validAppId}`)
      return
    }

    if (routeGameName && !shouldPreferNameLookup) {
      Navigation.NavigateToExternalWeb(`${reportsWebsiteBaseUrl}/game/${encodeURIComponent(routeGameName)}`)
    }
  }

  const canOpenReport =
    Boolean(summary.resolvedReportAppId) ||
    Boolean(summary.resolvedReportGameName) ||
    Boolean(validAppId && !shouldPreferNameLookup) ||
    Boolean(routeGameName && !shouldPreferNameLookup)

  let batteryValue = 'No data yet'
  if (summary.isLoading) {
    batteryValue = 'Loading...'
  } else if (summary.hasError) {
    batteryValue = 'Unavailable'
  } else if (summary.batteryLifeMinutes !== null) {
    batteryValue = formatMinutes(summary.batteryLifeMinutes)
  }

  let drawValue = summary.averagePowerDraw ?? 'Unknown'
  if (summary.hasError) {
    drawValue = 'Unavailable'
  }

  // Collapsed reading, e.g. "1h42m / 7W". The measured TDP wins: it comes from
  // Battery Tracker's record of this machine actually running this game, which
  // beats a median over other people's hardware. Community reports are the
  // fallback for when there is no tracker or manual figure to work from.
  const compactParts: string[] = []
  if (activeTdpWatts > 0) {
    if (expectedMinutesFromCustomTdp !== null) {
      compactParts.push(formatMinutesCompact(expectedMinutesFromCustomTdp))
    }
    compactParts.push(`${activeTdpWatts}W`)
  } else {
    if (summary.batteryLifeMinutes !== null) {
      compactParts.push(formatMinutesCompact(summary.batteryLifeMinutes))
    }
    if (summary.averagePowerDraw) {
      compactParts.push(summary.averagePowerDraw.replace(/\s+/g, ''))
    }
  }

  let compactText = compactParts.join(' / ')
  if (compactParts.length > 0) {
    // Nothing to do: a measured or reported figure is already in hand.
  } else if (summary.isLoading) {
    compactText = 'Loading...'
  } else if (summary.hasError) {
    compactText = 'Unavailable'
  } else {
    compactText = 'No data'
  }

  let reportCountText = 'No reports found'
  if (summary.isLoading) {
    reportCountText = 'Loading report data...'
  } else if (summary.hasError) {
    reportCountText = "Couldn't reach the reports service"
  } else if (summary.reportCount > 0) {
    reportCountText = `Based on ${summary.reportCount} report${summary.reportCount === 1 ? '' : 's'}`
  } else if (summary.hasReportsOutsideDeviceFilter) {
    reportCountText = 'Reports exist, but none for your device filter'
  } else if (summary.hasReports) {
    reportCountText = 'Reports found, but no battery data yet'
  }

  // The anchor stays mounted even when hidden. The visibility hook walks up from
  // this node to find the header capsule, and unmounting it would tear the
  // observer down and flip the badge straight back to visible.
  const containerStyle: React.CSSProperties = {
    ...containerBaseStyle,
    ...getCornerPlacement(badgeCorner, badgeOffsetX, badgeOffsetY),
    maxWidth: getResponsiveMaxWidth(sizePreset.maxWidth, badgeOffsetX),
    display: shouldHideBadge ? 'none' : undefined,
  }

  const cardStyle: React.CSSProperties = {
    ...cardBaseStyle,
    minWidth: sizePreset.minWidth,
    padding: sizePreset.cardPadding,
    gap: sizePreset.cardGap,
    border: `1px solid ${tone.border}`,
    background: `linear-gradient(135deg, rgba(12, 18, 30, 0.95) 0%, ${tone.bgAccent} 100%)`,
  }

  // ProtonDB's badge is reachable with the gamepad because its clickable part is
  // a real Steam button, not a Focusable wrapper. Steam builds its navigation
  // graph from those, so this is what makes an absolutely positioned badge
  // reachable at all. Everything else here is chrome around that button.
  const readingButtonStyle: React.CSSProperties = {
    ...collapsedCardBaseStyle,
    padding: sizePreset.collapsedPadding,
    fontSize: sizePreset.collapsedFontSize,
    color: tone.metricColor,
    minWidth: 0,
    width: isExpanded ? '100%' : undefined,
    justifyContent: isExpanded ? 'flex-start' : 'center',
    borderRadius: isExpanded ? '6px' : '999px',
    border: isExpanded ? '1px solid transparent' : `1px solid ${tone.border}`,
    background: isExpanded
      ? 'rgba(255, 255, 255, 0.06)'
      : `linear-gradient(135deg, rgba(12, 18, 30, 0.95) 0%, ${tone.bgAccent} 100%)`,
    boxShadow: isExpanded ? 'none' : '0 4px 14px rgba(0, 0, 0, 0.4)',
  }

  // While collapsed the button is the whole badge, so the wrapper adds nothing.
  // The container already carries the screen-aware max width.
  const wrapperStyle: React.CSSProperties = isExpanded ? cardStyle : { display: 'flex' }

  // Focus moving between the card and its own buttons fires a blur on the
  // container. Only collapse when focus actually leaves the badge.
  const handleBadgeBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null
    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return
    }
    setIsExpanded(false)
  }

  const buttonStyle: React.CSSProperties = {
    minWidth: sizePreset.buttonMinWidth,
    height: sizePreset.buttonHeight,
    fontSize: sizePreset.buttonFontSize,
    lineHeight: '12px',
    padding: '4px 8px',
  }

  return (
    <div ref={setBadgeNode} style={containerStyle}>
      {shouldHideBadge ? null : (
      <div style={wrapperStyle} onFocus={() => setIsExpanded(true)} onBlur={handleBadgeBlur}>
        {/* Always mounted, in both states. It is the badge while collapsed and
            the card's header once expanded, so the focused node is never torn
            down mid-transition and the badge cannot oscillate. */}
        <Button style={readingButtonStyle} onClick={() => setIsExpanded((previous) => !previous)}>
          <MdBattery5Bar size={14} color={tone.iconColor} />
          <span>{isExpanded ? `DGS Battery  ${compactText}` : compactText}</span>
        </Button>

        {!isExpanded ? null : (
          <>
        <div>
          <div style={metricLabelStyle}>Estimated Battery Life</div>
          <div style={{ ...metricValueStyle, fontSize: sizePreset.metricValueFontSize, color: tone.metricColor }}>
            {batteryValue}
          </div>
        </div>

        <div>
          <div style={metricLabelStyle}>Average Power Draw</div>
          <div style={{ ...metricValueStyle, fontSize: sizePreset.drawValueFontSize, lineHeight: '15px' }}>
            {drawValue}
          </div>
        </div>

        {activeTdpWatts > 0 && (
          <div>
            <div style={metricLabelStyle}>Expected @ {activeTdpWatts}W ({tdpSourceLabel})</div>
            <div style={{ ...metricValueStyle, fontSize: sizePreset.drawValueFontSize, lineHeight: '15px' }}>
              {expectedMinutesFromCustomTdp !== null
                ? `${formatMinutes(expectedMinutesFromCustomTdp)}${deviceLabel ? ` (${deviceLabel})` : ''}`
                : 'Device battery profile unavailable'}
            </div>
          </div>
        )}

        {isTrackerPriorityMode && importedTdpWatts === null && (
          <div style={secondaryTextStyle}>Battery Tracker enabled, but no matching TDP data was found for this game.</div>
        )}

        {isTrackerPriorityMode && (
          <div style={secondaryTextStyle}>Manual per-game TDP is locked while Battery Tracker mode is active.</div>
        )}

        <div style={footerStyle}>
          <div style={secondaryTextStyle}>{reportCountText}</div>
          {/* A plain div: DialogButton is already a focus target, so wrapping
              these in a second Focusable would nest containers for nothing. */}
          <div style={footerButtonsStyle}>
            <DialogButton
              style={{ ...buttonStyle, minWidth: '70px', opacity: isTrackerPriorityMode ? 0.7 : 1 }}
              onClick={openPerGameTdpModal}
              disabled={isTrackerPriorityMode}
            >
              {isTrackerPriorityMode
                ? importedTdpWatts !== null ? `BT ${importedTdpWatts}W` : 'BT --'
                : perGameTdpWatts !== null ? `${perGameTdpWatts}W` : 'Set TDP'}
            </DialogButton>
            <DialogButton style={buttonStyle} onClick={openGameReport} disabled={!canOpenReport || summary.isLoading}>
              Reports
            </DialogButton>
          </div>
        </div>
          </>
        )}
      </div>
      )}
    </div>
  )
}

export default GameBatteryBadge
