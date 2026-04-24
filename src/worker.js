/**
 * REP•TARO — Cloudflare Worker API
 * Handles /api/* routes backed by KV storage.
 * All other requests fall through to static assets.
 */

const VALID_RESOURCES = ['sellers', 'products', 'coupons', 'announcements'];
const DEFAULT_TOKEN = 'rt-taro-admin-2025';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Pass non-API requests straight to static assets
    if (!path.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    function json(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    function checkAuth(req) {
      const token = req.headers.get('X-Admin-Token') || '';
      const expected = (env.ADMIN_TOKEN || DEFAULT_TOKEN);
      return token === expected;
    }

    // Extract resource name: /api/sellers → "sellers"
    const resource = path.replace('/api/', '').split('/')[0];

    if (!VALID_RESOURCES.includes(resource)) {
      return json({ error: 'Not found' }, 404);
    }

    // ── GET ── Return stored data (or empty array)
    if (method === 'GET') {
      try {
        const data = await env.ADMIN_DATA.get(resource);
        return json(data ? JSON.parse(data) : []);
      } catch (e) {
        return json({ error: 'KV read failed', detail: String(e) }, 500);
      }
    }

    // ── POST ── Save data (auth required)
    if (method === 'POST') {
      if (!checkAuth(request)) {
        return json({ error: 'Unauthorized' }, 401);
      }
      try {
        const body = await request.json();
        await env.ADMIN_DATA.put(resource, JSON.stringify(body));
        return json({ ok: true, saved: Array.isArray(body) ? body.length : 1 });
      } catch (e) {
        return json({ error: 'KV write failed', detail: String(e) }, 500);
      }
    }

    return json({ error: 'Method not allowed' }, 405);
  },
};
