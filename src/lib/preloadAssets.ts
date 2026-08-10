/** Preload images (and optional audio) before revealing the hero scene. */

export async function decodeImage(src: string): Promise<void> {
  const img = new Image()
  img.decoding = 'async'
  img.src = src

  if (typeof img.decode === 'function') {
    try {
      await img.decode()
      return
    } catch {
      // Fall through to onload / onerror path
    }
  }

  if (img.complete && img.naturalWidth > 0) return

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
  })
}

export async function warmAudio(src: string): Promise<void> {
  try {
    const audio = new Audio()
    audio.preload = 'auto'
    audio.src = src
    await new Promise<void>((resolve) => {
      const done = () => resolve()
      audio.addEventListener('canplaythrough', done, { once: true })
      audio.addEventListener('error', done, { once: true })
      // Some browsers never fire canplaythrough for large files — don't hang forever
      setTimeout(done, 4000)
      try {
        audio.load()
      } catch {
        done()
      }
    })
  } catch {
    // Non-fatal — playback can still start later
  }
}

/**
 * Wait until critical assets are decoded, or until timeout / failures settle.
 * Never blocks the site permanently on a single failed asset.
 */
export async function preloadCriticalAssets(
  imageSrcs: string[],
  options?: { audioSrc?: string; timeoutMs?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 10000

  const imageWork = Promise.allSettled(imageSrcs.map((src) => decodeImage(src)))
  const audioWork = options?.audioSrc ? warmAudio(options.audioSrc) : Promise.resolve()

  await Promise.race([
    Promise.all([imageWork, audioWork]),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ])
}
