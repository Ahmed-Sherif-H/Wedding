/** Shared virtual-canvas math for the hero desert scene. */

/** Design reference size — all palm / cloud coords are relative to this. */
export const HERO_SCENE = {
  width: 1600,
  height: 900,
  /** Extra zoom matching the previous keyart scale(1.22) */
  zoom: 1.22,
  /** object-position-like focus (0–1). Matches prior 28% / bottom. */
  focusX: 0.28,
  focusY: 1,
} as const

export type CoverLayout = {
  width: number
  height: number
  left: number
  top: number
  scale: number
}

/**
 * Cover-fit the reference scene into a viewport, then apply zoom and
 * align the focus point the way object-fit:cover + object-position would.
 */
export function computeCoverLayout(
  viewportW: number,
  viewportH: number,
  sceneW = HERO_SCENE.width,
  sceneH = HERO_SCENE.height,
  zoom = HERO_SCENE.zoom,
  focusX = HERO_SCENE.focusX,
  focusY = HERO_SCENE.focusY,
): CoverLayout {
  if (viewportW <= 0 || viewportH <= 0) {
    return { width: sceneW, height: sceneH, left: 0, top: 0, scale: 1 }
  }

  const coverScale = Math.max(viewportW / sceneW, viewportH / sceneH) * zoom
  const width = sceneW * coverScale
  const height = sceneH * coverScale
  const left = (viewportW - width) * focusX
  const top = (viewportH - height) * focusY

  return { width, height, left, top, scale: coverScale }
}

/** Mobile/portrait needs less zoom and a more centered crop so the scene isn't huge. */
export function resolveHeroFraming(viewportW: number, viewportH: number) {
  const isMobile = viewportW < 768
  const isPortrait = viewportH >= viewportW

  if (isMobile || isPortrait) {
    return {
      zoom: isMobile ? 1.05 : 1.1,
      focusX: 0.45,
      focusY: 1,
    }
  }

  return {
    zoom: HERO_SCENE.zoom,
    focusX: HERO_SCENE.focusX,
    focusY: HERO_SCENE.focusY,
  }
}

export function computeHeroCoverLayout(viewportW: number, viewportH: number): CoverLayout {
  const { zoom, focusX, focusY } = resolveHeroFraming(viewportW, viewportH)
  return computeCoverLayout(viewportW, viewportH, HERO_SCENE.width, HERO_SCENE.height, zoom, focusX, focusY)
}

/** Normalized palm placement (easy to tweak). x/y are 0–1 in scene space; y is the ground line (base of trunk). */
export type PalmConfig = {
  /** Horizontal position in scene (0 = left, 1 = right) */
  x: number
  /** Vertical ground line in scene (0 = top, 1 = bottom) */
  y: number
  /** Palm height as a fraction of scene height */
  h: number
  delay: string
  dur: string
}

/**
 * Palms grounded between / behind buildings in the keyart.
 * Adjust x, y, h here when the artwork framing changes.
 */
export const HERO_PALMS: PalmConfig[] = [
  { x: 0.04, y: 0.90, h: 0.24, delay: '0s', dur: '6.8s' },
  { x: 0.17, y: 0.905, h: 0.28, delay: '1.6s', dur: '7.4s' },
  { x: 0.34, y: 0.905, h: 0.26, delay: '2.8s', dur: '6.5s' },
  { x: 0.54, y: 0.905, h: 0.25, delay: '0.9s', dur: '7.2s' },
  { x: 0.71, y: 0.905, h: 0.27, delay: '2.1s', dur: '6.9s' },
  { x: 0.88, y: 0.90, h: 0.22, delay: '1.3s', dur: '7.6s' },
]

export type CloudConfig = {
  srcKey: 'cloud1' | 'cloud2' | 'cloud3' | 'cloud4' | 'cloud5' | 'cloud6'
  top: number
  width: number
  dur: string
  delay: string
  rev: boolean
}

/** Cloud positions as fractions of the shared scene. */
export const HERO_CLOUDS: CloudConfig[] = [
  { srcKey: 'cloud1', top: 0.04, width: 0.22, dur: '55s', delay: '-8s', rev: false },
  { srcKey: 'cloud2', top: 0.08, width: 0.18, dur: '72s', delay: '-38s', rev: true },
  { srcKey: 'cloud3', top: 0.02, width: 0.16, dur: '88s', delay: '-60s', rev: false },
  { srcKey: 'cloud4', top: 0.14, width: 0.13, dur: '65s', delay: '-20s', rev: true },
  { srcKey: 'cloud5', top: 0.06, width: 0.15, dur: '78s', delay: '-50s', rev: false },
  { srcKey: 'cloud6', top: 0.11, width: 0.11, dur: '96s', delay: '-72s', rev: true },
]
