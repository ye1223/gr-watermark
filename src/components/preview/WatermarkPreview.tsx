"use client";

import { useEffect, useRef, useState } from "react";
import { getBrand } from "@/brands.config";
import { Skeleton } from "@/components/ui/skeleton";
import type { ImageSource, WatermarkSettings } from "@/types/watermark";
import { drawWatermarkCanvas, loadImageElement } from "@/utils/canvasRenderer";
import { UploadZone } from "../upload/UploadZone";

export function WatermarkPreview({
  imageSource,
  settings,
  rendering,
  onFile,
}: {
  imageSource: ImageSource | null;
  settings: WatermarkSettings;
  rendering: boolean;
  onFile: (file: File) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localRendering, setLocalRendering] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      if (!imageSource || !canvasRef.current) return;
      setLocalRendering(true);
      const brand = getBrand(settings.brandId);
      try {
        const image = await loadImageElement(imageSource.url);
        if (cancelled || !canvasRef.current) return;
        const logo = await loadImageElement(brand.logo).catch(() => null);
        if (cancelled || !canvasRef.current) return;
        drawWatermarkCanvas({
          canvas: canvasRef.current,
          image,
          settings,
          brand,
          logo,
        });
      } finally {
        if (!cancelled) setLocalRendering(false);
      }
    }

    const timer = setTimeout(render, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [imageSource, settings]);

  const isBusy = rendering || localRendering;

  return (
    <section className="grid-bg flex min-h-[calc(100vh-3.5rem)] flex-1 items-center justify-center p-4 md:p-8">
      <div className="relative flex w-full max-w-5xl items-center justify-center">
        {!imageSource ? (
          <UploadZone onFile={onFile} />
        ) : (
          <div className="w-full">
            <div className="relative mx-auto flex max-h-[70vh] max-w-full items-center justify-center">
              {isBusy ? (
                <Skeleton className="absolute inset-0 z-10 rounded bg-muted/70" />
              ) : null}
              <canvas
                ref={canvasRef}
                className="max-h-[70vh] max-w-full border border-border bg-background object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
