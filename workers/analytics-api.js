const allowedEvents = new Set([
  "page_view",
  "upload_success",
  "download_success",
  "share_success",
  "preset_change",
  "card_mode_change",
  "brand_change",
]);

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const allowOrigin = allowedOrigins.length === 0 || allowedOrigins.includes(origin)
    ? origin || "*"
    : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function text(value, maxLength) {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function cleanProps(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => ["string", "number", "boolean"].includes(typeof item))
      .map(([key, item]) => [key.slice(0, 40), typeof item === "string" ? item.slice(0, 80) : item])
  );
}

const analyticsApi = {
  async fetch(request, env) {
    const headers = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/collect" && url.pathname !== "/gr-watermark-analytics/collect") {
      return new Response("Not found", { status: 404, headers });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers });
    }

    try {
      const raw = await request.text();
      if (raw.length > 4096) {
        return Response.json({ ok: false }, { status: 413, headers });
      }

      const body = JSON.parse(raw);
      const event = text(body.event, 40);
      if (!allowedEvents.has(event)) {
        return Response.json({ ok: false }, { status: 400, headers });
      }

      const row = {
        id: crypto.randomUUID(),
        site: text(body.site, 80) || "gr-watermark",
        event,
        timestamp: text(body.timestamp, 40) || new Date().toISOString(),
        path: text(body.path, 160),
        locale: text(body.locale, 40),
        device: text(body.device, 20),
        country: request.cf?.country || "",
        props: JSON.stringify(cleanProps(body.props)),
      };

      if (env.DB) {
        await env.DB.prepare(
          `INSERT INTO analytics_events
            (id, site, event, timestamp, path, locale, device, country, props)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            row.id,
            row.site,
            row.event,
            row.timestamp,
            row.path,
            row.locale,
            row.device,
            row.country,
            row.props
          )
          .run();
      } else {
        console.log(row);
      }

      return Response.json({ ok: true }, { headers });
    } catch {
      return Response.json({ ok: false }, { status: 400, headers });
    }
  },
};

export default analyticsApi;
