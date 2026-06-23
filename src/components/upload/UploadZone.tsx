"use client";

import { ImagePlus } from "lucide-react";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function UploadZone({
  onFile,
  compact = false,
}: {
  onFile: (file: File) => void;
  compact?: boolean;
}) {
  const t = useTranslations("upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onFile(file);
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      className={cn(
        "grid w-full max-w-2xl cursor-pointer place-items-center rounded-xl border border-dashed bg-card/80 text-center shadow-sm transition hover:bg-card",
        compact ? "min-h-[320px]" : "min-h-[460px]",
        dragging ? "border-primary bg-accent" : "border-border"
      )}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
      }}
    >
      <input
        ref={inputRef}
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        type="file"
        onChange={pickFile}
      />
      <div className="space-y-4 px-6">
        <span className="mx-auto grid size-12 place-items-center rounded-xl border bg-muted">
          <ImagePlus className="size-6 text-primary" />
        </span>
        <div>
          <p className="text-sm font-medium">{t("hint")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("formats")}</p>
        </div>
      </div>
    </div>
  );
}
