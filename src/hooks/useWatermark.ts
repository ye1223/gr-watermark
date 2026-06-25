"use client";

import { useEffect, useMemo, useState } from "react";
import { getFramePreset } from "@/presets.config";
import {
  frameStyles,
  logoColorModes,
  logoPlacements,
  outputRatios,
  type FrameStyle,
  type LogoColorMode,
  type LogoPlacement,
  type OutputRatio,
  type ParsedExif,
  type WatermarkMode,
  watermarkModes,
  type WatermarkSettings,
} from "@/types/watermark";

const storageKey = "gr-watermark-settings";

export const defaultSettings: WatermarkSettings = {
  frameStyle: "CLASSIC",
  outputRatio: "3:2",
  borderScale: 1,
  frameBorderScale: { top: 1, side: 1, bottom: 1 },
  watermark: true,
  watermarkMode: "metadata",
  filmWatermark: false,
  cardMode: false,
  cropOffset: { x: 0.5, y: 0.5 },
  logoPlacement: "photo-bottom-right",
  logoScale: 1,
  logoInset: 0.03,
  logoColorMode: "brand",
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

function isFrameStyle(value: unknown): value is FrameStyle {
  return typeof value === "string" && frameStyles.includes(value as FrameStyle);
}

function normalizeFrameStyle(value: unknown): FrameStyle {
  if (isFrameStyle(value)) return value;
  if (value === "FRAME_S" || value === "FRAME_M" || value === "FRAME_L") return "FRAME";
  if (value === "INSTAX") return "INSTAX_SQUARE";

  return defaultSettings.frameStyle;
}

function normalizeOutputRatio(value: unknown): OutputRatio {
  if (isOutputRatio(value)) return value;

  const legacyRatioMap: Record<string, OutputRatio> = {
    ORIGINAL: "3:2",
    CLASSIC_LANDSCAPE: "3:2",
    CLASSIC_PORTRAIT: "2:3",
    SQUARE: "1:1",
    SOCIAL_PORTRAIT: "4:5",
    CINEMA_WIDE: "16:9",
    STORY_VERTICAL: "9:16",
    INSTAX_MINI: "2:3",
    INSTAX_SQUARE: "1:1",
    INSTAX_WIDE: "5:4",
  };

  return typeof value === "string"
    ? legacyRatioMap[value] ?? defaultSettings.outputRatio
    : defaultSettings.outputRatio;
}

function normalizeStoredSettings(stored: unknown): WatermarkSettings {
  if (!stored || typeof stored !== "object") return defaultSettings;
  const saved = stored as Partial<WatermarkSettings> & {
    frameStyle?: unknown;
    outputRatio?: unknown;
    borderScale?: unknown;
    frameBorderScale?: unknown;
    cropOffset?: unknown;
    watermarkMode?: unknown;
    logoPlacement?: unknown;
    logoScale?: unknown;
    logoInset?: unknown;
    logoColorMode?: unknown;
  };

  return settingKeys.reduce(
    (next, key) => ({
      ...next,
      [key]:
        key === "outputRatio"
          ? normalizeOutputRatio(saved.outputRatio)
          : key === "frameStyle"
            ? normalizeFrameStyle(saved.frameStyle)
          : key === "borderScale"
            ? normalizeBorderScale(saved.borderScale)
          : key === "frameBorderScale"
            ? normalizeFrameBorderScale(saved.frameBorderScale)
          : key === "cropOffset"
            ? normalizeCropOffset(saved.cropOffset)
          : key === "watermarkMode"
            ? normalizeWatermarkMode(saved.watermarkMode)
          : key === "logoPlacement"
            ? normalizeLogoPlacement(saved.logoPlacement)
          : key === "logoScale"
            ? normalizeLogoScale(saved.logoScale)
          : key === "logoInset"
            ? normalizeLogoInset(saved.logoInset)
          : key === "logoColorMode"
            ? normalizeLogoColorMode(saved.logoColorMode)
          : saved[key] ?? defaultSettings[key],
    }),
    { ...defaultSettings }
  );
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalizeBorderScale(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(value, 0.6, 1.6)
    : defaultSettings.borderScale;
}

function normalizeFrameBorderScale(value: unknown): WatermarkSettings["frameBorderScale"] {
  if (!value || typeof value !== "object") return defaultSettings.frameBorderScale;
  const borderScale = value as Partial<WatermarkSettings["frameBorderScale"]>;

  return {
    top: typeof borderScale.top === "number" ? clamp(borderScale.top, 0.4, 2) : defaultSettings.frameBorderScale.top,
    side: typeof borderScale.side === "number" ? clamp(borderScale.side, 0.4, 2) : defaultSettings.frameBorderScale.side,
    bottom: typeof borderScale.bottom === "number" ? clamp(borderScale.bottom, 0.4, 2) : defaultSettings.frameBorderScale.bottom,
  };
}

function normalizeCropOffset(value: unknown): WatermarkSettings["cropOffset"] {
  if (!value || typeof value !== "object") return defaultSettings.cropOffset;
  const cropOffset = value as Partial<WatermarkSettings["cropOffset"]>;

  return {
    x: typeof cropOffset.x === "number" ? clamp(cropOffset.x) : defaultSettings.cropOffset.x,
    y: typeof cropOffset.y === "number" ? clamp(cropOffset.y) : defaultSettings.cropOffset.y,
  };
}

function normalizeWatermarkMode(value: unknown): WatermarkMode {
  return typeof value === "string" && watermarkModes.includes(value as WatermarkMode)
    ? value as WatermarkMode
    : defaultSettings.watermarkMode;
}

function normalizeLogoPlacement(value: unknown): LogoPlacement {
  return typeof value === "string" && logoPlacements.includes(value as LogoPlacement)
    ? value as LogoPlacement
    : defaultSettings.logoPlacement;
}

function normalizeLogoScale(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(value, 0.6, 1.6)
    : defaultSettings.logoScale;
}

function normalizeLogoInset(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(value, 0.01, 0.08)
    : defaultSettings.logoInset;
}

function normalizeLogoColorMode(value: unknown): LogoColorMode {
  return typeof value === "string" && logoColorModes.includes(value as LogoColorMode)
    ? value as LogoColorMode
    : defaultSettings.logoColorMode;
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
        setSettings((current) => {
          const next = { ...current, ...patch };
          const presetChanged = patch.frameStyle !== undefined && patch.frameStyle !== current.frameStyle;
          const ratioChanged = patch.outputRatio !== undefined && patch.outputRatio !== current.outputRatio;

          if (presetChanged || ratioChanged) {
            next.cropOffset = defaultSettings.cropOffset;
          }

          if (presetChanged) {
            next.borderScale = defaultSettings.borderScale;
            next.frameBorderScale = defaultSettings.frameBorderScale;
          }

          if (patch.frameStyle) {
            const preset = getFramePreset(patch.frameStyle);
            if (preset.lockRatio && preset.canvasRatio) {
              next.outputRatio = preset.canvasRatio;
            }
          }

          return next;
        }),
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
      resetSettings: () => setSettings(defaultSettings),
    }),
    [settings]
  );
}
