/**
 * Serve Unity WebGL .br files with Content-Encoding so the browser decompresses them.
 * Cloudflare Static Assets / _headers alone often omit this header, which breaks Unity.
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const pathname = url.pathname

    // Let the assets binding serve the file, then fix Unity Brotli headers.
    if (pathname.includes('/game/Build/') && pathname.endsWith('.br')) {
      const asset = await env.ASSETS.fetch(request)
      if (!asset.ok) return asset

      const headers = new Headers(asset.headers)
      headers.set('Content-Encoding', 'br')
      headers.delete('Content-Length') // length is for compressed body; browsers recalculate

      if (pathname.endsWith('.wasm.br')) {
        headers.set('Content-Type', 'application/wasm')
      } else if (pathname.endsWith('.js.br')) {
        headers.set('Content-Type', 'application/javascript')
      } else if (pathname.endsWith('.data.br')) {
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
