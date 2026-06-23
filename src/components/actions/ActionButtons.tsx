"use client";

import { Clipboard, Download, Share2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getBrand } from "@/brands.config";
import { Button } from "@/components/ui/button";
import type { ImageSource, WatermarkSettings } from "@/types/watermark";
import { renderWatermarkBlob } from "@/utils/canvasRenderer";
import { writeExifToJpeg } from "@/utils/exifWriter";

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
  const [canCopy, setCanCopy] = useState(false);
  const [busy, setBusy] = useState<"download" | "copy" | "share" | null>(null);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && "share" in navigator && window.isSecureContext);
    setCanCopy(typeof ClipboardItem !== "undefined" && navigator.clipboard && window.isSecureContext);
  }, []);

  async function createOutputBlob() {
    if (!imageSource) return null;
    const rendered = await renderWatermarkBlob({
      imageSource,
      settings,
      brand: getBrand(settings.brandId),
    });
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
      link.download = `${imageSource?.name.replace(/\.[^.]+$/, "") || "gr-watermark"}-watermark.jpg`;
      link.click();
      URL.revokeObjectURL(href);
    } finally {
      setBusy(null);
    }
  }

  async function copy() {
    setBusy("copy");
    try {
      const blob = await createOutputBlob();
      if (!blob || !canCopy) return;
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    setBusy("share");
    try {
      const blob = await createOutputBlob();
      if (!blob || !imageSource) return;
      const file = new File([blob], `${imageSource.name.replace(/\.[^.]+$/, "")}-watermark.jpg`, {
        type: "image/jpeg",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "GR Watermark" });
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
    { key: "copy", icon: Clipboard, label: t("copy"), onClick: copy, show: canCopy },
    { key: "share", icon: Share2, label: t("share"), onClick: share, show: canShare },
  ];

  const visibleItems = items.filter((item) => item.show);

  return (
    <div
      className="grid border-t bg-card/95 p-2 backdrop-blur md:absolute md:bottom-4 md:left-1/2 md:w-auto md:-translate-x-1/2 md:grid-cols-none md:grid-flow-col md:rounded-xl md:border md:shadow-lg"
      style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }}
    >
      {visibleItems.map((item) => (
          <Button
            key={item.key}
            className="h-9 rounded-lg px-3 text-xs md:w-24"
            disabled={disabled && item.key !== "clear"}
            variant={item.key === "download" ? "default" : item.key === "clear" ? "destructive" : "ghost"}
            onClick={item.onClick}
          >
            <item.icon className="mr-1 size-3.5" />
            {busy === item.key ? "..." : item.label}
          </Button>
      ))}
    </div>
  );
}
