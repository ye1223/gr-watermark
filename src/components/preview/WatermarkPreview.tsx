"use client";

import "react-image-crop/dist/ReactCrop.css";

import { Crop, ZoomIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { getBrand } from "@/brands.config";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdjustedCrop, ratioToNumber } from "@/hooks/useCrop";
import type { ImageSource, WatermarkSettings } from "@/types/watermark";
import {
  drawCropEditorCanvas,
  drawWatermarkCanvas,
  loadImageElement,
} from "@/utils/canvasRenderer";
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
  const t = useTranslations("config");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const cropStateRef = useRef({ cropX: 0, cropY: 0, cropZoom: 1 });
  const hudTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCropRef = useRef<Partial<WatermarkSettings> | null>(null);
  const cropFrameRef = useRef<number | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    cropX: number;
    cropY: number;
  } | null>(null);
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const [localRendering, setLocalRendering] = useState(false);
  const [cropHudVisible, setCropHudVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      if (!imageSource || !canvasRef.current) return;
      setLocalRendering(true);
      const brand = getBrand(settings.brandId);
      try {
        const image = await loadImageElement(imageSource.url);
        if (cancelled || !canvasRef.current) return;
        if (settings.outputRatio === "ORIGINAL") {
          const logo = await loadImageElement(brand.logo).catch(() => null);
          if (cancelled || !canvasRef.current) return;
          drawWatermarkCanvas({
            canvas: canvasRef.current,
            image,
            settings,
            brand,
            logo,
          });
        } else {
          drawCropEditorCanvas({
            canvas: canvasRef.current,
            image,
            settings,
          });
        }
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
  const clampZoom = (value: number) => Math.max(1, Math.min(3, value));
  const crop = useMemo(
    () =>
      imageSource
        ? getAdjustedCrop(
            imageSource.width,
            imageSource.height,
            settings.outputRatio,
            settings.cropZoom,
            settings.cropX,
            settings.cropY
          )
        : null,
    [
      imageSource,
      settings.cropX,
      settings.cropY,
      settings.cropZoom,
      settings.outputRatio,
    ]
  );
  const cropRatio = imageSource
    ? ratioToNumber(settings.outputRatio, imageSource.width / imageSource.height)
    : 1;
  const previewWidth = Math.round(
    Math.max(72, Math.min(128, cropRatio >= 1 ? 128 : 128 * cropRatio))
  );

  useEffect(() => {
    cropStateRef.current = {
      cropX: settings.cropX,
      cropY: settings.cropY,
      cropZoom: settings.cropZoom,
    };
  }, [settings.cropX, settings.cropY, settings.cropZoom]);

  useEffect(() => {
    setCropHudVisible(false);
  }, [settings.outputRatio, imageSource?.url]);

  useEffect(() => {
    return () => {
      if (cropFrameRef.current !== null) {
        cancelAnimationFrame(cropFrameRef.current);
      }
      if (hudTimeoutRef.current) {
        clearTimeout(hudTimeoutRef.current);
      }
    };
  }, []);

  function syncPointer(event: React.PointerEvent<HTMLCanvasElement>) {
    activePointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
  }

  function distanceBetweenPointers() {
    const points = Array.from(activePointersRef.current.values());
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  }

  function endPointer(pointerId: number) {
    activePointersRef.current.delete(pointerId);
    if (dragRef.current?.pointerId === pointerId) dragRef.current = null;
    if (activePointersRef.current.size < 2) pinchRef.current = null;
  }

  function showCropHud() {
    if (!isCropping) return;
    setCropHudVisible(true);
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => setCropHudVisible(false), 900);
  }

  function scheduleCropUpdate(patch: Partial<WatermarkSettings>) {
    cropStateRef.current = {
      cropX: patch.cropX ?? cropStateRef.current.cropX,
      cropY: patch.cropY ?? cropStateRef.current.cropY,
      cropZoom: patch.cropZoom ?? cropStateRef.current.cropZoom,
    };
    pendingCropRef.current = { ...pendingCropRef.current, ...patch };
    if (cropFrameRef.current !== null) return;

    cropFrameRef.current = requestAnimationFrame(() => {
      cropFrameRef.current = null;
      const next = pendingCropRef.current;
      pendingCropRef.current = null;
      if (next) updateSettings(next);
    });
  }

  function updateCropFromDelta(
    deltaX: number,
    deltaY: number,
    width: number,
    height: number,
    base = dragRef.current
  ) {
    if (!base) return;
    showCropHud();
    scheduleCropUpdate({
      cropX: clampCrop(base.cropX + (deltaX / width) * 200),
      cropY: clampCrop(base.cropY + (deltaY / height) * 200),
    });
  }

  function zoomBy(nextZoom: number) {
    showCropHud();
    scheduleCropUpdate({ cropZoom: clampZoom(nextZoom) });
  }

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
              {isCropping && imageSource && crop && cropHudVisible ? (
                <div
                  className="pointer-events-none absolute right-3 top-3 z-20 border border-[#CC0000] bg-background/95 p-1 shadow-sm backdrop-blur"
                  data-testid="crop-preview-widget"
                  style={{ width: previewWidth }}
                >
                  <div className="mb-1 flex items-center justify-between gap-2 text-[10px] uppercase text-muted-foreground">
                    <span>{t("cropPreview")}</span>
                    <span>{settings.outputRatio}</span>
                  </div>
                  <div
                    className="relative overflow-hidden border border-border bg-muted"
                    style={{ aspectRatio: `${crop.sw} / ${crop.sh}` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- Dynamic local object URLs cannot use next/image optimization. */}
                    <img
                      alt=""
                      className="pointer-events-none absolute max-w-none select-none"
                      draggable={false}
                      src={imageSource.url}
                      style={{
                        height: `${(imageSource.height / crop.sh) * 100}%`,
                        left: `${-(crop.sx / crop.sw) * 100}%`,
                        top: `${-(crop.sy / crop.sh) * 100}%`,
                        width: `${(imageSource.width / crop.sw) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ZoomIn className="size-3" />
                      {Math.round(settings.cropZoom * 100)}%
                    </span>
                  </div>
                </div>
              ) : null}
              <canvas
                ref={canvasRef}
                className={`max-h-[70vh] max-w-full border border-border bg-background object-contain ${
                  isCropping ? "cursor-move touch-none" : ""
                }`}
                tabIndex={isCropping ? 0 : -1}
                onPointerDown={(event) => {
                  if (!isCropping) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  syncPointer(event);
                  if (activePointersRef.current.size >= 2) {
                    pinchRef.current = {
                      distance: distanceBetweenPointers(),
                      zoom: settings.cropZoom,
                    };
                    dragRef.current = null;
                    showCropHud();
                    return;
                  }
                  dragRef.current = {
                    pointerId: event.pointerId,
                    x: event.clientX,
                    y: event.clientY,
                    cropX: settings.cropX,
                    cropY: settings.cropY,
                  };
                }}
                onPointerMove={(event) => {
                  if (!isCropping) return;
                  syncPointer(event);
                  if (activePointersRef.current.size >= 2 && pinchRef.current) {
                    const distance = distanceBetweenPointers();
                    if (distance > 0) {
                      zoomBy(pinchRef.current.zoom * (distance / pinchRef.current.distance));
                    }
                    return;
                  }
                  const drag = dragRef.current;
                  if (!drag || drag.pointerId !== event.pointerId) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  updateCropFromDelta(
                    event.clientX - drag.x,
                    event.clientY - drag.y,
                    rect.width,
                    rect.height
                  );
                }}
                onPointerUp={(event) => {
                  endPointer(event.pointerId);
                }}
                onPointerCancel={(event) => {
                  endPointer(event.pointerId);
                }}
                onWheel={(event) => {
                  if (!isCropping) return;
                  event.preventDefault();
                  event.stopPropagation();
                  zoomBy(cropStateRef.current.cropZoom + (event.deltaY > 0 ? -0.08 : 0.08));
                }}
              />
              {settings.outputRatio !== "ORIGINAL" ? (
                <button
                  className="absolute left-3 top-3 flex items-center gap-1 border border-[#CC0000]/70 bg-background/80 px-2 py-1 text-[11px] uppercase text-[#CC0000] backdrop-blur"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    showCropHud();
                  }}
                >
                  <Crop className="size-3" />
                  {settings.outputRatio}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
