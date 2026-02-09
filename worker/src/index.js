const ALLOWED_ORIGIN = 'https://dayonebuilder.github.io';
const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

// Simple in-memory rate limiting: max 30 requests per minute per IP
const rateLimitMap = new Map();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      if (origin !== ALLOWED_ORIGIN) {
        return new Response('Forbidden', { status: 403 });
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Only POST /transcribe
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/transcribe') {
      return new Response('Not Found', { status: 404 });
    }

    // Origin check
    if (origin !== ALLOWED_ORIGIN) {
      return new Response('Forbidden', { status: 403 });
    }

    // Rate limiting
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Proxy to Groq
    try {
      const body = await request.arrayBuffer();

      const groqResp = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': request.headers.get('Content-Type'),
        },
        body,
      });

      const respBody = await groqResp.text();

      return new Response(respBody, {
        status: groqResp.status,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': groqResp.headers.get('Content-Type') || 'application/json',
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Proxy error' }), {
        status: 502,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
  },
};
