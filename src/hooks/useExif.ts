"use client";

import * as exifr from "exifr";
import type { ParsedExif } from "@/types/watermark";

function formatNumber(value: unknown, digits = 1) {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  const rounded = Number(value.toFixed(digits));
  return `${rounded}`;
}

function formatExposure(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  if (value >= 1) return `${Number(value.toFixed(1))}s`;
  const denominator = Math.round(1 / value);
  return `1/${denominator}`;
}

function formatDate(value: unknown) {
  if (!value) return undefined;
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, "0");
    const day = `${value.getDate()}`.padStart(2, "0");
    return `${year}.${month}.${day}`;
  }
  if (typeof value === "string") {
    const match = value.match(/^(\d{4})[:.-](\d{2})[:.-](\d{2})/);
    if (match) return `${match[1]}.${match[2]}.${match[3]}`;
  }
  return undefined;
}

export async function parseExif(file: File): Promise<ParsedExif> {
  try {
    const data = await exifr.parse(file, {
      pick: [
        "Model",
        "FocalLength",
        "FNumber",
        "ExposureTime",
        "ISOSpeedRatings",
        "ISO",
        "DateTimeOriginal",
      ],
    });

    return {
      model: data?.Model,
      focalLength: formatNumber(data?.FocalLength, 0)
        ? `${formatNumber(data?.FocalLength, 0)}mm`
        : undefined,
      aperture: formatNumber(data?.FNumber, 1)
        ? `f/${formatNumber(data?.FNumber, 1)}`
        : undefined,
      shutter: formatExposure(data?.ExposureTime),
      iso: data?.ISOSpeedRatings || data?.ISO ? `${data?.ISOSpeedRatings || data?.ISO}` : undefined,
      date: formatDate(data?.DateTimeOriginal),
    };
  } catch {
    return {};
  }
}

export async function normalizeImageFile(file: File): Promise<File> {
  const isHeic =
    file.type.includes("heic") ||
    file.type.includes("heif") ||
    /\.(heic|heif)$/i.test(file.name);

  if (!isHeic) return file;

  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.95,
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;

  return new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
    type: "image/jpeg",
  });
}
