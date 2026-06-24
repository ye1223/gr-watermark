let canvasRendererPromise: Promise<typeof import("@/utils/canvasRenderer")> | null = null;
let exifrPromise: Promise<typeof import("exifr")> | null = null;

export function preloadCanvasRenderer() {
  canvasRendererPromise ??= import("@/utils/canvasRenderer");
  return canvasRendererPromise;
}

export function preloadExifParser() {
  exifrPromise ??= import("exifr");
  return exifrPromise;
}

export function scheduleIdleTask(task: () => void, timeout = 1600) {
  if (typeof window === "undefined") return () => {};

  if ("requestIdleCallback" in window) {
    const handle = window.requestIdleCallback(task, { timeout });
    return () => window.cancelIdleCallback(handle);
  }

  const handle = globalThis.setTimeout(task, timeout);
  return () => globalThis.clearTimeout(handle);
}
