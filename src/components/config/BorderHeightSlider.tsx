"use client";

import { PanelBottom } from "lucide-react";
import { useTranslations } from "next-intl";
import { Slider } from "@/components/ui/slider";
import type { PresetGroupId } from "@/presets.config";
import type { WatermarkSettings } from "@/types/watermark";
import { FieldRow } from "./FieldRow";

function ScaleSlider({
  label,
  value,
  disabled = false,
  help,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  help?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">{Math.round(value * 100)}%</span>
      </div>
      <Slider
        aria-label={label}
        className={disabled ? "cursor-not-allowed opacity-50" : undefined}
        disabled={disabled}
        max={2}
        min={0.4}
        step={0.05}
        title={help}
        value={[value]}
        onValueChange={([next]) => onChange(next)}
      />
    </div>
  );
}

export function BorderControls({
  group,
  borderScale,
  frameBorderScale,
  disabled = false,
  help,
  onBorderScaleChange,
  onFrameBorderScaleChange,
}: {
  group: PresetGroupId;
  borderScale: number;
  frameBorderScale: WatermarkSettings["frameBorderScale"];
  disabled?: boolean;
  help?: string;
  onBorderScaleChange: (value: number) => void;
  onFrameBorderScaleChange: (value: WatermarkSettings["frameBorderScale"]) => void;
}) {
  const t = useTranslations();
  const isFrame = group === "frame";
  const isFilm = group === "film";

  return (
    <FieldRow
      help={help}
      icon={<PanelBottom className="size-3.5" />}
      label={isFrame ? t("config.frameBorderWidth") : t("config.watermarkBarHeight")}
    >
      {isFrame ? (
        <div className="space-y-3">
          <ScaleSlider
            disabled={disabled}
            help={help}
            label={t("config.borderTop")}
            value={frameBorderScale.top}
            onChange={(top) => onFrameBorderScaleChange({ ...frameBorderScale, top })}
          />
          <ScaleSlider
            disabled={disabled}
            help={help}
            label={t("config.borderSides")}
            value={frameBorderScale.side}
            onChange={(side) => onFrameBorderScaleChange({ ...frameBorderScale, side })}
          />
          <ScaleSlider
            disabled={disabled}
            help={help}
            label={t("config.borderBottom")}
            value={frameBorderScale.bottom}
            onChange={(bottom) => onFrameBorderScaleChange({ ...frameBorderScale, bottom })}
          />
        </div>
      ) : (
        <ScaleSlider
          disabled={disabled || isFilm}
          help={help}
          label={isFilm ? t("config.lockedBorder") : t("config.borderBottom")}
          value={borderScale}
          onChange={onBorderScaleChange}
        />
      )}
    </FieldRow>
  );
}
