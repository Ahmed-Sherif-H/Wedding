import { useState, useEffect, useRef, useCallback } from 'react'
import heroKeyart from './imports/ChatGPT_Image_Aug_2__2026__02_22_39_PM.png'
import palmSprite from './imports/palmgen-1.png'
import cloud1 from './imports/Cloud_1.png'
import cloud2 from './imports/Cloud_2.png'
import cloud3 from './imports/Cloud_3.png'
import cloud4x from './imports/Cloud_4-1.png'
import cloud5x from './imports/Cloud_5-1.png'
import cloud6x from './imports/Cloud_6-1.png'
import musicSrc from './imports/Palm_Dome_Loop.mp3'
import { preloadCriticalAssets } from './lib/preloadAssets'
import { computeHeroCoverLayout, HERO_PALMS, HERO_CLOUDS, type CoverLayout, type CloudConfig } from './lib/heroScene'

const CLOUD_SRC: Record<CloudConfig['srcKey'], string> = {
  cloud1,
  cloud2,
  cloud3,
  cloud4: cloud4x,
  cloud5: cloud5x,
  cloud6: cloud6x,
}

/** Google Form embed URL — override with VITE_GOOGLE_FORM_URL in .env / Cloudflare if needed */
const GOOGLE_FORM_URL = (
  (import.meta.env.VITE_GOOGLE_FORM_URL as string | undefined)?.trim()
  || 'https://docs.google.com/forms/d/e/1FAIpQLSd5Wf5q52HQ9YyOhXjGCw-J3yr_tnppWp_-K3PhouKvAHJgEQ/viewform?embedded=true'
)

// ─── Custom Cursor ────────────────────────────────────────────────────────────
function CustomCursor() {
  const rootRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Array<{ el: HTMLDivElement; life: number }>>([])
  const lastMs = useRef(0)
  const rafRef = useRef(0)
  const posRef = useRef({ x: -200, y: -200 })

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    if (!mq.matches) return

    const root = rootRef.current
    const cursor = cursorRef.current
    if (!root || !cursor) return

    const tickParticles = () => {
      particlesRef.current = particlesRef.current.filter(p => {
        p.life -= 0.07
        if (p.life <= 0) {
          p.el.remove()
          return false
        }
        p.el.style.opacity = String(p.life * 0.85)
        p.el.style.transform = `scale(${p.life})`
        return true
      })
      rafRef.current = requestAnimationFrame(tickParticles)
    }
    rafRef.current = requestAnimationFrame(tickParticles)

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      cursor.style.left = `${e.clientX - 10}px`
      cursor.style.top = `${e.clientY - 10}px`

      const now = Date.now()
      if (now - lastMs.current > 35) {
        lastMs.current = now
        const p = document.createElement('div')
        p.className = 'absolute rounded-full'
        p.style.cssText = `left:${e.clientX - 3}px;top:${e.clientY - 3}px;width:6px;height:6px;background:rgba(240,180,41,0.85);box-shadow:0 0 6px 2px rgba(240,180,41,0.5);animation:particle-fade 0.4s ease-out forwards;pointer-events:none;`
        root.appendChild(p)
        particlesRef.current.push({ el: p, life: 1 })
        if (particlesRef.current.length > 12) {
          const old = particlesRef.current.shift()
          old?.el.remove()
        }
      }
    }

    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
      particlesRef.current.forEach(p => p.el.remove())
      particlesRef.current = []
    }
  }, [])

  return (
    <div ref={rootRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 99999 }}>
      <div
        ref={cursorRef}
        style={{
          position: 'absolute',
          left: -200,
          top: -200,
          width: 20,
          height: 20,
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F0B429',
          filter: 'drop-shadow(0 0 5px rgba(240,180,41,0.9))',
          pointerEvents: 'none',
          fontFamily: 'serif',
          lineHeight: 1,
        }}
      >
        ✦
      </div>
    </div>
  )
}

// ─── Music Button ─────────────────────────────────────────────────────────────
function MusicButton({ playing, toggle }: { playing: boolean; toggle: () => void }) {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? 'Pause background music' : 'Play background music'}
      className="music-btn fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[9998] flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm transition-all duration-300"
      style={{
        background: 'rgba(253,248,240,0.85)',
        border: '1px solid rgba(196,113,79,0.3)',
        color: 'var(--text-mid)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 20px rgba(196,113,79,0.15)',
      }}
    >
      <span style={{ fontSize: 16 }}>{playing ? '♪' : '♩'}</span>
      <span className="music-btn-label font-serif italic" style={{ fontSize: 13 }}>
        {playing ? 'Music on' : 'Music off'}
      </span>
    </button>
  )
}

