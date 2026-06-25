"use client";

import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { getBrand } from "@/brands.config";
import { Skeleton } from "@/components/ui/skeleton";
import { getCrop, ratioToNumber } from "@/hooks/useCrop";
import { cn } from "@/lib/utils";
import { getFramePreset } from "@/presets.config";
import type { ImageSource, OutputRatio, WatermarkSettings } from "@/types/watermark";
import { preloadCanvasRenderer } from "@/utils/preload";
import { UploadZone } from "../upload/UploadZone";

const cropHintStorageKey = "gr-watermark-crop-hint-read";

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function getEffectiveRatio(settings: WatermarkSettings): OutputRatio {
  const preset = getFramePreset(settings.frameStyle);
  return preset.lockRatio && preset.canvasRatio ? preset.canvasRatio : settings.outputRatio;
}

function getBorderFractions(settings: WatermarkSettings) {
  const preset = getFramePreset(settings.frameStyle);
  if (!settings.watermark) return { top: 0, right: 0, bottom: 0, left: 0 };

  const scale = preset.lockRatio || preset.group === "frame" ? 1 : settings.borderScale;
  const frameScale = settings.frameBorderScale;

  return {
    top: clamp(preset.border.top * scale * (preset.group === "frame" ? frameScale.top : 1), 0, 0.35),
    right: clamp(preset.border.right * scale * (preset.group === "frame" ? frameScale.side : 1), 0, 0.35),
    bottom: clamp(preset.border.bottom * scale * (preset.group === "frame" ? frameScale.bottom : 1), 0, 0.4),
    left: clamp(preset.border.left * scale * (preset.group === "frame" ? frameScale.side : 1), 0, 0.35),
  };
}

function getPreviewCropGeometry(settings: WatermarkSettings, imageWidth: number, imageHeight: number) {
  const effectiveRatio = getEffectiveRatio(settings);
  const border = getBorderFractions(settings);
  const widthFraction = Math.max(0.2, 1 - border.left - border.right);
  const heightFraction = Math.max(0.2, 1 - border.top - border.bottom);
  const canvasRatio = ratioToNumber(effectiveRatio, imageWidth / imageHeight);
  const imageAreaRatio = canvasRatio * (widthFraction / heightFraction);
  const crop = getCrop(imageWidth, imageHeight, `${imageAreaRatio}:1` as OutputRatio, settings.cropOffset);

  return { crop, widthFraction, heightFraction };
}

export function WatermarkPreview({
  imageSource,
  settings,
  updateSettings,
  rendering,
  brandNotice,
  onFile,
}: {
  imageSource: ImageSource | null;
  settings: WatermarkSettings;
  updateSettings: (patch: Partial<WatermarkSettings>) => void;
  rendering: boolean;
  brandNotice?: string | null;
  onFile: (file: File) => void;
}) {
  const t = useTranslations("preview");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Awaited<ReturnType<typeof preloadCanvasRenderer>> | null>(null);
  const imageCacheRef = useRef<{ url: string; image: HTMLImageElement } | null>(null);
  const logoCacheRef = useRef<{ url: string; image: HTMLImageElement | null } | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startOffset: WatermarkSettings["cropOffset"];
  } | null>(null);
  const [localRendering, setLocalRendering] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showCropHint, setShowCropHint] = useState(false);
  const effectiveRatio = useMemo(() => getEffectiveRatio(settings), [settings]);
  const cropActive = Boolean(imageSource && effectiveRatio !== "ORIGINAL");

  useEffect(() => {
    let cancelled = false;
    async function render() {
      if (!imageSource || !canvasRef.current) return;
      setLocalRendering(true);
      const brand = getBrand(settings.brandId);
      try {
        const renderer = rendererRef.current ?? await preloadCanvasRenderer();
        rendererRef.current = renderer;
        const image =
          imageCacheRef.current?.url === imageSource.url
            ? imageCacheRef.current.image
            : await renderer.loadImageElement(imageSource.url);
        if (cancelled || !canvasRef.current) return;
        imageCacheRef.current = { url: imageSource.url, image };
        const logo =
          logoCacheRef.current?.url === brand.logo
            ? logoCacheRef.current.image
            : await renderer.loadImageElement(brand.logo).catch(() => null);
        if (cancelled || !canvasRef.current) return;
        logoCacheRef.current = { url: brand.logo, image: logo };
        renderer.drawWatermarkCanvas({
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

    const timer = setTimeout(render, cropActive ? 16 : 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cropActive, imageSource, settings]);

  useEffect(() => {
    if (!cropActive || !imageSource) return;
    if (window.localStorage.getItem(cropHintStorageKey)) return;

    setShowCropHint(true);
    const timer = window.setTimeout(() => {
      setShowCropHint(false);
      window.localStorage.setItem(cropHintStorageKey, "1");
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [cropActive, imageSource]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!cropActive || !imageSource) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: settings.cropOffset,
    };
    setDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !canvasRef.current || !imageSource) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const geometry = getPreviewCropGeometry(settings, imageSource.width, imageSource.height);
    const overflowX = imageSource.width - geometry.crop.sw;
    const overflowY = imageSource.height - geometry.crop.sh;
    const drawWidthCss = rect.width * geometry.widthFraction;
    const drawHeightCss = rect.height * geometry.heightFraction;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    const next = { ...dragRef.current.startOffset };

    if (overflowX > 1 && drawWidthCss > 0) {
      const sourceDx = dx * (geometry.crop.sw / drawWidthCss);
      next.x = clamp(dragRef.current.startOffset.x - sourceDx / overflowX);
    }

    if (overflowY > 1 && drawHeightCss > 0) {
      const sourceDy = dy * (geometry.crop.sh / drawHeightCss);
      next.y = clamp(dragRef.current.startOffset.y - sourceDy / overflowY);
    }

    updateSettings({ cropOffset: next });
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setDragging(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

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
        {brandNotice ? (
          <div className="pointer-events-none absolute right-4 top-4 z-20 max-w-[min(22rem,calc(100%-2rem))] rounded-lg border bg-card/95 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
            {brandNotice}
          </div>
        ) : null}
        {!imageSource ? (
          <UploadZone compact onFile={onFile} onPrepare={preloadCanvasRenderer} />
        ) : (
          <div
            className={cn(
              "relative mx-auto flex max-h-[calc(100vh-12rem)] w-full touch-none items-center justify-center",
              cropActive && (dragging ? "cursor-grabbing" : "cursor-grab")
            )}
            onPointerCancel={handlePointerEnd}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
          >
            {isBusy ? (
              <Skeleton className="absolute inset-0 z-10 bg-muted/60" />
            ) : null}
            {showCropHint ? (
              <div className="pointer-events-none absolute top-3 z-20 rounded-full bg-foreground/90 px-3 py-1.5 text-xs font-medium text-background shadow-sm">
                {t("cropHint")}
              </div>
            ) : null}
            <canvas
              ref={canvasRef}
              className="max-h-[calc(100vh-14rem)] max-w-full select-none bg-background object-contain shadow-sm"
            />
          </div>
        )}
      </div>
    </section>
  );
}
