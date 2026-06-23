"use client";

import "react-image-crop/dist/ReactCrop.css";

import { Crop } from "lucide-react";
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
  updateSettings,
}: {
  imageSource: ImageSource | null;
  settings: WatermarkSettings;
  rendering: boolean;
  onFile: (file: File) => void;
  updateSettings: (patch: Partial<WatermarkSettings>) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    cropX: number;
    cropY: number;
  } | null>(null);
  const [localRendering, setLocalRendering] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      if (!imageSource || !canvasRef.current) return;
      setLocalRendering(true);
      const brand = getBrand(settings.brandId);
      try {
        const [image, logo] = await Promise.all([
          loadImageElement(imageSource.url),
          loadImageElement(brand.logo).catch(() => null),
        ]);
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
  const isCropping = Boolean(imageSource && settings.outputRatio !== "ORIGINAL");
  const clampCrop = (value: number) => Math.max(-100, Math.min(100, value));

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
                className={`max-h-[70vh] max-w-full border border-border bg-background object-contain ${
                  isCropping ? "cursor-move touch-none" : ""
                }`}
                onPointerDown={(event) => {
                  if (!isCropping) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  dragRef.current = {
                    pointerId: event.pointerId,
                    x: event.clientX,
                    y: event.clientY,
                    cropX: settings.cropX,
                    cropY: settings.cropY,
                  };
                }}
                onPointerMove={(event) => {
                  const drag = dragRef.current;
                  if (!drag || drag.pointerId !== event.pointerId || !isCropping) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  updateSettings({
                    cropX: clampCrop(drag.cropX + ((event.clientX - drag.x) / rect.width) * 200),
                    cropY: clampCrop(drag.cropY + ((event.clientY - drag.y) / rect.height) * 200),
                  });
                }}
                onPointerUp={(event) => {
                  if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
                }}
                onPointerCancel={() => {
                  dragRef.current = null;
                }}
              />
              {settings.outputRatio !== "ORIGINAL" ? (
                <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1 border border-[#CC0000]/70 bg-background/80 px-2 py-1 text-[11px] uppercase text-[#CC0000] backdrop-blur">
                  <Crop className="size-3" />
                  {settings.outputRatio}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
