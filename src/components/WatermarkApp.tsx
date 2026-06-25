"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { ConfigPanel } from "@/components/config/ConfigPanel";
import { Header } from "@/components/layout/Header";
import { WatermarkPreview } from "@/components/preview/WatermarkPreview";
import { detectBrandFromCamera, getBrand } from "@/brands.config";
import { getNearestOutputRatio } from "@/hooks/useCrop";
import { normalizeImageFile, parseExif } from "@/hooks/useExif";
import { useWatermark } from "@/hooks/useWatermark";
import { getFramePreset } from "@/presets.config";
import type { ImageSource } from "@/types/watermark";
import { preloadCanvasRenderer, preloadExifParser, scheduleIdleTask } from "@/utils/preload";

const ActionButtons = dynamic(
  () => import("./actions/ActionButtons").then((mod) => mod.ActionButtons),
  { ssr: false }
);

async function getImageSize(url: string) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return { width: image.naturalWidth, height: image.naturalHeight };
}

function getPastedImageFile(event: ClipboardEvent) {
  const files = Array.from(event.clipboardData?.files || []);
  const file = files.find((item) => item.type.startsWith("image/"));
  if (file) return file;

  const items = Array.from(event.clipboardData?.items || []);
  const imageItem = items.find((item) => item.kind === "file" && item.type.startsWith("image/"));
  const pastedFile = imageItem?.getAsFile();
  if (!pastedFile) return null;

  const extension = pastedFile.type.split("/")[1] || "png";
  return new File([pastedFile], `pasted-image.${extension}`, {
    type: pastedFile.type,
    lastModified: Date.now(),
  });
}

export function WatermarkApp() {
  const t = useTranslations("preview");
  const { settings, updateSettings, applyExif, clearExif } = useWatermark();
  const [imageSource, setImageSource] = useState<ImageSource | null>(null);
  const [rendering, setRendering] = useState(false);
  const [brandNotice, setBrandNotice] = useState<string | null>(null);

  useEffect(() => {
    return scheduleIdleTask(() => {
      void preloadCanvasRenderer();
      void preloadExifParser();
    });
  }, []);

  const handleFile = useCallback(async (inputFile: File) => {
    setRendering(true);
    try {
      void preloadCanvasRenderer();
      const exifPromise = parseExif(inputFile);
      const normalized = await normalizeImageFile(inputFile);
      const url = URL.createObjectURL(normalized);
      const [{ width, height }, exif] = await Promise.all([getImageSize(url), exifPromise]);
      const detectedBrand = detectBrandFromCamera(exif.make, exif.model);
      const brand = detectedBrand ?? getBrand("ricoh-gr");
      const preset = getFramePreset(settings.frameStyle);
      const outputRatio = preset.lockRatio && preset.canvasRatio
        ? preset.canvasRatio
        : getNearestOutputRatio(width, height);

      setBrandNotice(detectedBrand ? null : t("brandFallbackHint"));
      updateSettings({ outputRatio, brandId: brand.id });
      applyExif({
        ...exif,
        model: exif.model || brand.defaultModel,
      });

      setImageSource((current) => {
        if (current) {
          URL.revokeObjectURL(current.url);
          URL.revokeObjectURL(current.originalUrl);
        }
        return {
          file: inputFile,
          url,
          originalUrl: url,
          name: normalized.name,
          width,
          height,
        };
      });
    } finally {
      setRendering(false);
    }
  }, [applyExif, settings.frameStyle, t, updateSettings]);

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const file = getPastedImageFile(event);
      if (!file) return;

      event.preventDefault();
      void handleFile(file);
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFile]);

  function clearImage() {
    clearExif();
    setBrandNotice(null);
    setImageSource((current) => {
      if (current) {
        URL.revokeObjectURL(current.url);
        URL.revokeObjectURL(current.originalUrl);
      }
      return null;
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-[1800px] gap-4 p-3 md:grid-cols-[minmax(0,1fr)_380px] md:p-4">
        <div className="relative flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <WatermarkPreview
            imageSource={imageSource}
            rendering={rendering}
            brandNotice={brandNotice}
            settings={settings}
            updateSettings={updateSettings}
            onFile={handleFile}
          />
          <ActionButtons imageSource={imageSource} settings={settings} onClear={clearImage} />
        </div>
        <ConfigPanel settings={settings} updateSettings={updateSettings} />
      </main>
    </div>
  );
}
