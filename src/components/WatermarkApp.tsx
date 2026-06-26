"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConfigPanel } from "@/components/config/ConfigPanel";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileFloatingPreview } from "@/components/preview/MobileFloatingPreview";
import { WatermarkPreview } from "@/components/preview/WatermarkPreview";
import { detectBrandFromCamera, getBrand } from "@/brands.config";
import { getNearestOutputRatio } from "@/hooks/useCrop";
import { normalizeImageFile, parseExif } from "@/hooks/useExif";
import { useWatermark } from "@/hooks/useWatermark";
import { getFramePreset } from "@/presets.config";
import type { ImageSource } from "@/types/watermark";
import { trackEvent, trackPageViewOnce } from "@/lib/tracker";
import { preloadCanvasRenderer, preloadExifParser, scheduleIdleTask } from "@/utils/preload";

const ActionButtons = dynamic(
  () => import("./actions/ActionButtons").then((mod) => mod.ActionButtons),
  { ssr: false }
);

const miniPreviewHideDelay = 2800;

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
  const { settings, updateSettings, applyExif, clearExif, resetSettings } = useWatermark();
  const previewSectionRef = useRef<HTMLDivElement>(null);
  const miniPreviewTimerRef = useRef<number | null>(null);
  const miniPreviewInteractingRef = useRef(false);
  const uploadTokenRef = useRef(0);
  const [imageSource, setImageSource] = useState<ImageSource | null>(null);
  const [rendering, setRendering] = useState(false);
  const [brandNotice, setBrandNotice] = useState<string | null>(null);
  const [miniPreviewVisible, setMiniPreviewVisible] = useState(false);

  useEffect(() => {
    trackPageViewOnce();

    return scheduleIdleTask(() => {
      void preloadCanvasRenderer();
      void preloadExifParser();
    });
  }, []);

  useEffect(
    () => () => {
      if (miniPreviewTimerRef.current !== null) {
        window.clearTimeout(miniPreviewTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!brandNotice) return;

    const timer = window.setTimeout(() => {
      setBrandNotice(null);
    }, 3600);

    return () => window.clearTimeout(timer);
  }, [brandNotice]);

  useEffect(() => {
    if (imageSource) return;
    setMiniPreviewVisible(false);
  }, [imageSource]);

  useEffect(() => {
    if (settings.mobilePreview) return;
    if (miniPreviewTimerRef.current !== null) {
      window.clearTimeout(miniPreviewTimerRef.current);
      miniPreviewTimerRef.current = null;
    }
    setMiniPreviewVisible(false);
  }, [settings.mobilePreview]);

  const clearMiniPreviewTimer = useCallback(() => {
    if (miniPreviewTimerRef.current !== null) {
      window.clearTimeout(miniPreviewTimerRef.current);
      miniPreviewTimerRef.current = null;
    }
  }, []);

  const scheduleMiniPreviewHide = useCallback((force = false) => {
    if (!imageSource) return;
    if (!force && !settings.mobilePreview) return;
    if (window.matchMedia("(min-width: 768px)").matches) return;
    if (miniPreviewInteractingRef.current) return;

    clearMiniPreviewTimer();
    miniPreviewTimerRef.current = window.setTimeout(() => {
      setMiniPreviewVisible(false);
      miniPreviewTimerRef.current = null;
    }, miniPreviewHideDelay);
  }, [clearMiniPreviewTimer, imageSource, settings.mobilePreview]);

  const revealMiniPreview = useCallback((force = false) => {
    if (!imageSource) return;
    if (!force && !settings.mobilePreview) return;
    if (window.matchMedia("(min-width: 768px)").matches) return;

    clearMiniPreviewTimer();
    setMiniPreviewVisible(true);
    scheduleMiniPreviewHide(force);
  }, [clearMiniPreviewTimer, imageSource, scheduleMiniPreviewHide, settings.mobilePreview]);

  const handleMiniPreviewInteractionChange = useCallback((interacting: boolean) => {
    miniPreviewInteractingRef.current = interacting;

    if (interacting) {
      clearMiniPreviewTimer();
      setMiniPreviewVisible(true);
      return;
    }

    scheduleMiniPreviewHide();
  }, [clearMiniPreviewTimer, scheduleMiniPreviewHide]);

  const updateSettingsWithPreview = useCallback(
    (patch: Parameters<typeof updateSettings>[0]) => {
      updateSettings(patch);
      if (patch.mobilePreview === false) {
        clearMiniPreviewTimer();
        setMiniPreviewVisible(false);
        return;
      }
      revealMiniPreview(patch.mobilePreview === true);
    },
    [clearMiniPreviewTimer, revealMiniPreview, updateSettings]
  );

  const resetSettingsWithPreview = useCallback(() => {
    resetSettings();
    revealMiniPreview(true);
  }, [resetSettings, revealMiniPreview]);

  const scrollToPreview = useCallback(() => {
    setMiniPreviewVisible(false);
    previewSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const handleFile = useCallback(async (inputFile: File, source: "picker" | "drop" | "paste" = "picker") => {
    const uploadToken = uploadTokenRef.current + 1;
    uploadTokenRef.current = uploadToken;
    setRendering(true);
    try {
      void preloadCanvasRenderer();
      void preloadExifParser();
      const exifPromise = parseExif(inputFile);
      const normalized = await normalizeImageFile(inputFile);
      const url = URL.createObjectURL(normalized);
      const { width, height } = await getImageSize(url);

      if (uploadToken !== uploadTokenRef.current) {
        URL.revokeObjectURL(url);
        return;
      }

      const preset = getFramePreset(settings.frameStyle);
      const outputRatio = preset.lockRatio && preset.canvasRatio
        ? preset.canvasRatio
        : getNearestOutputRatio(width, height);

      updateSettings({ outputRatio });
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
      trackEvent("upload_success", {
        source,
        frameStyle: settings.frameStyle,
        outputRatio,
        cardMode: settings.cardMode,
      });
      setRendering(false);

      void exifPromise.then((exif) => {
        if (uploadToken !== uploadTokenRef.current) return;

        const detectedBrand = detectBrandFromCamera(exif.make, exif.model);
        const brand = detectedBrand ?? getBrand("ricoh-gr");

        setBrandNotice(detectedBrand ? null : t("brandFallbackHint"));
        updateSettings({ brandId: brand.id });
        applyExif({
          ...exif,
          model: exif.model || brand.defaultModel,
        });
      });
    } finally {
      if (uploadToken === uploadTokenRef.current) {
        setRendering(false);
      }
    }
  }, [applyExif, settings.cardMode, settings.frameStyle, t, updateSettings]);

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const file = getPastedImageFile(event);
      if (!file) return;

      event.preventDefault();
      void handleFile(file, "paste");
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFile]);

  function clearImage() {
    uploadTokenRef.current += 1;
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="mx-auto grid min-h-[calc(100vh-6.25rem)] w-full max-w-[1800px] flex-1 gap-4 p-3 md:grid-cols-[minmax(0,1fr)_380px] md:p-4">
        <div ref={previewSectionRef} className="relative flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <WatermarkPreview
            imageSource={imageSource}
            rendering={rendering}
            brandNotice={brandNotice}
            settings={settings}
            updateSettings={updateSettingsWithPreview}
            onFile={handleFile}
          />
          <ActionButtons imageSource={imageSource} settings={settings} onClear={clearImage} />
        </div>
        <ConfigPanel settings={settings} updateSettings={updateSettingsWithPreview} onReset={resetSettingsWithPreview} />
      </main>
      <MobileFloatingPreview
        imageSource={imageSource}
        settings={settings}
        visible={miniPreviewVisible}
        onInteractionChange={handleMiniPreviewInteractionChange}
        onOpenPreview={scrollToPreview}
      />
      <Footer />
    </div>
  );
}
