/**
 * Optional Content-Encoding for precompressed Unity assets.
 * The game page also decompresses in-browser (gzip) when hosts omit these headers.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const pathname = url.pathname

    if (pathname.includes('/game/Build/') && (pathname.endsWith('.gz') || pathname.endsWith('.br'))) {
      const asset = await env.ASSETS.fetch(request)
      if (!asset.ok) return asset

      const headers = new Headers(asset.headers)
      headers.delete('Content-Length')

      if (pathname.endsWith('.gz')) {
        headers.set('Content-Encoding', 'gzip')
      } else {
        headers.set('Content-Encoding', 'br')
      }

      if (pathname.includes('.wasm.')) {
        headers.set('Content-Type', 'application/wasm')
      } else if (pathname.includes('.js.') || pathname.endsWith('.js.gz') || pathname.endsWith('.js.br')) {
        headers.set('Content-Type', 'application/javascript')
      } else if (pathname.includes('.data.')) {
        headers.set('Content-Type', 'application/octet-stream')
      }

      headers.set('Cache-Control', 'public, max-age=31536000, immutable')

      return new Response(asset.body, {
        status: asset.status,
        statusText: asset.statusText,
        headers,
      })
    }

    return env.ASSETS.fetch(request)
  },
}
