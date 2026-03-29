// FSI Language Study App - Sync Worker
// Deploy this as a Cloudflare Worker with a KV namespace bound as "PROGRESS"

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'GET') {
      const url = new URL(request.url);
      const code = url.searchParams.get('code');
      const course = url.searchParams.get('course');
      if (!code) {
        return new Response(JSON.stringify({ error: 'Missing code' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const key = course ? `progress:${code}:${course}` : `progress:${code}`;
      let data = await env.PROGRESS.get(key);

      // Migration: if course-specific key has no data, try the old flat key
      if (!data && course) {
        data = await env.PROGRESS.get(`progress:${code}`);
      }

      if (!data) {
        return new Response(JSON.stringify(null), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(data, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'PUT') {
      const body = await request.json();
      const code = body.code;
      const course = body.course;
      if (!code) {
        return new Response(JSON.stringify({ error: 'Missing code' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const key = course ? `progress:${code}:${course}` : `progress:${code}`;
      const payload = JSON.stringify({ srs: body.srs, studied: body.studied, updated: Date.now() });
      await env.PROGRESS.put(key, payload);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
};
