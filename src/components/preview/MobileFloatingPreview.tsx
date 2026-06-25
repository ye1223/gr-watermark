"use client";

import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { getBrand } from "@/brands.config";
import { cn } from "@/lib/utils";
import type { ImageSource, WatermarkSettings } from "@/types/watermark";
import { preloadCanvasRenderer } from "@/utils/preload";

const positionStorageKey = "gr-watermark-mobile-preview-position";
const sizeStorageKey = "gr-watermark-mobile-preview-width";
const defaultPreviewWidth = 112;
const previewAspectRatio = 8 / 7;
const minPreviewWidth = 88;
const maxPreviewWidth = 184;
const margin = 12;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getPreviewHeight(width: number) {
  return Math.round(width * previewAspectRatio);
}

function clampPreviewWidth(width: number) {
  const maxByViewport = Math.min(
    maxPreviewWidth,
    window.innerWidth - margin * 2,
    (window.innerHeight - margin * 2) / previewAspectRatio
  );

  return clamp(width, minPreviewWidth, Math.max(minPreviewWidth, maxByViewport));
}

function getDefaultPosition(width: number) {
  return {
    x: window.innerWidth - width - margin,
    y: window.innerHeight - getPreviewHeight(width) - 64,
  };
}

function clampPosition(position: { x: number; y: number }, width: number) {
  const height = getPreviewHeight(width);

  return {
    x: clamp(position.x, margin, Math.max(margin, window.innerWidth - width - margin)),
    y: clamp(position.y, margin, Math.max(margin, window.innerHeight - height - margin)),
  };
}

