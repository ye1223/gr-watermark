"use client";

import { useEffect, useMemo, useState } from "react";
import { outputRatios, type OutputRatio, type ParsedExif, type WatermarkSettings } from "@/types/watermark";

const storageKey = "gr-watermark-settings";

export const defaultSettings: WatermarkSettings = {
  frameStyle: "CLASSIC",
  outputRatio: "CLASSIC_LANDSCAPE",
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
};

export const emptyExifSettings = {
  model: "",
  focalLength: "",
  aperture: "",
  shutter: "",
  iso: "",
  date: "",
};

const settingKeys = Object.keys(defaultSettings) as Array<keyof WatermarkSettings>;

function isOutputRatio(value: unknown): value is OutputRatio {
  return typeof value === "string" && outputRatios.includes(value as OutputRatio);
}

function normalizeOutputRatio(value: unknown): OutputRatio {
  if (isOutputRatio(value)) return value;

  const legacyRatioMap: Record<string, OutputRatio> = {
    ORIGINAL: "CLASSIC_LANDSCAPE",
    "3:2": "CLASSIC_LANDSCAPE",
    "2:3": "CLASSIC_PORTRAIT",
    "1:1": "SQUARE",
    "4:5": "SOCIAL_PORTRAIT",
    "16:9": "CINEMA_WIDE",
    "9:16": "STORY_VERTICAL",
    INSTAX_MINI: "INSTAX_MINI",
    INSTAX_SQUARE: "INSTAX_SQUARE",
    INSTAX_WIDE: "INSTAX_WIDE",
  };

  return typeof value === "string"
    ? legacyRatioMap[value] ?? defaultSettings.outputRatio
    : defaultSettings.outputRatio;
}

function normalizeStoredSettings(stored: unknown): WatermarkSettings {
  if (!stored || typeof stored !== "object") return defaultSettings;
  const saved = stored as Partial<WatermarkSettings> & { outputRatio?: unknown };

  return settingKeys.reduce(
    (next, key) => ({
      ...next,
      [key]:
        key === "outputRatio"
          ? normalizeOutputRatio(saved.outputRatio)
          : saved[key] ?? defaultSettings[key],
    }),
    { ...defaultSettings }
  );
}

export function useWatermark() {
  const [settings, setSettings] = useState<WatermarkSettings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        setSettings(normalizeStoredSettings(JSON.parse(stored)));
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
