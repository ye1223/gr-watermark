/// <reference lib="webworker" />

export {};

self.addEventListener("message", () => {
  self.postMessage({ ok: true });
});
