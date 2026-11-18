// Iri, the AI receptionist. Vercel serverless function: POST /api/chat
// Body: { messages: [{ role: 'user' | 'assistant', content: string }] }
// Streams back plain text. The API key lives only in the NVIDIA_API_KEY env var.
import { SYSTEM_PROMPT } from '../src/iri/knowledge.js'

const API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
const MODEL = process.env.IRI_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b'
const MAX_MESSAGES = 16
const MAX_CHARS = 800
const LANG_REMINDER = 'Reply in the same language as the customer\'s last message (English → English, español → español). Only state facts from the IriCookies information; never claim ingredients or allergens.'

// Best-effort per-instance rate limit: 20 requests / minute / IP.
const hits = new Map()
function limited(ip) {
  const now = Date.now()
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000)
  arr.push(now)
  hits.set(ip, arr)
  if (hits.size > 5000) hits.clear()
  return arr.length > 20
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') return JSON.parse(req.body)
  let raw = ''
  for await (const chunk of req) { raw += chunk; if (raw.length > 64_000) throw new Error('too large') }
  return JSON.parse(raw || '{}')
}

export function cleanMessages(input) {
  if (!Array.isArray(input)) return null
  const msgs = input
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
  while (msgs.length && msgs[0].role !== 'user') msgs.shift()
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return null
  return msgs
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; res.setHeader('Allow', 'POST'); return res.end('Method not allowed') }
  const key = process.env.NVIDIA_API_KEY
  if (!key) { res.statusCode = 503; return res.end('Iri is not configured') }

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'anon').split(',')[0].trim()
  if (limited(ip)) { res.statusCode = 429; return res.end('Too many messages, try again in a minute') }

  let messages
  try { messages = cleanMessages((await readBody(req)).messages) } catch { messages = null }
  if (!messages) { res.statusCode = 400; return res.end('Bad request') }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 45_000)
  req.on?.('close', () => { if (!res.writableEnded) ctrl.abort() })

  let upstream
  try {
    upstream = await fetch(API_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages, { role: 'system', content: LANG_REMINDER }],
        temperature: 0.4,
        top_p: 0.9,
        max_tokens: 600,
        stream: true,
        chat_template_kwargs: { enable_thinking: false },
      }),
    })
  } catch (e) {
    clearTimeout(timer)
    res.statusCode = 502; return res.end('Upstream unavailable')
  }
  if (!upstream.ok || !upstream.body) {
    clearTimeout(timer)
    console.error('iri upstream', upstream.status, await upstream.text().catch(() => ''))
    res.statusCode = 502; return res.end('Upstream error')
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Accel-Buffering', 'no')

  const decoder = new TextDecoder()
  let buf = ''
  try {
    for await (const chunk of upstream.body) {
      buf += decoder.decode(chunk, { stream: true })
      let nl
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim()
        buf = buf.slice(nl + 1)
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (data === '[DONE]') continue
        try {
          const text = JSON.parse(data).choices?.[0]?.delta?.content
          if (text) res.write(text)
        } catch { /* partial / keep-alive line */ }
      }
    }
  } catch (e) {
    console.error('iri stream', e?.message)
  } finally {
    clearTimeout(timer)
    res.end()
  }
}
