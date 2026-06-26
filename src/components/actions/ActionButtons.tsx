"use client";

import { Download, Share2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getBrand } from "@/brands.config";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/tracker";
import type { ImageSource, WatermarkSettings } from "@/types/watermark";

export function ActionButtons({
  imageSource,
  settings,
  onClear,
}: {
  imageSource: ImageSource | null;
  settings: WatermarkSettings;
  onClear: () => void;
}) {
  const t = useTranslations("actions");
  const [canShare, setCanShare] = useState(false);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && "share" in navigator && window.isSecureContext);
  }, []);

  async function createOutputBlob() {
    if (!imageSource) return null;
    const [{ renderWatermarkBlob }, { writeExifToJpeg }] = await Promise.all([
      import("@/utils/canvasRenderer"),
      import("@/utils/exifWriter"),
    ]);
    const rendered = await renderWatermarkBlob({
      imageSource,
      settings,
      brand: getBrand(settings.brandId),
    });
    if (settings.cardMode) return rendered;

    return writeExifToJpeg(rendered, imageSource.file);
  }

  async function download() {
    setBusy("download");
    try {
      const blob = await createOutputBlob();
      if (!blob) return;
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `${imageSource?.name.replace(/\.[^.]+$/, "") || "gr-watermark"}-watermark.${
        settings.cardMode ? "png" : "jpg"
      }`;
      link.click();
      URL.revokeObjectURL(href);
      trackEvent("download_success", {
        frameStyle: settings.frameStyle,
        outputRatio: settings.outputRatio,
        cardMode: settings.cardMode,
        watermarkMode: settings.watermarkMode,
        brandId: settings.brandId,
      });
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    setBusy("share");
    try {
      const blob = await createOutputBlob();
      if (!blob || !imageSource) return;
      const file = new File([blob], `${imageSource.name.replace(/\.[^.]+$/, "")}-watermark.${settings.cardMode ? "png" : "jpg"}`, {
        type: settings.cardMode ? "image/png" : "image/jpeg",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "GR印迹" });
        trackEvent("share_success", {
          frameStyle: settings.frameStyle,
          outputRatio: settings.outputRatio,
          cardMode: settings.cardMode,
          watermarkMode: settings.watermarkMode,
          brandId: settings.brandId,
        });
      }
    } finally {
      setBusy(null);
    }
  }

  if (!imageSource) return null;

  const disabled = !imageSource || busy !== null;
  const items = [
    { key: "clear", icon: Trash2, label: t("clear"), onClick: onClear, show: true },
    { key: "download", icon: Download, label: t("download"), onClick: download, show: true },
    { key: "share", icon: Share2, label: t("share"), onClick: share, show: canShare },
  ];

  const visibleItems = items.filter((item) => item.show);

  return (
    <div
      className="grid border-t bg-card/95 p-2 md:flex md:items-center md:justify-center md:gap-2"
      style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }}
    >
      {visibleItems.map((item) => (
          <Button
            key={item.key}
            className="h-9 rounded-lg px-3 text-xs md:w-24"
            disabled={disabled && item.key !== "clear"}
            variant={item.key === "download" ? "secondary" : "ghost"}
            onClick={item.onClick}
          >
            <item.icon className={item.key === "download" ? "mr-1 size-3.5 text-primary" : "mr-1 size-3.5"} />
            {busy === item.key ? "..." : item.label}
          </Button>
      ))}
    </div>
  );
}
