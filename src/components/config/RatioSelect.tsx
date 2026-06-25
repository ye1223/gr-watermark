"use client";

import { ChevronDown, Type } from "lucide-react";
import { type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { outputRatios, type OutputRatio } from "@/types/watermark";
import { FieldRow } from "./FieldRow";

export function RatioSelect({
  value,
  disabled = false,
  help,
  onChange,
}: {
  value: OutputRatio;
  disabled?: boolean;
  help?: string;
  onChange: (value: OutputRatio) => void;
}) {
  const t = useTranslations();
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value as OutputRatio);
  }

  return (
    <FieldRow help={help} icon={<Type className="size-3.5" />} label={t("config.outputRatio")}>
      <div className="relative">
        <select
          aria-label={t("config.outputRatio")}
          className="h-9 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-8 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          disabled={disabled}
          title={help}
          value={value}
          onChange={handleChange}
        >
          {outputRatios.map((ratio) => (
            <option key={ratio} value={ratio}>
              {t(`ratio.${ratio}`)}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </FieldRow>
  );
}
