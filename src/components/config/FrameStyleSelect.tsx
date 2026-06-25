"use client";

import { ChevronDown, CircleDot } from "lucide-react";
import { type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { framePresets, presetGroups } from "@/presets.config";
import type { FrameStyle } from "@/types/watermark";
import { FieldRow } from "./FieldRow";

export function FrameStyleSelect({
  value,
  onChange,
}: {
  value: FrameStyle;
  onChange: (value: FrameStyle) => void;
}) {
  const t = useTranslations();
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value as FrameStyle);
  }

  return (
    <FieldRow icon={<CircleDot className="size-3.5" />} label={t("config.frameStyle")}>
      <div className="relative">
        <select
          aria-label={t("config.frameStyle")}
          className="h-9 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-8 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          value={value}
          onChange={handleChange}
        >
          {presetGroups.map((group) => (
            <optgroup key={group.id} label={`── ${t(group.labelKey)} ──`}>
              {framePresets
                .filter((preset) => preset.group === group.id)
                .map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </FieldRow>
  );
}
