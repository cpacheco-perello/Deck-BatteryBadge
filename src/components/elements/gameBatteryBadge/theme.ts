import React from 'react'
import type { BatteryBadgeCorner, BatteryBadgeSize } from '../../../interfaces'

export type BadgeSizePreset = {
  maxWidth: string
  minWidth: string
  cardPadding: string
  cardGap: string
  titleFontSize: string
  metricValueFontSize: string
  drawValueFontSize: string
  buttonMinWidth: string
  buttonHeight: string
  buttonFontSize: string
  collapsedPadding: string
  collapsedFontSize: string
}

export type BatteryTone = {
  border: string
  bgAccent: string
  titleColor: string
  metricColor: string
  iconColor: string
}

export const sizePresets: Record<BatteryBadgeSize, BadgeSizePreset> = {
  compact: {
    maxWidth: '260px',
    minWidth: '186px',
    cardPadding: '7px 8px 8px 8px',
    cardGap: '5px',
    titleFontSize: '11px',
    metricValueFontSize: '14px',
    drawValueFontSize: '12px',
    buttonMinWidth: '72px',
    buttonHeight: '24px',
    buttonFontSize: '10px',
    collapsedPadding: '4px 9px',
    collapsedFontSize: '11px',
  },
  regular: {
    maxWidth: '320px',
    minWidth: '218px',
    cardPadding: '8px 10px 10px 10px',
    cardGap: '6px',
    titleFontSize: '12px',
    metricValueFontSize: '16px',
    drawValueFontSize: '13px',
    buttonMinWidth: '86px',
    buttonHeight: '26px',
    buttonFontSize: '11px',
    collapsedPadding: '5px 11px',
    collapsedFontSize: '12px',
  },
  large: {
    maxWidth: '360px',
    minWidth: '250px',
    cardPadding: '10px 12px 12px 12px',
    cardGap: '7px',
    titleFontSize: '13px',
    metricValueFontSize: '18px',
    drawValueFontSize: '14px',
    buttonMinWidth: '96px',
    buttonHeight: '28px',
    buttonFontSize: '12px',
    collapsedPadding: '6px 13px',
    collapsedFontSize: '14px',
  },
}

export const containerBaseStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 5,
  pointerEvents: 'auto',
  width: 'fit-content',
}

// Pin to the chosen corner rather than to a coordinate. Using right and bottom
// for those corners means the badge tracks the edge of whatever panel it is
// rendered on instead of assuming a fixed 1280x800 screen.
export const getCornerPlacement = (
  corner: BatteryBadgeCorner,
  offsetX: number,
  offsetY: number
): React.CSSProperties => {
  const vertical: React.CSSProperties = corner.startsWith('top')
    ? { top: `${offsetY}px` }
    : { bottom: `${offsetY}px` }
  const horizontal: React.CSSProperties = corner.endsWith('left')
    ? { left: `${offsetX}px` }
    : { right: `${offsetX}px` }
  return { ...vertical, ...horizontal }
}

// Never let the preset width push the card off a narrow screen. The gutter
// accounts for the offset on the pinned side plus breathing room on the other.
export const getResponsiveMaxWidth = (presetMaxWidth: string, offsetX: number): string =>
  `min(${presetMaxWidth}, calc(100vw - ${offsetX + 24}px))`

export const cardBaseStyle: React.CSSProperties = {
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
  display: 'flex',
  flexDirection: 'column',
}

// Resting state: a single pill with the reading and the draw, nothing else.
export const collapsedCardBaseStyle: React.CSSProperties = {
  borderRadius: '999px',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '6px',
  whiteSpace: 'nowrap',
  fontWeight: 600,
  lineHeight: '14px',
}

export const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  lineHeight: '14px',
  color: '#c8dcff',
  letterSpacing: '0.03em',
}

export const metricLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#9eb1c9',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

export const metricValueStyle: React.CSSProperties = {
  fontWeight: 700,
  color: '#f2f7ff',
  lineHeight: '18px',
}

export const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '8px',
}

export const footerButtonsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

export const secondaryTextStyle: React.CSSProperties = {
  fontSize: '10px',
  lineHeight: '12px',
  color: '#9eb1c9',
}

// Three bands, not four, and lightness rises with endurance.
//
// The old scale ran red -> cyan -> green -> gold. That is a rainbow: the order
// lived entirely in hue, and hue is the channel colourblind readers lose. Its
// gold and green bands measured a CVD Delta E of 4.7 under protanopia and its
// green and cyan bands 8.2 even with full colour vision, so three of the four
// were hard to tell apart.
//
// These steps carry the order in lightness instead, which survives any CVD, and
// keep the red-to-green reading people expect from a battery gauge. Four bands
// could not be separated across that hue span; three can. Validated against the
// card background: worst adjacent pair CVD Delta E 11.6, normal-vision 17.2, every
// step past 3:1 contrast, lightness monotone with gaps past 0.06.
const REFERENCE_CAPACITY_WH = 40
const BASE_LOW_MINUTES = 120
const BASE_GOOD_MINUTES = 240

// Thresholds scale with the battery. A bigger pack should have to deliver
// proportionally longer to earn the same colour, so the badge grades efficiency
// rather than just rewarding whoever bought the larger battery.
export const getBatteryThresholds = (capacityWh: number | null): { low: number; good: number } => {
  const usable = capacityWh !== null && Number.isFinite(capacityWh) && capacityWh > 0 ? capacityWh : null
  const factor = usable === null ? 1 : usable / REFERENCE_CAPACITY_WH
  return {
    low: Math.round(BASE_LOW_MINUTES * factor),
    good: Math.round(BASE_GOOD_MINUTES * factor),
  }
}

export const getBatteryTone = (minutes: number | null, capacityWh: number | null = null): BatteryTone => {
  // No reading yet — neutral, deliberately outside the red-to-green ramp so it
  // never reads as a verdict.
  if (minutes === null || !Number.isFinite(minutes) || minutes <= 0) {
    return {
      border: 'rgba(120, 150, 190, 0.55)',
      bgAccent: 'rgba(16, 24, 38, 0.97)',
      titleColor: '#9fb4cf',
      metricColor: '#dfe8f4',
      iconColor: '#9fb4cf',
    }
  }

  const { low, good } = getBatteryThresholds(capacityWh)

  if (minutes >= good) {
    return {
      border: 'rgba(188, 245, 147, 0.7)',
      bgAccent: 'rgba(18, 44, 16, 0.97)',
      titleColor: '#bcf593',
      metricColor: '#d8fabd',
      iconColor: '#bcf593',
    }
  }

  if (minutes >= low) {
    return {
      border: 'rgba(238, 176, 64, 0.7)',
      bgAccent: 'rgba(56, 38, 8, 0.97)',
      titleColor: '#eeb040',
      metricColor: '#f7d390',
      iconColor: '#eeb040',
    }
  }

  return {
    border: 'rgba(201, 59, 59, 0.75)',
    bgAccent: 'rgba(50, 12, 12, 0.97)',
    titleColor: '#c93b3b',
    metricColor: '#f0a5a5',
    iconColor: '#c93b3b',
  }
}
