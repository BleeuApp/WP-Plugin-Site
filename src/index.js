export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // License validation endpoint: /api/validate?key=XXXX
    if (url.pathname === "/api/validate" && url.searchParams.has("key")) {
      const key = url.searchParams.get("key");
      const { results } = await env.DB.prepare(
        "SELECT * FROM licenses WHERE license_key = ?"
      ).bind(key).all();

      if (results.length > 0) {
        return new Response(JSON.stringify({ valid: true }), { headers: { "Content-Type": "application/json" } });
      } else {
        return new Response(JSON.stringify({ valid: false }), { headers: { "Content-Type": "application/json" } });
      }
    }

    // Default: Not found
    return new Response("Not found", { status: 404 });
  }
}