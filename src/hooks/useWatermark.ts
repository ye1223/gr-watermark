"use client";

import { useEffect, useMemo, useState } from "react";
import type { ParsedExif, WatermarkSettings } from "@/types/watermark";

const storageKey = "gr-watermark-settings";

export const defaultSettings: WatermarkSettings = {
  frameStyle: "CLASSIC",
  outputRatio: "ORIGINAL",
  watermark: true,
  brandId: "ricoh-gr",
  borderTone: "white",
  showModel: true,
  model: "GR III",
  showExif: true,
  focalLength: "40mm",
  aperture: "f/2.8",
  shutter: "1/125",
  iso: "100",
  showDate: true,
  date: "2026.01.01",
  showSubtitle: false,
  subtitle: "",
  cropZoom: 1,
  cropX: 0,
  cropY: 0,
};

export const emptyExifSettings = {
  model: "",
  focalLength: "",
  aperture: "",
  shutter: "",
  iso: "",
  date: "",
  cropZoom: 1,
  cropX: 0,
  cropY: 0,
};

export function useWatermark() {
  const [settings, setSettings] = useState<WatermarkSettings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(storageKey, JSON.stringify(settings));
    }
  }, [hydrated, settings]);

  return useMemo(
    () => ({
      settings,
      setSettings,
      updateSettings: (patch: Partial<WatermarkSettings>) =>
        setSettings((current) => ({ ...current, ...patch })),
      applyExif: (exif: ParsedExif) =>
        setSettings((current) => ({
          ...current,
          model: exif.model || current.model,
          focalLength: exif.focalLength || current.focalLength,
          aperture: exif.aperture || current.aperture,
          shutter: exif.shutter || current.shutter,
          iso: exif.iso || current.iso,
          date: exif.date || current.date,
          cropZoom: 1,
          cropX: 0,
          cropY: 0,
        })),
      clearExif: () =>
        setSettings((current) => ({
          ...current,
          ...emptyExifSettings,
        })),
    }),
    [settings]
  );
}
