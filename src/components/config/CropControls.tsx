"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { WatermarkSettings } from "@/types/watermark";
import { FieldRow } from "./FieldRow";

export function CropControls({
  settings,
  updateSettings,
}: {
  settings: WatermarkSettings;
  updateSettings: (patch: Partial<WatermarkSettings>) => void;
}) {
  const t = useTranslations("config");

  if (settings.outputRatio === "ORIGINAL") return null;

  return (
    <div className="space-y-4 border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          {t("cropPosition")}
        </p>
        <Button
          className="h-7 rounded border px-2 text-xs"
          type="button"
          variant="ghost"
          onClick={() => updateSettings({ cropZoom: 1, cropX: 0, cropY: 0 })}
        >
          <RotateCcw className="mr-1 size-3" />
          {t("resetCrop")}
        </Button>
      </div>
      <FieldRow label={t("cropZoom")}>
        <Slider
          max={3}
          min={1}
          step={0.01}
          value={[settings.cropZoom]}
          onValueChange={([cropZoom]) => updateSettings({ cropZoom })}
        />
      </FieldRow>
      <FieldRow label={t("horizontal")}>
        <Slider
          max={100}
          min={-100}
          step={1}
          value={[settings.cropX]}
          onValueChange={([cropX]) => updateSettings({ cropX })}
        />
      </FieldRow>
      <FieldRow label={t("vertical")}>
        <Slider
          max={100}
          min={-100}
          step={1}
          value={[settings.cropY]}
          onValueChange={([cropY]) => updateSettings({ cropY })}
        />
      </FieldRow>
    </div>
  );
}
