"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { getBrand } from "@/brands.config";
import { Skeleton } from "@/components/ui/skeleton";
import type { ImageSource, WatermarkSettings } from "@/types/watermark";
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
  const t = useTranslations("preview");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localRendering, setLocalRendering] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      if (!imageSource || !canvasRef.current) return;
      setLocalRendering(true);
      const brand = getBrand(settings.brandId);
      try {
        const { drawWatermarkCanvas, loadImageElement } = await import("@/utils/canvasRenderer");
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
  const brand = getBrand(settings.brandId);

  return (
    <section className="grid-bg flex min-h-[520px] flex-1 flex-col">
      <div className="flex h-12 items-center justify-between border-b bg-card/90 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted/80">
            <ImageIcon className="size-4 text-muted-foreground" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {imageSource?.name || t("title")}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {settings.outputRatio} / {brand.name}
            </p>
          </div>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 md:p-6">
        {!imageSource ? (
          <UploadZone compact onFile={onFile} />
        ) : (
          <div className="relative mx-auto flex max-h-[calc(100vh-12rem)] w-full items-center justify-center">
            {isBusy ? (
              <Skeleton className="absolute inset-0 z-10 bg-muted/60" />
            ) : null}
            <canvas
              ref={canvasRef}
              className="max-h-[calc(100vh-14rem)] max-w-full bg-background object-contain shadow-sm"
            />
          </div>
        )}
      </div>
    </section>
  );
}
