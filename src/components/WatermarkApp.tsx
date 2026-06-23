"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfigPanel } from "@/components/config/ConfigPanel";
import { Header } from "@/components/layout/Header";
import { WatermarkPreview } from "@/components/preview/WatermarkPreview";
import { getBrand } from "@/brands.config";
import { getNearestOutputRatio } from "@/hooks/useCrop";
import { normalizeImageFile, parseExif } from "@/hooks/useExif";
import { useWatermark } from "@/hooks/useWatermark";
import type { ImageSource } from "@/types/watermark";
import { ActionButtons } from "./actions/ActionButtons";

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
  const { settings, updateSettings, applyExif, clearExif } = useWatermark();
  const [imageSource, setImageSource] = useState<ImageSource | null>(null);
  const [rendering, setRendering] = useState(false);

  const handleFile = useCallback(async (inputFile: File) => {
    setRendering(true);
    try {
      const normalized = await normalizeImageFile(inputFile);
      const url = URL.createObjectURL(normalized);
      const { width, height } = await getImageSize(url);
      const exif = await parseExif(inputFile);
      const brand = getBrand(settings.brandId);

      updateSettings({ outputRatio: getNearestOutputRatio(width, height) });
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
  }, [applyExif, settings.brandId, updateSettings]);

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
            settings={settings}
            onFile={handleFile}
          />
          <ActionButtons imageSource={imageSource} settings={settings} onClear={clearImage} />
        </div>
        <ConfigPanel settings={settings} updateSettings={updateSettings} />
      </main>
    </div>
  );
}
