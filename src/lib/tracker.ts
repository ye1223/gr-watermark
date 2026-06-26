"use client";

export type TrackEventName =
  | "page_view"
  | "upload_success"
  | "download_success"
  | "share_success"
  | "preset_change"
  | "card_mode_change"
  | "brand_change";

type TrackValue = string | number | boolean | null | undefined;
type TrackProps = Record<string, TrackValue>;

const endpoint = process.env.NEXT_PUBLIC_TRACK_ENDPOINT?.trim();
const siteId = process.env.NEXT_PUBLIC_TRACK_SITE_ID?.trim() || "gr-watermark";
const trackedPageViews = new Set<string>();

function getLocale(pathname: string) {
  return pathname.split("/").find((part) => part === "zh" || part === "en");
}

function getDevice() {
  if (typeof window === "undefined") return "unknown";
  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
}

function sanitizeProps(props: TrackProps) {
  return Object.fromEntries(
    Object.entries(props)
      .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.slice(0, 80) : value,
      ])
  );
}

export function trackEvent(event: TrackEventName, props: TrackProps = {}) {
  if (typeof window === "undefined" || !endpoint) return;
  if (navigator.onLine === false) return;

  const payload = {
    site: siteId,
    event,
    timestamp: new Date().toISOString(),
    path: window.location.pathname,
    locale: getLocale(window.location.pathname) || navigator.language,
    device: getDevice(),
    props: sanitizeProps(props),
  };

  try {
    const body = JSON.stringify(payload);
    const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });

    if (navigator.sendBeacon?.(endpoint, blob)) return;

    void fetch(endpoint, {
      method: "POST",
      body,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      keepalive: true,
      mode: "cors",
    }).catch(() => {});
  } catch {
    // Analytics should never affect the editor.
  }
}

export function trackPageViewOnce() {
  if (typeof window === "undefined") return;

  const key = window.location.pathname;
  if (trackedPageViews.has(key)) return;
  trackedPageViews.add(key);
  trackEvent("page_view");
}
