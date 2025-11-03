import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "Invalid url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isHttp = (() => {
      try {
        const u = new URL(url);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    })();

    if (!isHttp) {
      return new Response(JSON.stringify({ ok: false, error: "URL must be http(s)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const withTimeout = async (fn: () => Promise<Response>, ms = 8000) => {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), ms);
      try {
        const res = await fn();
        clearTimeout(t);
        return res;
      } catch (e) {
        clearTimeout(t);
        throw e;
      }
    };

    const acceptable = (status: number) => {
      // Consider 2xx/3xx reachable; also 401/403/405 often block HEAD but exist
      return (status >= 200 && status < 400) || status === 401 || status === 403 || status === 405;
    };

    let headStatus = 0;
    try {
      const headResp = await withTimeout(() => fetch(url, { method: "HEAD", redirect: "follow" }));
      headStatus = headResp.status;
      if (acceptable(headStatus)) {
        return new Response(JSON.stringify({ ok: true, status: headStatus }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (_) {
      // ignore and try GET
    }

    try {
      const getResp = await withTimeout(() => fetch(url, { method: "GET", redirect: "follow" }));
      const status = getResp.status;
      return new Response(JSON.stringify({ ok: acceptable(status), status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "fetch failed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("check-url error", error);
    return new Response(JSON.stringify({ ok: false, error: "Bad request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});