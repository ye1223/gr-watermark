"use client";

import { Type } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { outputRatios, type OutputRatio } from "@/types/watermark";
import { FieldRow } from "./FieldRow";

export function RatioSelect({
  value,
  onChange,
}: {
  value: OutputRatio;
  onChange: (value: OutputRatio) => void;
}) {
  const t = useTranslations();

  return (
    <FieldRow icon={<Type className="size-3.5" />} label={t("config.outputRatio")}>
      <Select value={value} onValueChange={(next) => onChange(next as OutputRatio)}>
        <SelectTrigger className="h-9 w-full rounded border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {outputRatios.map((ratio) => (
            <SelectItem key={ratio} value={ratio}>
              {t(`ratio.${ratio}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldRow>
  );
}
