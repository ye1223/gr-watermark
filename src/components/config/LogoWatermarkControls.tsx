"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { LogoColorMode, LogoPlacement, WatermarkMode } from "@/types/watermark";
import { FieldRow } from "./FieldRow";

const modeOptions: WatermarkMode[] = ["metadata", "logo"];
const colorModes: LogoColorMode[] = ["brand", "solid"];
const placementOptions: Array<{
  value: LogoPlacement;
  markerClassName: string;
  kind: "corner" | "edge";
}> = [
  { value: "border-top", markerClassName: "left-1/2 top-2 -translate-x-1/2", kind: "edge" },
  { value: "border-right", markerClassName: "right-2 top-1/2 -translate-y-1/2", kind: "edge" },
  { value: "border-bottom", markerClassName: "bottom-2 left-1/2 -translate-x-1/2", kind: "edge" },
  { value: "border-left", markerClassName: "left-2 top-1/2 -translate-y-1/2", kind: "edge" },
  { value: "photo-top-left", markerClassName: "left-[15%] top-[17%]", kind: "corner" },
  { value: "photo-top-right", markerClassName: "right-[15%] top-[17%]", kind: "corner" },
  { value: "photo-bottom-left", markerClassName: "bottom-[17%] left-[15%]", kind: "corner" },
  { value: "photo-bottom-right", markerClassName: "bottom-[17%] right-[15%]", kind: "corner" },
];

function OptionButton<T extends string>({
  active,
  children,
  value,
  onSelect,
}: {
  active: boolean;
  children: ReactNode;
  value: T;
  onSelect: (value: T) => void;
}) {
  return (
    <Button
      className={cn(
        "h-8 justify-center text-xs",
        active && "border-primary bg-accent text-accent-foreground ring-2 ring-primary/15"
      )}
      type="button"
      variant="outline"
      onClick={() => onSelect(value)}
    >
      {children}
    </Button>
  );
}

function PlacementPicker({
  value,
  onChange,
  t,
}: {
  value: LogoPlacement;
  onChange: (placement: LogoPlacement) => void;
  t: (key: string) => string;
}) {
  return (
    <FieldRow label={t("logoPosition")}>
      <div className="space-y-2">
        <div className="relative h-28 rounded-lg border bg-muted/30 p-2.5">
          <div className="pointer-events-none absolute inset-2.5 rounded-md border border-dashed border-border/80" />
          <div className="pointer-events-none absolute inset-x-[16%] inset-y-[18%] rounded-md border bg-background/90 shadow-sm" />
          <div className="pointer-events-none absolute left-1/2 top-[18%] h-[64%] w-px -translate-x-1/2 bg-border/50" />
          <div className="pointer-events-none absolute left-[16%] top-1/2 h-px w-[68%] -translate-y-1/2 bg-border/50" />
          {placementOptions.map((option) => {
            const active = value === option.value;

            return (
              <button
                aria-label={t(`logoPlacements.${option.value}`)}
                aria-pressed={active}
                className={cn(
                  "absolute z-10 grid size-7 place-items-center rounded-full border bg-background text-[10px] font-semibold shadow-sm transition",
                  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  option.markerClassName,
                  option.kind === "edge" ? "text-muted-foreground" : "text-foreground",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-md ring-4 ring-primary/15"
                    : "hover:border-primary/50 hover:bg-card"
                )}
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
              >
                <span
                  className={cn(
                    "block bg-current",
                    option.kind === "edge"
                      ? option.value === "border-left" || option.value === "border-right"
                        ? "h-3.5 w-1 rounded-full"
                        : "h-1 w-3.5 rounded-full"
                      : "size-1.5 rounded-full"
                  )}
                />
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{t("logoPositionPhotoHint")}</span>
          <span>{t("logoPositionBorderHint")}</span>
        </div>
        <p className="text-xs font-medium text-foreground">{t(`logoPlacements.${value}`)}</p>
      </div>
    </FieldRow>
  );
}

export function LogoWatermarkControls({
  mode,
  placement,
  scale,
  inset,
  colorMode,
  onModeChange,
  onPlacementChange,
  onScaleChange,
  onInsetChange,
  onColorModeChange,
  t,
}: {
  mode: WatermarkMode;
  placement: LogoPlacement;
  scale: number;
  inset: number;
  colorMode: LogoColorMode;
  onModeChange: (mode: WatermarkMode) => void;
  onPlacementChange: (placement: LogoPlacement) => void;
  onScaleChange: (scale: number) => void;
  onInsetChange: (inset: number) => void;
  onColorModeChange: (colorMode: LogoColorMode) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      <FieldRow label={t("watermarkMode")}>
        <div className="grid grid-cols-2 gap-2">
          {modeOptions.map((option) => (
            <OptionButton
              active={mode === option}
              key={option}
              value={option}
              onSelect={onModeChange}
            >
              {t(`watermarkModes.${option}`)}
            </OptionButton>
          ))}
        </div>
      </FieldRow>

      {mode === "logo" ? (
        <>
          <PlacementPicker t={t} value={placement} onChange={onPlacementChange} />
          <FieldRow label={t("logoSize")}>
            <div className="space-y-2">
              <Slider
                max={1.6}
                min={0.6}
                step={0.05}
                value={[scale]}
                onValueChange={([next]) => onScaleChange(next ?? scale)}
              />
              <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
                <span>60%</span>
                <span>{Math.round(scale * 100)}%</span>
                <span>160%</span>
              </div>
            </div>
          </FieldRow>
          <FieldRow label={t("logoInset")}>
            <div className="space-y-2">
              <Slider
                max={0.08}
                min={0.01}
                step={0.005}
                value={[inset]}
                onValueChange={([next]) => onInsetChange(next ?? inset)}
              />
              <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
                <span>1%</span>
                <span>{Math.round(inset * 100)}%</span>
                <span>8%</span>
              </div>
            </div>
          </FieldRow>
          <FieldRow label={t("logoColorMode")}>
            <div className="grid grid-cols-2 gap-2">
              {colorModes.map((option) => (
                <OptionButton
                  active={colorMode === option}
                  key={option}
                  value={option}
                  onSelect={onColorModeChange}
                >
                  {t(`logoColorModes.${option}`)}
                </OptionButton>
              ))}
            </div>
          </FieldRow>
        </>
      ) : null}
    </div>
  );
}
