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

    const withTimeout = async (fn: (signal: AbortSignal) => Promise<Response>, ms = 8000) => {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), ms);
      try {
        const res = await fn(controller.signal);
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

    const extractDoi = (input: string): string | null => {
      const m = input.match(/10\.\d{4,9}\/[\w.;()/:<>#\-_%+~]+/i);
      return m ? m[0] : null;
    };

    const doi = extractDoi(url);
    const doiUrl = doi ? `https://doi.org/${doi}` : null;

    // 1) Try HEAD (follow redirects)
    try {
      const headResp = await withTimeout((signal) => fetch(url, { method: "HEAD", redirect: "follow", signal }));
      const headOk = acceptable(headResp.status);
      if (headOk) {
        return new Response(JSON.stringify({ ok: true, status: headResp.status, finalUrl: doiUrl ?? headResp.url }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (_) { /* fall through */ }

    // 2) Try GET (follow redirects)
    try {
      const getResp = await withTimeout((signal) => fetch(url, { method: "GET", redirect: "follow", signal }));
      const status = getResp.status;
      if (acceptable(status)) {
        return new Response(JSON.stringify({ ok: true, status, finalUrl: doiUrl ?? getResp.url }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (_) { /* fall through */ }

    // 3) DOI fallback: convert any detected DOI to doi.org
    try {
      if (doiUrl) {
        const doiHead = await withTimeout((signal) => fetch(doiUrl, { method: "HEAD", redirect: "follow", signal }));
        if (acceptable(doiHead.status)) {
          return new Response(JSON.stringify({ ok: true, status: doiHead.status, finalUrl: doiHead.url || doiUrl }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const doiGet = await withTimeout((signal) => fetch(doiUrl, { method: "GET", redirect: "follow", signal }));
        if (acceptable(doiGet.status)) {
          return new Response(JSON.stringify({ ok: true, status: doiGet.status, finalUrl: doiGet.url || doiUrl }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } catch (_) { /* ignore */ }

    return new Response(JSON.stringify({ ok: false, status: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("check-url error", error);
    return new Response(JSON.stringify({ ok: false, error: "Bad request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});