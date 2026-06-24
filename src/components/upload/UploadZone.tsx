"use client";

import { ImagePlus } from "lucide-react";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function UploadZone({
  onFile,
  onPrepare,
  compact = false,
}: {
  onFile: (file: File) => void;
  onPrepare?: () => void;
  compact?: boolean;
}) {
  const t = useTranslations("upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function pickFile(event: ChangeEvent<HTMLInputElement>) {
    onPrepare?.();
    const file = event.target.files?.[0];
    if (file) onFile(file);
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    onPrepare?.();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      className={cn(
        "w-full max-w-2xl cursor-pointer rounded-lg border border-dashed bg-card/70 transition hover:bg-card",
        compact
          ? "grid min-h-[260px] place-items-center px-6 py-8 text-center md:min-h-[320px]"
          : "grid min-h-[460px] place-items-center text-center",
        dragging ? "border-primary bg-accent" : "border-border"
      )}
      role="button"
      tabIndex={0}
      onClick={() => {
        onPrepare?.();
        inputRef.current?.click();
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        onPrepare?.();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onFocus={onPrepare}
      onPointerEnter={onPrepare}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onPrepare?.();
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        type="file"
        onChange={pickFile}
      />
      <div className="space-y-3 px-6">
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-lg border bg-muted",
            compact ? "mx-auto size-11" : "mx-auto size-10"
          )}
        >
          <ImagePlus className="size-5 text-primary" />
        </span>
        <div>
          <p className={cn("font-medium leading-none", compact ? "text-base" : "text-sm")}>{t("hint")}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("formats")}
          </p>
        </div>
      </div>
    </div>
  );
}
