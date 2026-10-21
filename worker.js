// Cloudflare Worker: graveyard backend. Needs a KV binding named GRAVE.
export default {
  async fetch(req, env) {
    const h = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };
    const out = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: h });
    if (req.method === "OPTIONS") return new Response(null, { headers: h });
    const posts = JSON.parse((await env.GRAVE.get("posts")) || "[]");
    if (req.method === "GET") return out(posts);
    if (req.method !== "POST") return out({ error: "method" }, 405);
    let b;
    try { b = await req.json(); } catch { return out({ error: "bad json" }, 400); }
    const device = String(b.device || "");
    if (!/^[a-f0-9-]{20,40}$/i.test(device)) return out({ error: "bad device" }, 400);
    const msg = String(b.msg || "").trim().slice(0, 120);
    if (!msg) return out({ error: "empty" }, 400);
    const name = String(b.name || "").trim().slice(0, 20) || "Unknown Player";
    if (await env.GRAVE.get("d:" + device)) return out({ error: "already" }, 409);
    posts.unshift({ name, msg, ts: Date.now() });
    await env.GRAVE.put("posts", JSON.stringify(posts.slice(0, 200)));
    await env.GRAVE.put("d:" + device, "1");
    return out({ ok: true });
  }
};