// ─── Organic Bird Flock ───────────────────────────────────────────────────────
/** Small thin flocks in the hero viewport sky (not inside the cropped scene canvas). */
function OrganicBirdFlock({
  top,
  delay,
  duration,
  opacity = 0.7,
}: {
  top: string
  delay: string
  duration: string
  opacity?: number
}) {
  const c = '#3C2A14'
  // 3 birds only — thinner strokes, tighter spacing
  const birds = [
    [0, 0, '0s'],
    [16, -4, '0.2s'],
    [30, 3, '0.38s'],
  ] as const

  return (
    <div
      className="motion-continuous hero-bird-flock"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top,
        left: 0,
        zIndex: 6,
        pointerEvents: 'none',
        opacity,
        animation: `flock-fly ${duration} linear ${delay} infinite`,
        willChange: 'transform',
      }}
    >
      <svg
        width="48"
        height="18"
        viewBox="0 0 42 16"
        shapeRendering="crispEdges"
        style={{ imageRendering: 'pixelated', overflow: 'visible', display: 'block' }}
      >
        {birds.map(([bx, by, fd], i) => (
          <g key={i}>
            <g style={{ animation: `wings-up-fade 0.68s ease-in-out ${fd} infinite` }}>
              <rect x={bx - 4} y={by + 6} width="3" height="1" fill={c} />
              <rect x={bx - 1} y={by + 7} width="5" height="1" fill={c} />
              <rect x={bx + 4} y={by + 6} width="3" height="1" fill={c} />
            </g>
            <g style={{ animation: `wings-down-fade 0.68s ease-in-out ${fd} infinite` }}>
              <rect x={bx - 4} y={by + 8} width="3" height="1" fill={c} />
              <rect x={bx - 1} y={by + 7} width="5" height="1" fill={c} />
              <rect x={bx + 4} y={by + 8} width="3" height="1" fill={c} />
            </g>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ─── Pixel Desert Scene ───────────────────────────────────────────────────────
function PixelDesertScene({ layout }: { layout: CoverLayout }) {
  return (
    <div
      className="hero-scene-canvas"
      style={{
        width: layout.width,
        height: layout.height,
        left: layout.left,
        top: layout.top,
      }}
    >
      <img
        src={heroKeyart}
        alt=""
        className="hero-keyart"
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: '28% bottom',
          imageRendering: 'pixelated',
          pointerEvents: 'none',
        }}
      />

      {HERO_CLOUDS.map((c, i) => (
        <img
          key={c.srcKey}
          src={CLOUD_SRC[c.srcKey]}
          alt=""
          className="motion-continuous"
          style={{
            position: 'absolute',
            top: `${c.top * 100}%`,
            left: 0,
            width: `${c.width * 100}%`,
            imageRendering: 'pixelated',
            opacity: 0.88 - i * 0.03,
            filter: 'sepia(0.55) saturate(1.6) hue-rotate(-18deg) brightness(1.08)',
            animation: `${c.rev ? 'cloud-traverse-rev' : 'cloud-traverse'} ${c.dur} linear ${c.delay} infinite`,
          }}
        />
      ))}

      {HERO_PALMS.map((p, i) => (
        <div
          key={i}
          className="hero-palm"
          style={{
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            height: `${p.h * 100}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div
            className="motion-continuous"
            style={{
              transformOrigin: 'bottom center',
              animation: `palm-img-sway ${p.dur} ease-in-out ${p.delay} infinite`,
              height: '100%',
            }}
          >
            <img src={palmSprite} alt="" />
          </div>
        </div>
      ))}

      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full motion-continuous"
          style={{
            width: 2,
            height: 2,
            left: `${18 + (i * 13) % 65}%`,
            bottom: `${9 + (i * 5) % 6}%`,
            background: 'rgba(196,108,42,0.26)',
            animation: `dust-float ${7 + (i % 3) * 2.5}s ease-in-out infinite`,
            animationDelay: `${i * 1.3}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection({ onBegin, onInteraction }: { onBegin: () => void; onInteraction?: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<CoverLayout>(() =>
    computeHeroCoverLayout(
      typeof window !== 'undefined' ? window.innerWidth : 1600,
      typeof window !== 'undefined' ? window.innerHeight : 900,
    ),
  )
  const [ready, setReady] = useState(false)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  )
  const rafRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    preloadCriticalAssets(
      [heroKeyart, palmSprite, cloud1, cloud2, cloud3, cloud4x, cloud5x, cloud6x],
      { audioSrc: musicSrc },
    ).then(() => {
      if (!cancelled) setReady(true)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const measure = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const { width, height } = root.getBoundingClientRect()
        setIsMobile(width < 768)
        setLayout(computeHeroCoverLayout(width, height))
      })
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const handleBegin = () => {
    onInteraction?.()
    onBegin()
  }

  return (
    <section
      id="hero"
      ref={rootRef}
      className="relative w-full overflow-hidden"
      style={{ height: '100dvh', minHeight: isMobile ? undefined : 600, background: '#C8E4DE' }}
    >
      <div className={`hero-reveal hero-scene-root${ready ? ' is-ready' : ''}`} aria-hidden={!ready}>
        <div
          className="hero-scene-motion absolute inset-0 motion-continuous"
          style={
            isMobile
              ? { inset: 0, width: '100%', height: '100%', animation: 'camera-drift 20s ease-in-out infinite' }
              : { width: '102%', height: '102%', top: '-1%', left: '-1%', animation: 'camera-drift 20s ease-in-out infinite' }
          }
        >
          <PixelDesertScene layout={layout} />
        </div>
      </div>

      {/* Thin flocks in the visible sky (viewport layer — not cropped with the scene) */}
      <div
        className={`hero-reveal absolute inset-0${ready ? ' is-ready' : ''}`}
        aria-hidden="true"
        style={{ zIndex: 5, pointerEvents: 'none', overflow: 'hidden' }}
      >
        <OrganicBirdFlock top={isMobile ? '12%' : '10%'} delay="-6s" duration="48s" opacity={0.75} />
        <OrganicBirdFlock top={isMobile ? '19%' : '16%'} delay="-24s" duration="62s" opacity={0.55} />
      </div>

      <div
        className={`hero-reveal absolute inset-0${ready ? ' is-ready' : ''}`}
        style={{
          zIndex: 4,
          background: isMobile
            ? 'linear-gradient(to bottom, rgba(194,234,228,0.12) 0%, rgba(232,132,64,0.22) 55%, rgba(28,40,16,0.5) 100%)'
            : 'linear-gradient(to bottom, rgba(194,234,228,0.04) 0%, rgba(232,132,64,0.12) 70%, rgba(28,40,16,0.38) 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className={`hero-reveal absolute inset-0 flex flex-col items-center justify-center text-center${ready ? ' is-ready' : ''}`}
        style={{ zIndex: 6, padding: isMobile ? '0 20px' : '0 clamp(16px,5vw,48px)', gap: 0 }}
      >
        {ready && (
          <>
            <div style={{ animation: 'fade-up 1.4s cubic-bezier(0.16,1,0.3,1) forwards', opacity: 0, animationDelay: '0.2s', marginBottom: isMobile ? 14 : 20 }}>
              <p
                className="font-serif italic"
                style={{
                  color: '#3A1E0A',
                  fontSize: isMobile ? 'clamp(15px, 4.2vw, 18px)' : 'clamp(14px, 1.8vw, 20px)',
                  letterSpacing: isMobile ? '0.08em' : '0.18em',
                  lineHeight: 1.45,
                  maxWidth: isMobile ? '18em' : undefined,
                  margin: '0 auto',
                  textShadow: '0 1px 8px rgba(255,240,200,0.9), 0 0 24px rgba(255,240,200,0.6)',
                }}
              >
                you are cordially invited to celebrate
              </p>
            </div>

            <div style={{ animation: 'fade-up 1.4s cubic-bezier(0.16,1,0.3,1) forwards', opacity: 0, animationDelay: '0.55s' }}>
              <div className="flex flex-col items-center" style={{ textAlign: 'center' }}>
                <div
                  className="font-serif"
                  style={{
                    fontSize: isMobile ? 'clamp(56px, 16vw, 72px)' : 'clamp(44px, 8.5vw, 96px)',
                    lineHeight: 1,
                    color: '#2C1608',
                    textShadow: '0 2px 32px rgba(255,240,200,0.85)',
                    letterSpacing: isMobile ? '0.06em' : '0.10em',
                  }}
                >
                  Maryam
                </div>
                <div
                  className="font-serif"
                  style={{
                    fontSize: isMobile ? 'clamp(40px, 11vw, 52px)' : 'clamp(42px, 6.5vw, 76px)',
                    color: '#2C1608',
                    letterSpacing: '0.04em',
                    lineHeight: 1,
                    padding: isMobile ? '4px 0' : 'clamp(6px,0.9vw,14px) 0',
                    textShadow: '0 2px 24px rgba(255,240,200,0.7)',
                    textAlign: 'center',
                  }}
                >
                  &amp;
                </div>
                <div
                  className="font-serif"
                  style={{
                    fontSize: isMobile ? 'clamp(56px, 16vw, 72px)' : 'clamp(44px, 8.5vw, 96px)',
                    lineHeight: 1,
                    color: '#2C1608',
                    textShadow: '0 2px 32px rgba(255,240,200,0.85)',
                    letterSpacing: isMobile ? '0.14em' : '0.26em',
                    paddingLeft: isMobile ? '0.14em' : '0.26em',
                  }}
                >
                  Ahmed
                </div>
              </div>
            </div>

            <div style={{ animation: 'fade-up 1.2s cubic-bezier(0.16,1,0.3,1) forwards', opacity: 0, animationDelay: '0.8s', marginTop: isMobile ? 20 : 28, marginBottom: isMobile ? 20 : 28, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: isMobile ? 36 : 48, height: 1, background: 'rgba(196,113,79,0.5)' }} />
              <span style={{ color: '#C4714F', fontSize: isMobile ? 14 : 12, opacity: 0.7 }}>✦</span>
              <div style={{ width: isMobile ? 36 : 48, height: 1, background: 'rgba(196,113,79,0.5)' }} />
            </div>

            <div style={{ animation: 'fade-up 1.4s cubic-bezier(0.16,1,0.3,1) forwards', opacity: 0, animationDelay: '1.05s' }}>
              <button
                type="button"
                onClick={handleBegin}
                className="group relative overflow-hidden rounded-full font-serif italic transition-all duration-700"
                style={{
                  padding: isMobile ? '14px 28px' : '16px 40px',
                  background: 'rgba(253,248,240,0.92)',
                  border: '1.5px solid rgba(196,113,79,0.45)',
                  color: 'var(--terracotta)',
                  fontSize: isMobile ? 16 : 17,
                  letterSpacing: '0.04em',
                  backdropFilter: 'blur(10px)',
                  animation: 'glow-pulse 4s ease-in-out infinite',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                }}
              >
                Begin the Journey ✦
              </button>
            </div>
          </>
        )}
      </div>

      {ready && (
        <div
          className="hero-reveal is-ready absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{
            bottom: isMobile ? 20 : 32,
            opacity: 0.5,
            animation: 'fade-up 1s ease-out forwards',
            animationDelay: '2.5s',
            pointerEvents: 'none',
          }}
        >
          <div className="motion-continuous" style={{ width: 1, height: isMobile ? 28 : 40, background: 'linear-gradient(to bottom, transparent, var(--terracotta))', animation: 'glow-pulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: isMobile ? 11 : 10, letterSpacing: '0.3em', color: 'var(--text-light)' }}>SCROLL</span>
        </div>
      )}
    </section>
  )
}

// ─── Use Scroll Reveal ────────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVisible(true)
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

// ─── Story Section ────────────────────────────────────────────────────────────
function StorySection() {
  const { ref, visible } = useScrollReveal(0.2)
  return (
    <section
      id="story"
      className="relative w-full overflow-hidden section-pad"
      style={{ background: 'linear-gradient(to bottom, #FAF0DC, #F5E8CC)' }}
    >
      {/* Subtle pixel hill decoration */}
      <div className="absolute inset-0 opacity-8" style={{ imageRendering: 'pixelated' }}>
        <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
          <polygon points="0,200 0,140 60,100 120,120 180,80 240,110 300,70 360,100 400,90 400,200" fill="#C4A882" />
        </svg>
      </div>

      <div
        ref={ref}
        className="relative mx-auto text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 1.2s cubic-bezier(0.16,1,0.3,1), transform 1.2s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div className="max-w-2xl mx-auto px-8">
          <p className="font-serif italic mb-12" style={{ fontSize: 13, letterSpacing: '0.3em', color: 'var(--text-light)' }}>
            OUR STORY
          </p>

          <p
            className="font-serif italic"
            style={{
              fontSize: 'clamp(22px, 3.5vw, 34px)',
              color: 'var(--text-dark)',
              lineHeight: 1.65,
              marginBottom: 48,
            }}
          >
            "It took two to begin this journey.<br />
            Now, we'd love for you to celebrate it with us."
          </p>
        </div>

        <div className="w-full max-w-6xl mx-auto px-3 sm:px-6">
          <MiniGameEmbed />
        </div>
      </div>
    </section>
  )
}

function MiniGameEmbed() {
  const [playing, setPlaying] = useState(false)

  return (
    <div
      className="game-placeholder"
      style={{
        width: '100%',
        background: 'rgba(253,248,240,0.85)',
        border: '1px solid rgba(196,113,79,0.25)',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(196,113,79,0.1)',
      }}
    >
      {!playing ? (
        <div
          style={{
            minHeight: 'clamp(280px, 50vw, 520px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 40,
          }}
        >
          <svg width="64" height="44" viewBox="0 0 32 22" style={{ imageRendering: 'pixelated', opacity: 0.55 }}>
            <rect x="2" y="6" width="28" height="14" rx="2" fill="#9B6B4A" />
            <rect x="6" y="10" width="2" height="6" fill="#FAF0DC" />
            <rect x="4" y="12" width="6" height="2" fill="#FAF0DC" />
            <rect x="22" y="11" width="2" height="2" fill="#FAF0DC" />
            <rect x="26" y="11" width="2" height="2" fill="#FAF0DC" />
            <rect x="24" y="9" width="2" height="2" fill="#FAF0DC" />
            <rect x="24" y="13" width="2" height="2" fill="#FAF0DC" />
            <rect x="13" y="8" width="6" height="4" fill="#FAF0DC" opacity="0.5" />
          </svg>
          <p className="font-serif italic" style={{ fontSize: 20, color: 'var(--text-dark)' }}>
            Play our story
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-light)', maxWidth: 340, lineHeight: 1.5 }}>
            A short pixel adventure — loads about 45&nbsp;MB the first time.
          </p>
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="px-10 py-4 rounded-full font-serif italic transition-all duration-300"
            style={{
              background: 'var(--terracotta)',
              color: '#FDF8F0',
              fontSize: 17,
              boxShadow: '0 4px 20px rgba(196,113,79,0.35)',
              marginTop: 8,
            }}
          >
            Play ✦
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', background: '#1a120c' }}>
          <iframe
            title="Maryam & Ahmed mini game"
            src="/game/index.html"
            allow="fullscreen; autoplay; gamepad; keyboard-map"
            allowFullScreen
            style={{
              display: 'block',
              width: '100%',
              height: 'min(85vh, 900px)',
              border: 'none',
              background: '#000',
            }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Countdown Section ────────────────────────────────────────────────────────
function CountdownSection() {
  const target = new Date('2026-09-10T18:00:00')
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const sectionRef = useRef<HTMLElement>(null)
  const { ref, visible } = useScrollReveal(0.2)

  useEffect(() => {
    const tick = () => {
      const diff = target.getTime() - Date.now()
      if (diff <= 0) { setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const MIN = 0.25
    const MAX = 1.0
    let prevScrollY = window.scrollY
    let current = 0.55
    let targetIntensity = 0.55
    let rafId = 0

    const applyVars = (intensity: number) => {
      section.style.setProperty('--sun-intensity', String(intensity))
      section.style.setProperty('--ray-scale', String(0.7 + 0.6 * intensity))
      section.style.setProperty('--ray-opacity', String(0.2 + 0.35 * intensity))
      section.style.setProperty('--halo-opacity', String(0.08 + 0.2 * intensity))
      section.style.setProperty('--halo-scale', String(0.85 + 0.3 * intensity))
      section.style.setProperty('--sun-brightness', String(0.85 + 0.3 * intensity))
    }

    const tick = () => {
      rafId = 0
      const scrollY = window.scrollY
      const delta = scrollY - prevScrollY
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight
      const inView = rect.bottom > 0 && rect.top < vh
      const centerOffset = Math.abs(rect.top + rect.height * 0.5 - vh * 0.5)
      const proximity = inView ? Math.max(0, 1 - centerOffset / (vh * 0.75)) : 0

      if (Math.abs(delta) > 0.5) {
        if (delta > 0) {
          targetIntensity = Math.max(MIN, targetIntensity - Math.min(delta * 0.003, 0.08))
        } else {
          targetIntensity = Math.min(MAX, targetIntensity + Math.min(-delta * 0.003, 0.08))
        }
      }

      const proximityTarget = MIN + (MAX - MIN) * proximity
      targetIntensity = Math.max(MIN, Math.min(MAX, targetIntensity * 0.7 + proximityTarget * 0.3))

      current += (targetIntensity - current) * 0.1
      applyVars(current)
      prevScrollY = scrollY
    }

    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(tick)
    }

    applyVars(current)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <section
      id="countdown"
      ref={sectionRef}
      className="countdown-section relative w-full overflow-hidden"
      style={{
        minHeight: '80vh',
        background: 'linear-gradient(180deg, #FAF0DC 0%, #F2E0BE 12%, #EDD5A8 40%, #E8CFA0 65%, #F0DEBC 88%, #FAF0DC 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(48px,8vw,80px) clamp(16px,4vw,40px)',
      }}
    >
      {/* Sun sits behind the foreground dune layer */}
      <div className="countdown-sun" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="countdown-sun-ray"
            style={{
              transform: `rotate(${i * 45}deg) scaleX(var(--ray-scale))`,
              background: 'linear-gradient(to right, rgba(220,170,70,var(--ray-opacity)), transparent)',
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
        <div className="countdown-sun-halo" />
        <div className="countdown-sun-disc" />
      </div>

      {/* Soft dunes — slice keeps shape on narrow screens instead of stretching */}
      <div className="countdown-dunes" aria-hidden="true">
        <svg viewBox="0 0 800 140" preserveAspectRatio="xMidYMax slice" focusable="false">
          <path
            d="M0,140 L0,78 C70,58 130,92 200,70 C280,44 340,86 420,62 C500,38 560,80 640,58 C710,42 760,70 800,56 L800,140 Z"
            fill="#E6CCA0"
          />
          <path
            d="M0,140 L0,92 C90,78 160,108 250,88 C340,68 410,104 500,84 C590,64 670,98 740,82 C770,76 790,88 800,84 L800,140 Z"
            fill="#DCC090"
          />
          <path
            d="M0,140 L0,112 C100,102 190,122 300,110 C410,98 520,124 630,112 C720,102 770,118 800,114 L800,140 Z"
            fill="#D4B478"
          />
        </svg>
      </div>

      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="countdown-spark absolute rounded-full motion-continuous"
          style={{
            left: `${(i * 31 + 8) % 80}%`,
            top: `${(i * 47 + 12) % 50}%`,
            width: 2,
            height: 2,
            background: '#C8943A',
            animation: `star-twinkle ${3 + (i % 4) * 0.7}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
            opacity: 0.22,
          }}
        />
      ))}

      <div ref={ref} className="relative text-center z-10">
        <p className="font-serif italic mb-4" style={{ fontSize: 13, letterSpacing: '0.3em', color: 'rgba(100,65,25,0.6)' }}>
          COUNTING DOWN TO
        </p>
        <h2
          className="font-serif mb-2"
          style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            color: '#3A1E08',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 1s ease, transform 1s ease',
            textShadow: '0 2px 16px rgba(255,220,120,0.6)',
          }}
        >
          10 September 2026
        </h2>
        <div
          className="flex gap-3 sm:gap-5 justify-center mt-8 flex-wrap"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1s ease 0.3s, transform 1s ease 0.3s',
          }}
        >
          {[
            { v: time.days, l: 'DAYS' },
            { v: time.hours, l: 'HOURS' },
            { v: time.minutes, l: 'MINUTES' },
            { v: time.seconds, l: 'SECONDS' },
          ].map(({ v, l }) => (
            <div
              key={l}
              className="countdown-tile flex flex-col items-center rounded-2xl"
              style={{
                background: 'rgba(255,250,238,0.65)',
                border: '1px solid rgba(180,130,70,0.22)',
                backdropFilter: 'blur(14px)',
                padding: 'clamp(14px,2.5vw,24px) clamp(14px,3vw,28px)',
                minWidth: 'clamp(72px, 18vw, 90px)',
                boxShadow: '0 4px 24px rgba(160,110,50,0.10)',
              }}
            >
              <span className="font-serif" style={{ fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1, color: '#7A4A20' }}>
                {String(v).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(90,45,10,0.65)', marginTop: 8 }}>
                {l}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Event Section ─────────────────────────────────────────────────────────────
const events = [
  { icon: '🌅', title: 'Guest Arrival & Welcome', time: '5:30 PM' },
  { icon: '🕌', title: 'Katb Ketab Ceremony', time: '6:30 PM' },
  { icon: '✨', title: 'Celebration', time: 'Following the ceremony' },
  { icon: '🍽', title: 'Dinner', time: '' },
  { icon: '🎉', title: 'Open Celebration', time: '' },
]

function EventCard({
  event,
  index,
  visible,
  className = '',
}: {
  event: (typeof events)[number]
  index: number
  visible: boolean
  className?: string
}) {
  return (
    <div
      className={`group relative rounded-3xl text-center transition-all duration-500 ${className}`}
      style={{
        padding: 'clamp(20px,3vw,32px)',
        background: 'rgba(253,248,240,0.9)',
        border: '1px solid rgba(196,113,79,0.2)',
        boxShadow: '0 4px 24px rgba(196,113,79,0.08)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.8s ease ${index * 0.12}s, transform 0.8s ease ${index * 0.12}s`,
      }}
    >
      <div style={{ position: 'absolute', top: 12, left: 12, width: 8, height: 8, background: 'var(--terracotta)', opacity: 0.3, imageRendering: 'pixelated' }} />
      <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, background: 'var(--terracotta)', opacity: 0.3 }} />
      <div style={{ position: 'absolute', bottom: 12, left: 12, width: 8, height: 8, background: 'var(--terracotta)', opacity: 0.3 }} />
      <div style={{ position: 'absolute', bottom: 12, right: 12, width: 8, height: 8, background: 'var(--terracotta)', opacity: 0.3 }} />

      <div className="transition-transform duration-300 group-hover:-translate-y-2">
        <div style={{ fontSize: 32, marginBottom: 16 }}>{event.icon}</div>
        <h3 className="font-serif" style={{ fontSize: 22, color: 'var(--text-dark)', marginBottom: 8 }}>{event.title}</h3>
        {event.time ? (
          <p style={{ fontSize: 13, letterSpacing: '0.15em', color: 'var(--text-light)', marginBottom: 16 }}>{event.time}</p>
        ) : (
          <div style={{ height: 13, marginBottom: 16 }} />
        )}
        <div style={{ width: 30, height: 1, background: 'var(--terracotta)', margin: '0 auto', opacity: 0.4 }} />
      </div>
    </div>
  )
}

function EventSection() {
  const { ref, visible } = useScrollReveal(0.15)
  const mainEvents = events.slice(0, 4)
  const featured = events[4]

  return (
    <section
      id="events"
      className="relative w-full section-pad"
      style={{ background: 'linear-gradient(to bottom, #E8D0A8, #FAF0DC)' }}
      ref={ref}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-section">
          <p className="font-serif italic mb-3" style={{ fontSize: 13, letterSpacing: '0.3em', color: 'var(--text-light)' }}>
            THE DAY
          </p>
          <h2 className="font-serif" style={{ fontSize: 'clamp(36px, 6vw, 60px)', color: 'var(--text-dark)' }}>
            Join Us
          </h2>
          <div style={{ width: 60, height: 2, background: 'var(--terracotta)', margin: '20px auto 0', opacity: 0.5 }} />
        </div>

        <div className="grid gap-4 sm:gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px,100%),1fr))' }}>
          {mainEvents.map((e, i) => (
            <EventCard key={e.title} event={e} index={i} visible={visible} />
          ))}
        </div>

        {featured && (
          <div className="flex justify-center mt-4 sm:mt-6">
            <EventCard
              event={featured}
              index={4}
              visible={visible}
              className="w-full max-w-[min(100%,280px)]"
            />
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Pixel Map Section ────────────────────────────────────────────────────────
function MapSection() {
  const { ref, visible } = useScrollReveal(0.15)

  return (
    <section
      id="map"
      className="relative w-full"
      style={{ background: 'linear-gradient(to bottom, #E8D0A8, #FAF0DC)', padding: 'clamp(64px,10vw,100px) clamp(16px,4vw,40px)' }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-serif italic mb-3" style={{ fontSize: 13, letterSpacing: '0.3em', color: 'var(--text-light)' }}>
            FIND US
          </p>
          <h2 className="font-serif" style={{ fontSize: 'clamp(32px, 5vw, 52px)', color: 'var(--text-dark)' }}>
            Getting There
          </h2>
          <div style={{ width: 60, height: 2, background: 'var(--terracotta)', margin: '20px auto 0', opacity: 0.5 }} />
        </div>

        {/* Map card */}
        <div
          ref={ref}
          className="relative overflow-hidden rounded-3xl"
          style={{
            border: '1px solid rgba(196,113,79,0.22)',
            boxShadow: '0 8px 40px rgba(196,113,79,0.12)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <svg
            viewBox="0 0 400 280"
            style={{ width: '100%', display: 'block' }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="mapSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B8D8CC" />
                <stop offset="75%" stopColor="#D8C098" />
                <stop offset="100%" stopColor="#E0C888" />
              </linearGradient>
              {/* Clip each dome to its top hemisphere only */}
              <clipPath id="dcMain">  <rect x="155" y="30"  width="90"  height="74" /></clipPath>
              <clipPath id="dcLeft">  <rect x="112" y="72"  width="54"  height="44" /></clipPath>
              <clipPath id="dcRight"> <rect x="234" y="72"  width="54"  height="44" /></clipPath>
              <clipPath id="dcML">    <rect x="93"  y="66"  width="20"  height="20" /></clipPath>
              <clipPath id="dcMR">    <rect x="287" y="66"  width="20"  height="20" /></clipPath>
            </defs>
            <rect width="400" height="280" fill="url(#mapSky)" />

            {/* Ground */}
            <rect y="196" width="400" height="84" fill="#E0C080" />
            <rect y="196" width="400" height="5"  fill="#D0B070" />

            {/* Dunes sides */}
            <rect x="0"   y="188" width="76"  height="10" fill="#CCAA68" />
            <rect x="0"   y="183" width="48"  height="5"  fill="#C8A460" />
            <rect x="0"   y="178" width="24"  height="5"  fill="#C09858" />
            <rect x="316" y="188" width="84"  height="10" fill="#CCAA68" />
            <rect x="340" y="183" width="60"  height="5"  fill="#C8A460" />
            <rect x="362" y="178" width="38"  height="5"  fill="#C09858" />

            {/* Horizontal road */}
            <rect x="0"   y="216" width="400" height="11" fill="#9B7A50" />
            <rect x="0"   y="221" width="400" height="4"  fill="#AE8C60" opacity="0.4" />
            {[6,46,86,126,166,206,246,286,326,366].map(x => (
              <rect key={x} x={x} y="221" width="28" height="2" fill="#E0C880" opacity="0.48" />
            ))}

            {/* Vertical approach road */}
            <rect x="191" y="104" width="12" height="114" fill="#9B7A50" />
            <rect x="195" y="104" width="4"  height="114" fill="#AE8C60" opacity="0.4" />

            {/* ══ HASSAN FATHI BUILDING ══ */}

            {/* Wide base platform */}
            <rect x="96"  y="182" width="208" height="16" fill="#F0DCB0" />
            <rect x="104" y="175" width="192" height="9"  fill="#E8D0A0" />

            {/* Colonnaded gallery row */}
            {[108,122,137,152,167,182,197,212,228,244,260,275].map((x,i) => (
              <rect key={i} x={x} y="148" width="7" height="27" fill="#E0C490" />
            ))}
            <rect x="104" y="146" width="192" height="4" fill="#DCC090" />

            {/* ── LEFT WING ── */}
            <rect x="100" y="114" width="68"  height="64"  fill="#D8A070" />
            <rect x="100" y="110" width="68"  height="6"   fill="#CC9060" />
            {/* Left wing dome — proper ellipse hemisphere */}
            <rect x="106" y="108" width="56"  height="4"   fill="#C28458" />
            <ellipse cx="134" cy="108" rx="26" ry="24" fill="#C07050" clipPath="url(#dcLeft)" />
            {/* Left dome finial */}
            <rect x="133" y="72"  width="3"   height="8"   fill="#C4714F" />
            <ellipse cx="134" cy="72" rx="4" ry="4" fill="#D48050" />
            {/* Left wing Moorish arched windows */}
            <path d="M112,174 L112,155 Q119,147 126,155 L126,174 Z" fill="#5A2E10" />
            <path d="M130,174 L130,155 Q137,147 144,155 L144,174 Z" fill="#5A2E10" />
            <path d="M148,174 L148,155 Q155,147 162,155 L162,174 Z" fill="#5A2E10" />
            {/* Left wing side windows */}
            <path d="M108,138 L108,124 Q115,117 122,124 L122,138 Z" fill="#6A3818" />
            <path d="M126,138 L126,124 Q133,117 140,124 L140,138 Z" fill="#6A3818" />
            <path d="M144,138 L144,124 Q151,117 158,124 L158,138 Z" fill="#6A3818" />

            {/* ── RIGHT WING ── */}
            <rect x="232" y="114" width="68"  height="64"  fill="#D8A070" />
            <rect x="232" y="110" width="68"  height="6"   fill="#CC9060" />
            {/* Right wing dome */}
            <rect x="236" y="108" width="56"  height="4"   fill="#C28458" />
            <ellipse cx="266" cy="108" rx="26" ry="24" fill="#C07050" clipPath="url(#dcRight)" />
            {/* Right dome finial */}
            <rect x="264" y="72"  width="3"   height="8"   fill="#C4714F" />
            <ellipse cx="265" cy="72" rx="4" ry="4" fill="#D48050" />
            {/* Right wing Moorish arched windows */}
            <path d="M238,174 L238,155 Q245,147 252,155 L252,174 Z" fill="#5A2E10" />
            <path d="M256,174 L256,155 Q263,147 270,155 L270,174 Z" fill="#5A2E10" />
            <path d="M274,174 L274,155 Q281,147 288,155 L288,174 Z" fill="#5A2E10" />
            {/* Right wing side windows */}
            <path d="M242,138 L242,124 Q249,117 256,124 L256,138 Z" fill="#6A3818" />
            <path d="M260,138 L260,124 Q267,117 274,124 L274,138 Z" fill="#6A3818" />
            <path d="M278,138 L278,124 Q285,117 292,124 L292,138 Z" fill="#6A3818" />

            {/* ── CENTRAL BLOCK ── */}
            <rect x="162" y="96"  width="76"  height="82"  fill="#C4784E" />
            <rect x="162" y="92"  width="76"  height="6"   fill="#B86E44" />
            {/* Central Moorish grand arch doorway */}
            <path d="M182,196 L182,152 Q200,128 218,152 L218,196 Z" fill="#4A2008" />
            {/* Side arched windows on central block */}
            <path d="M166,138 L166,118 Q175,108 184,118 L184,138 Z" fill="#5A2810" />
            <path d="M216,138 L216,118 Q225,108 234,118 L234,138 Z" fill="#5A2810" />

            {/* ── CENTRAL MAIN DOME — smooth ellipse ── */}
            <rect x="166" y="92"  width="68"  height="5"   fill="#B06848" />
            <rect x="170" y="87"  width="60"  height="5"   fill="#A86040" />
            <ellipse cx="200" cy="86" rx="40" ry="36" fill="#A05838" clipPath="url(#dcMain)" />
            {/* Dome finial */}
            <rect x="198" y="30"  width="4"   height="14"  fill="#C4714F" />
            <ellipse cx="200" cy="30" rx="6" ry="6" fill="#D48050" />

            {/* ── LEFT MINARET ── */}
            <rect x="96"  y="92"  width="12"  height="104" fill="#CC9860" />
            <rect x="93"  y="130" width="18"  height="4"   fill="#E8CFA0" />
            <rect x="94"  y="158" width="16"  height="4"   fill="#E8CFA0" />
            {/* Left minaret dome */}
            <rect x="94"  y="88"  width="12"  height="4"   fill="#BA8450" />
            <ellipse cx="102" cy="86" rx="8" ry="8" fill="#B07848" clipPath="url(#dcML)" />
            <rect x="101" y="66"  width="2"   height="10"  fill="#C4714F" />

            {/* ── RIGHT MINARET ── */}
            <rect x="292" y="92"  width="12"  height="104" fill="#CC9860" />
            <rect x="289" y="130" width="18"  height="4"   fill="#E8CFA0" />
            <rect x="290" y="158" width="16"  height="4"   fill="#E8CFA0" />
            {/* Right minaret dome */}
            <rect x="290" y="88"  width="12"  height="4"   fill="#BA8450" />
            <ellipse cx="298" cy="86" rx="8" ry="8" fill="#B07848" clipPath="url(#dcMR)" />
            <rect x="297" y="66"  width="2"   height="10"  fill="#C4714F" />

            {/* Palm trees — curved SVG paths matching sprite aesthetic */}
            {[55, 152, 252, 349].map((x, i) => (
              <g key={i}>
                {/* Curved trunk */}
                <path d={`M${x+2},196 Q${x},183 ${x+3},172 Q${x+5},162 ${x+1},150`}
                      stroke="#7A5030" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
                {/* Frond left-far */}
                <path d={`M${x+1},150 Q${x-14},140 ${x-20},132`}
                      stroke="#4A7838" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                {/* Frond left-mid */}
                <path d={`M${x+1},150 Q${x-8},138 ${x-6},128`}
                      stroke="#5A8848" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                {/* Frond center-left */}
                <path d={`M${x+1},150 Q${x-2},136 ${x+2},126`}
                      stroke="#5A8848" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                {/* Frond center-right */}
                <path d={`M${x+1},150 Q${x+8},136 ${x+10},126`}
                      stroke="#5A8848" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                {/* Frond right-mid */}
                <path d={`M${x+1},150 Q${x+15},140 ${x+18},130`}
                      stroke="#4A7838" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                {/* Frond right-far */}
                <path d={`M${x+1},150 Q${x+20},144 ${x+24},136`}
                      stroke="#4A7838" strokeWidth="2" fill="none" strokeLinecap="round"/>
                {/* Date cluster */}
                <circle cx={x+2} cy={152} r="3.5" fill="#8B6030" opacity="0.75"/>
              </g>
            ))}

            {/* Pulsing location pin */}
            <g style={{ animation: 'glow-pulse 2.5s ease-in-out infinite' }}>
              <rect x="196" y="8"  width="8"  height="12" fill="#C4714F" />
              <polygon points="196,20 204,20 200,30" fill="#C4714F" />
              <rect x="197" y="10" width="6"  height="6"  fill="#FDF8F0" />
            </g>
            <rect x="158" y="196" width="84" height="0" />

            {/* Venue label */}
            <rect x="158" y="194" width="84" height="0" />
            <rect x="160" y="8"  width="0"  height="0" />
            <rect x="156" y="196" width="0" height="0" />

            {/* Label chip — floating above pin */}
            <rect x="155" y="194" width="0" height="0" />

            {/* Birds */}
            <g style={{ animation: 'bird-cross 24s linear -8s infinite' }}>
              <rect x="0"  y="28" width="3" height="1" fill="#3C2A14" opacity="0.42"/>
              <rect x="7"  y="28" width="3" height="1" fill="#3C2A14" opacity="0.42"/>
              <rect x="2"  y="29" width="5" height="1" fill="#3C2A14" opacity="0.42"/>
              <rect x="18" y="22" width="3" height="1" fill="#3C2A14" opacity="0.3"/>
              <rect x="25" y="22" width="3" height="1" fill="#3C2A14" opacity="0.3"/>
              <rect x="20" y="23" width="5" height="1" fill="#3C2A14" opacity="0.3"/>
            </g>
            <g style={{ animation: 'bird-cross 38s linear -22s infinite' }}>
              <rect x="0"  y="50" width="2" height="1" fill="#3C2A14" opacity="0.25"/>
              <rect x="5"  y="50" width="2" height="1" fill="#3C2A14" opacity="0.25"/>
              <rect x="1"  y="51" width="4" height="1" fill="#3C2A14" opacity="0.25"/>
            </g>
          </svg>
        </div>

        {/* Info + CTA card */}
        <div
          className="mt-6 rounded-3xl p-8 text-center"
          style={{
            background: 'rgba(253,248,240,0.88)',
            border: '1px solid rgba(196,113,79,0.2)',
            backdropFilter: 'blur(10px)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 1s cubic-bezier(0.16,1,0.3,1) 0.2s, transform 1s cubic-bezier(0.16,1,0.3,1) 0.2s',
          }}
        >
          <p className="font-serif" style={{ fontSize: 22, color: 'var(--text-dark)', marginBottom: 4 }}>Maqam</p>
          <p style={{ fontSize: 13, letterSpacing: '0.12em', color: 'var(--text-light)', marginBottom: 24 }}>
            Orabi, Cairo · 10 September 2026
          </p>
          <a
            href="https://maps.google.com/?q=Maqam,Orabi,Cairo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-10 py-3 rounded-full font-serif italic transition-all duration-300"
            style={{
              background: 'var(--terracotta)',
              color: '#FDF8F0',
              fontSize: 16,
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(196,113,79,0.3)',
            }}
          >
            Open Google Maps ✦
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Photo Upload Section ─────────────────────────────────────────────────────
function PhotoUploadSection() {
  const { ref, visible } = useScrollReveal(0.1)

  return (
    <section
      id="photos"
      className="relative w-full"
      style={{ background: 'linear-gradient(to bottom, #E8D0A8, #F2E4C8)', padding: 'clamp(64px,10vw,100px) clamp(16px,4vw,40px)' }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <p className="font-serif italic mb-3" style={{ fontSize: 13, letterSpacing: '0.3em', color: 'var(--text-light)' }}>
          YOUR PHOTOS
        </p>
        <h2 className="font-serif mb-6" style={{ fontSize: 'clamp(36px, 6vw, 56px)', color: 'var(--text-dark)', lineHeight: 1.1 }}>
          Share the Day
        </h2>
        <p className="font-serif italic mb-12" style={{ fontSize: 18, color: 'var(--text-mid)', lineHeight: 1.7, opacity: 0.85 }}>
          Every photo you took is a piece of our memory.<br />
          Upload anything from the day — we would love to see it through your eyes.
        </p>

        {/* Pixel camera icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <svg width="80" height="64" viewBox="0 0 40 32" style={{ imageRendering: 'pixelated' }} xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="8" width="36" height="22" fill="#C4714F" />
            <rect x="8" y="4" width="10" height="6" fill="#B06040" />
            <rect x="28" y="10" width="6" height="4" fill="#F8D060" />
            <rect x="4" y="10" width="4" height="3" fill="#B06040" />
            <circle cx="20" cy="19" r="7" fill="#3A2010" />
            <circle cx="20" cy="19" r="5" fill="#6888A8" />
            <circle cx="18" cy="17" r="2" fill="#C0D8EC" opacity="0.75" />
            <rect x="2" y="8" width="36" height="3" fill="#D4836A" />
          </svg>
        </div>

        {/* Main card */}
        <div
          ref={ref}
          className="relative rounded-3xl p-10"
          style={{
            background: 'rgba(253,248,240,0.92)',
            border: '1px solid rgba(196,113,79,0.25)',
            boxShadow: '0 8px 40px rgba(196,113,79,0.12)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 1s ease, transform 1s ease',
          }}
        >
          {/* Pixel corner dots */}
          {(['top-3 left-3','top-3 right-3','bottom-3 left-3','bottom-3 right-3'] as const).map((pos, i) => (
            <div key={i} className={`absolute ${pos}`} style={{ width: 8, height: 8, background: 'var(--terracotta)', opacity: 0.28 }} />
          ))}

          <div style={{ fontSize: 44, marginBottom: 16 }}>📷</div>

          <h3 className="font-serif mb-4" style={{ fontSize: 28, color: 'var(--text-dark)' }}>
            Add Your Photos
          </h3>
          <p style={{ fontSize: 15, color: 'var(--text-mid)', marginBottom: 32, lineHeight: 1.8, opacity: 0.85 }}>
            Click below to open our shared Google Drive folder.<br />
            Upload any photos or videos you've captured on our wedding day.
          </p>

          <a
            href="https://drive.google.com/drive/folders/1MAwfDVxVJ1NCfQoE15d9lgde1pALq2n0?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-10 py-4 rounded-full font-serif italic transition-all duration-300"
            style={{
              background: 'var(--terracotta)',
              color: '#FDF8F0',
              fontSize: 18,
              textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(196,113,79,0.35)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(196,113,79,0.5)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(196,113,79,0.35)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
          >
            Open Wedding Album ✦
          </a>

          <p style={{ fontSize: 11, marginTop: 20, letterSpacing: '0.15em', color: 'var(--text-light)', opacity: 0.65 }}>
            GOOGLE DRIVE · ANYONE WITH THE LINK CAN UPLOAD
          </p>
        </div>

        {/* Pixel decoration strip */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 40 }}>
          {Array.from({ length: 13 }).map((_, i) => (
            <div key={i} style={{
              width: i % 4 === 2 ? 10 : 6,
              height: 4,
              background: i % 4 === 2 ? 'var(--terracotta)' : 'var(--sand)',
              opacity: i % 4 === 2 ? 0.8 : 0.4,
            }} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── RSVP Section (Google Form embed) ─────────────────────────────────────────
function toGoogleFormEmbedUrl(raw: string): string {
  try {
    const url = new URL(raw)
    if (url.pathname.includes('/viewform')) {
      url.searchParams.set('embedded', 'true')
      return url.toString()
    }
  } catch {
    // fall through
  }
  return raw.includes('embedded=true') ? raw : `${raw}${raw.includes('?') ? '&' : '?'}embedded=true`
}

function RSVPSection() {
  const { ref, visible } = useScrollReveal(0.1)
  const [doorOpen, setDoorOpen] = useState(false)
  const embedUrl = GOOGLE_FORM_URL ? toGoogleFormEmbedUrl(GOOGLE_FORM_URL) : null
  const openUrl = embedUrl
    ? embedUrl.replace('embedded=true', 'usp=sf_link')
    : null

  return (
    <section
      id="rsvp"
      className="relative w-full"
      style={{ background: 'linear-gradient(to bottom, #F2E4C8, #E8D0A8)', padding: '100px 24px', minHeight: '80vh' }}
    >
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-serif italic mb-3" style={{ fontSize: 13, letterSpacing: '0.3em', color: 'var(--text-light)' }}>
            YOU ARE INVITED
          </p>
          <h2 className="font-serif mb-4" style={{ fontSize: 'clamp(36px, 6vw, 60px)', color: 'var(--text-dark)' }}>
            Will you join us?
          </h2>
        </div>

        {!doorOpen && (
          <div ref={ref} className="relative flex justify-center mb-10">
            <div
              className="relative overflow-hidden rounded-3xl"
              style={{
                width: 'min(280px, calc(100vw - 80px))',
                height: 'min(320px, 60vw)',
                background: '#D4956A',
                border: '4px solid rgba(155,107,74,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: visible ? 1 : 0,
                transition: 'opacity 1s ease',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #CC8860, #D4956A)' }} />
              <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                <div style={{ width: 6, height: 6, background: '#F0B429', borderRadius: '50%', margin: '0 auto 8px', animation: 'lantern-flicker 2s infinite' }} />
                <p className="font-serif italic" style={{ fontSize: 11, color: 'rgba(253,248,240,0.7)', letterSpacing: '0.15em' }}>RSVP</p>
              </div>
              <div
                className="absolute"
                style={{ left: '10%', top: '25%', width: '38%', height: '60%', background: '#B87050', border: '2px solid rgba(100,50,20,0.4)', borderRadius: '4px 4px 0 0', transformOrigin: 'left center' }}
              >
                <div style={{ width: 8, height: 8, background: '#F0B429', borderRadius: '50%', position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <div
                className="absolute"
                style={{ right: '10%', top: '25%', width: '38%', height: '60%', background: '#B87050', border: '2px solid rgba(100,50,20,0.4)', borderRadius: '4px 4px 0 0', transformOrigin: 'right center' }}
              >
                <div style={{ width: 8, height: 8, background: '#F0B429', borderRadius: '50%', position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ position: 'absolute', top: `${22 + i * 3}%`, left: `${10 + i * 2}%`, right: `${10 + i * 2}%`, height: 3, background: 'rgba(155,80,40,0.4)' }} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setDoorOpen(true)}
              className="absolute bottom-0 translate-y-6 px-8 py-3 rounded-full font-serif italic transition-all duration-300"
              style={{
                background: 'var(--terracotta)',
                color: '#FDF8F0',
                fontSize: 15,
                boxShadow: '0 4px 20px rgba(196,113,79,0.35)',
              }}
            >
              Open the Doors ✦
            </button>
          </div>
        )}

        {doorOpen && (
          <div style={{ animation: 'scale-in 0.6s ease-out forwards' }}>
            <div
              className="rounded-3xl p-4 sm:p-6"
              style={{
                background: 'rgba(253,248,240,0.92)',
                border: '1px solid rgba(196,113,79,0.25)',
                boxShadow: '0 8px 40px rgba(196,113,79,0.15)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 16 }}>
                {[...Array(7)].map((_, i) => (
                  <div key={i} style={{ width: 6, height: 6, background: i === 3 ? 'var(--terracotta)' : 'var(--sand)', opacity: i === 3 ? 1 : 0.5 }} />
                ))}
              </div>

              {embedUrl ? (
                <>
                  <iframe
                    title="RSVP form"
                    src={embedUrl}
                    width="100%"
                    height="640"
                    frameBorder={0}
                    marginHeight={0}
                    marginWidth={0}
                    style={{
                      display: 'block',
                      width: '100%',
                      minHeight: 560,
                      border: 'none',
                      borderRadius: 16,
                      background: '#fff',
                    }}
                  >
                    Loading…
                  </iframe>
                  {openUrl && (
                    <p style={{ textAlign: 'center', marginTop: 16 }}>
                      <a
                        href={openUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-serif italic"
                        style={{ color: 'var(--terracotta)', fontSize: 14 }}
                      >
                        Open form in a new tab ✦
                      </a>
                    </p>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <p className="font-serif" style={{ fontSize: 20, color: 'var(--text-dark)', marginBottom: 12 }}>
                    RSVP form coming soon
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.6 }}>
                    Add <code style={{ fontSize: 12 }}>VITE_GOOGLE_FORM_URL</code> to your environment.
                    See <strong>RSVP_SETUP.md</strong> for the Google Forms steps.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      className="w-full text-center"
      style={{
        background: '#C4714F',
        padding: '60px 24px 40px',
        color: 'rgba(253,248,240,0.8)',
      }}
    >
      {/* Pixel border top */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 40 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{ width: i % 4 === 0 ? 10 : 6, height: 4, background: 'rgba(253,248,240,0.3)' }} />
        ))}
      </div>

      <h2 className="font-serif" style={{ fontSize: 'clamp(40px, 7vw, 72px)', color: '#FDF8F0', marginBottom: 8 }}>
        Maryam &amp; Ahmed
      </h2>
      <p className="font-serif italic" style={{ fontSize: 18, marginBottom: 4, opacity: 0.75 }}>
        10 September 2026
      </p>
      <p style={{ fontSize: 12, letterSpacing: '0.25em', opacity: 0.55, marginBottom: 40 }}>
        MAQAM · ORABI · CAIRO
      </p>

      <p className="font-serif italic" style={{ fontSize: 15, opacity: 0.5 }}>
        "Every path led us here."
      </p>

      {/* Pixel stars */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 32, opacity: 0.4 }}>
        {['✦', '✧', '✦'].map((s, i) => (
          <span key={i} style={{ fontSize: 14, color: '#F0B429', animation: `star-twinkle ${2 + i * 0.4}s ease-in-out infinite` }}>{s}</span>
        ))}
      </div>
    </footer>
  )
}

// ─── Nav Dots ─────────────────────────────────────────────────────────────────
const navSections = ['hero', 'story', 'countdown', 'events', 'map', 'rsvp', 'photos']

function NavDots({ active }: { active: string }) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav
      className="fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 flex-col gap-2 sm:gap-3 z-[9990] hidden sm:flex"
      style={{ mixBlendMode: 'multiply' }}
    >
      {navSections.map(s => (
        <button
          type="button"
          key={s}
          onClick={() => scrollTo(s)}
          title={s}
          aria-label={`Go to ${s} section`}
          style={{
            width: s === active ? 10 : 6,
            height: s === active ? 10 : 6,
            borderRadius: '50%',
            background: s === active ? 'var(--terracotta)' : 'rgba(155,107,74,0.4)',
            border: 'none',
            padding: 0,
            transition: 'all 0.3s ease',
            boxShadow: s === active ? '0 0 8px rgba(196,113,79,0.6)' : 'none',
          }}
        />
      ))}
    </nav>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeSection, setActiveSection] = useState('hero')
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const userWantsMusicRef = useRef(true)
  const listenersAttachedRef = useRef(false)
  const tryPlayRef = useRef<() => Promise<boolean>>(async () => false)
  const interactionHandlerRef = useRef<() => void>(() => {})

  const removeInteractionListeners = useCallback(() => {
    if (!listenersAttachedRef.current) return
    ;(['pointerdown', 'touchstart', 'keydown', 'scroll'] as const).forEach(ev => {
      window.removeEventListener(ev, interactionHandlerRef.current)
    })
    listenersAttachedRef.current = false
  }, [])

  const attachInteractionListeners = useCallback(() => {
    if (listenersAttachedRef.current) return
    ;(['pointerdown', 'touchstart', 'keydown', 'scroll'] as const).forEach(ev => {
      window.addEventListener(ev, interactionHandlerRef.current, { passive: true })
    })
    listenersAttachedRef.current = true
  }, [])

  const tryPlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || !userWantsMusicRef.current) return false
    try {
      await audio.play()
      setIsPlaying(true)
      removeInteractionListeners()
      return true
    } catch {
      setIsPlaying(false)
      return false
    }
  }, [removeInteractionListeners])

  tryPlayRef.current = tryPlay
  interactionHandlerRef.current = () => { void tryPlayRef.current() }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = 0.45
    audio.preload = 'auto'

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    void tryPlay().then(success => {
      if (!success) attachInteractionListeners()
    })

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      removeInteractionListeners()
    }
  }, [tryPlay, attachInteractionListeners, removeInteractionListeners])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActiveSection(e.target.id)
        })
      },
      { threshold: 0.4 },
    )
    navSections.forEach(id => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  const toggleMusic = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      userWantsMusicRef.current = false
      audio.pause()
    } else {
      userWantsMusicRef.current = true
      void tryPlay().then(success => {
        if (!success) attachInteractionListeners()
      })
    }
  }

  const handleInteraction = () => {
    void tryPlay()
  }

  const beginJourney = () => {
    document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ background: 'var(--warm-white)' }}>
      <audio ref={audioRef} src={musicSrc} loop preload="auto" />
      <CustomCursor />
      <MusicButton playing={isPlaying} toggle={toggleMusic} />
      <NavDots active={activeSection} />

      <HeroSection onBegin={beginJourney} onInteraction={handleInteraction} />
      <StorySection />
      <CountdownSection />
      <EventSection />
      <MapSection />
      <RSVPSection />
      <PhotoUploadSection />
      <Footer />
    </div>
  )
}
