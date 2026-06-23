"use client";

import { useState } from "react";
import { ConfigPanel } from "@/components/config/ConfigPanel";
import { Header } from "@/components/layout/Header";
import { WatermarkPreview } from "@/components/preview/WatermarkPreview";
import { getBrand } from "@/brands.config";
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

export function WatermarkApp() {
  const { settings, updateSettings, applyExif, clearExif } = useWatermark();
  const [imageSource, setImageSource] = useState<ImageSource | null>(null);
  const [rendering, setRendering] = useState(false);

  async function handleFile(inputFile: File) {
    setRendering(true);
    try {
      const normalized = await normalizeImageFile(inputFile);
      const url = URL.createObjectURL(normalized);
      const { width, height } = await getImageSize(url);
      const exif = await parseExif(inputFile);
      const brand = getBrand(settings.brandId);

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
  }

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
      <main className="relative md:flex">
        <div className="relative flex min-w-0 flex-1 flex-col">
          <WatermarkPreview
            imageSource={imageSource}
            rendering={rendering}
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
