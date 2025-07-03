export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // License validation endpoint: /api/validate?key=XXXX&domain=example.com
    if (url.pathname === "/api/validate" && url.searchParams.has("key") && url.searchParams.has("domain")) {
      const key = url.searchParams.get("key");
      const domain = url.searchParams.get("domain");

      // Check if license exists
      const { results } = await env.DB.prepare(
        "SELECT * FROM licenses WHERE license_key = ?"
      ).bind(key).all();

      if (results.length === 0) {
        return new Response(JSON.stringify({ valid: false, reason: "Invalid key" }), { headers: { "Content-Type": "application/json" } });
      }

      const license = results[0];

      // If site_domain is not set, bind it to this domain
      if (!license.site_domain) {
        await env.DB.prepare(
          "UPDATE licenses SET site_domain = ? WHERE license_key = ?"
        ).bind(domain, key).run();
        return new Response(JSON.stringify({ valid: true, activated: true }), { headers: { "Content-Type": "application/json" } });
      }

      // If site_domain matches, valid
      if (license.site_domain === domain) {
        return new Response(JSON.stringify({ valid: true, activated: false }), { headers: { "Content-Type": "application/json" } });
      }

      // Otherwise, invalid (key used on another domain)
      return new Response(JSON.stringify({ valid: false, reason: "Key already used on another domain" }), { headers: { "Content-Type": "application/json" } });
    }

    // Default: Not found
    return new Response("Not found", { status: 404 });
  }
}