export function MobileFloatingPreview({
  imageSource,
  settings,
  visible,
  onInteractionChange,
  onOpenPreview,
}: {
  imageSource: ImageSource | null;
  settings: WatermarkSettings;
  visible: boolean;
  onInteractionChange: (interacting: boolean) => void;
  onOpenPreview: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Awaited<ReturnType<typeof preloadCanvasRenderer>> | null>(null);
  const imageCacheRef = useRef<{ url: string; image: HTMLImageElement } | null>(null);
  const logoCacheRef = useRef<{ url: string; image: HTMLImageElement | null } | null>(null);
  const renderTokenRef = useRef(0);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const resizeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originWidth: number;
    originX: number;
    originY: number;
  } | null>(null);
  const latestPositionRef = useRef<{ x: number; y: number } | null>(null);
  const latestWidthRef = useRef(defaultPreviewWidth);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [previewWidth, setPreviewWidth] = useState(defaultPreviewWidth);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  useEffect(
    () => () => {
      onInteractionChange(false);
    },
    [onInteractionChange]
  );

  const setSafePosition = useCallback((next: { x: number; y: number }) => {
    const clamped = clampPosition(next, latestWidthRef.current);
    latestPositionRef.current = clamped;
    setPosition(clamped);
    window.localStorage.setItem(positionStorageKey, JSON.stringify(clamped));
  }, []);

  const setSafeWidth = useCallback((nextWidth: number, nextPosition?: { x: number; y: number }) => {
    const width = clampPreviewWidth(nextWidth);
    const clampedPosition = clampPosition(nextPosition ?? latestPositionRef.current ?? getDefaultPosition(width), width);

    latestWidthRef.current = width;
    latestPositionRef.current = clampedPosition;
    setPreviewWidth(width);
    setPosition(clampedPosition);
    window.localStorage.setItem(sizeStorageKey, JSON.stringify(width));
    window.localStorage.setItem(positionStorageKey, JSON.stringify(clampedPosition));
  }, []);

  useEffect(() => {
    let initialWidth = defaultPreviewWidth;
    try {
      const storedWidth = window.localStorage.getItem(sizeStorageKey);
      if (storedWidth) {
        const parsedWidth = JSON.parse(storedWidth) as unknown;
        if (typeof parsedWidth === "number") {
          initialWidth = parsedWidth;
        }
      }
    } catch {
      initialWidth = defaultPreviewWidth;
    }

    const clampedWidth = clampPreviewWidth(initialWidth);
    let initialPosition = getDefaultPosition(clampedWidth);

    try {
      const stored = window.localStorage.getItem(positionStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<{ x: number; y: number }>;
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          initialPosition = { x: parsed.x, y: parsed.y };
        }
      }
    } catch {
      initialPosition = getDefaultPosition(clampedWidth);
    }

    const clamped = clampPosition(initialPosition, clampedWidth);
    latestWidthRef.current = clampedWidth;
    latestPositionRef.current = clamped;
    setPreviewWidth(clampedWidth);
    setPosition(clamped);
  }, []);

  useEffect(() => {
    function handleResize() {
      setPosition((current) => {
        if (!current) return current;
        const width = clampPreviewWidth(latestWidthRef.current);
        latestWidthRef.current = width;
        setPreviewWidth(width);
        const clamped = clampPosition(current, width);
        latestPositionRef.current = clamped;
        return clamped;
      });
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!visible || !imageSource || !canvasRef.current) return;

    let cancelled = false;
    const token = ++renderTokenRef.current;

    async function render() {
      if (!imageSource || !canvasRef.current) return;

      const brand = getBrand(settings.brandId);
      const renderer = rendererRef.current ?? await preloadCanvasRenderer();
      rendererRef.current = renderer;
      if (cancelled || token !== renderTokenRef.current || !canvasRef.current) return;

      const image =
        imageCacheRef.current?.url === imageSource.url
          ? imageCacheRef.current.image
          : await renderer.loadImageElement(imageSource.url);
      if (cancelled || token !== renderTokenRef.current || !canvasRef.current) return;
      imageCacheRef.current = { url: imageSource.url, image };

      const logo =
        logoCacheRef.current?.url === brand.logo
          ? logoCacheRef.current.image
          : await renderer.loadImageElement(brand.logo).catch(() => null);
      if (cancelled || token !== renderTokenRef.current || !canvasRef.current) return;
      logoCacheRef.current = { url: brand.logo, image: logo };

      renderer.drawWatermarkCanvas({
        canvas: canvasRef.current,
        image,
        settings,
        brand,
        logo,
        maxCanvasSide: 360,
        imageSmoothingQuality: "medium",
      });
    }

    void render();

    return () => {
      cancelled = true;
    };
  }, [imageSource, settings, visible]);

  if (!imageSource) return null;

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!position) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
    setDragging(true);
    onInteractionChange(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 4) {
      drag.moved = true;
    }

    const nextPosition = clampPosition({
      x: drag.originX + dx,
      y: drag.originY + dy,
    }, latestWidthRef.current);
    latestPositionRef.current = nextPosition;
    setPosition(nextPosition);
  }

  function finishPointer(event: PointerEvent<HTMLButtonElement>, openWhenTapped: boolean) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
    onInteractionChange(false);

    const nextPosition = latestPositionRef.current;
    if (!nextPosition) return;
    setSafePosition(nextPosition);

    if (openWhenTapped && !drag.moved) {
      onOpenPreview();
    }
  }

  function handleResizePointerDown(event: PointerEvent<HTMLSpanElement>) {
    if (!position) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originWidth: latestWidthRef.current,
      originX: position.x,
      originY: position.y,
    };
    setResizing(true);
    onInteractionChange(true);
  }

  function handleResizePointerMove(event: PointerEvent<HTMLSpanElement>) {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();
    const dx = event.clientX - resize.startX;
    const dy = event.clientY - resize.startY;
    const delta = Math.abs(dx) > Math.abs(dy / previewAspectRatio) ? dx : dy / previewAspectRatio;
    const width = clampPreviewWidth(resize.originWidth + delta);
    const clampedPosition = clampPosition({ x: resize.originX, y: resize.originY }, width);

    latestWidthRef.current = width;
    latestPositionRef.current = clampedPosition;
    setPreviewWidth(width);
    setPosition(clampedPosition);
  }

  function handleResizePointerEnd(event: PointerEvent<HTMLSpanElement>) {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();
    resizeRef.current = null;
    setResizing(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
    onInteractionChange(false);
    setSafeWidth(latestWidthRef.current, latestPositionRef.current ?? undefined);
  }

  return (
    <button
      aria-label="Open preview"
      className={cn(
        "fixed z-40 flex h-32 w-28 touch-none items-center justify-center overflow-hidden rounded-xl border bg-card/92 p-2 shadow-xl shadow-black/20 backdrop-blur-md md:hidden",
        dragging || resizing ? "cursor-grabbing transition-none" : "cursor-grab transition-all duration-200",
        visible
          ? "pointer-events-auto flex translate-y-0 opacity-100"
          : "pointer-events-none flex translate-y-2 opacity-0"
      )}
      style={{
        left: position?.x ?? -999,
        top: position?.y ?? -999,
        width: previewWidth,
        height: getPreviewHeight(previewWidth),
      }}
      type="button"
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenPreview();
        }
      }}
      onPointerCancel={(event) => finishPointer(event, false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => finishPointer(event, true)}
    >
      <span className="absolute left-2 top-2 grid size-5 place-items-center rounded-md bg-background/90 text-muted-foreground shadow-sm">
        <ImageIcon className="size-3" />
      </span>
      <canvas
        ref={canvasRef}
        className="max-h-full max-w-full select-none object-contain"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-1 right-1 grid size-6 touch-none place-items-center rounded-full bg-background/95 text-muted-foreground shadow-md ring-1 ring-border"
        onPointerCancel={handleResizePointerEnd}
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerEnd}
      >
        <span className="block size-2.5 rounded-[2px] border-b-2 border-r-2 border-current" />
      </span>
    </button>
  );
}
