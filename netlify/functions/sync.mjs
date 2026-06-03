// Netlify Function: stores the wedding planner data in Netlify Blobs,
// keyed by the sync code. Same-origin as your site, so there are no CORS issues.
// Served automatically at:  /.netlify/functions/sync
import { getStore } from "@netlify/blobs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers: CORS });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response(JSON.stringify({ error: "missing code" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const store = getStore("wedding-planner");

  try {
    if (req.method === "GET") {
      const value = await store.get(code, { type: "text", consistency: "strong" });
      if (value == null) {
        return new Response(JSON.stringify({ error: "not found" }), {
          status: 404,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
      return new Response(value, {
        status: 200,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const body = await req.text();
      await store.set(code, body || "{}");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response("method not allowed", { status: 405, headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message || err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
};
