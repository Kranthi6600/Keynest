export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': 'https://app.keynest.app',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }

    if (req.method === 'OPTIONS') return new Response(null, { headers: cors, status: 204 })
    if (req.method !== 'POST') return new Response(null, { headers: cors, status: 405 })
    if (req.headers.get('DNT') === '1' || req.headers.get('Sec-GPC') === '1') {
      return new Response(null, { headers: cors, status: 204 })
    }

    const event = new URL(req.url).pathname.slice(1)
    if (!['install', 'unlock', 'export'].includes(event)) {
      return new Response(null, { headers: cors, status: 400 })
    }

    const day = new Date().toISOString().slice(0, 10)
    const key = `${day}:${event}`
    const n = Number(await env.METRICS.get(key)) || 0
    await env.METRICS.put(key, String(n + 1))

    return new Response(null, { headers: cors, status: 204 })
  }
}
