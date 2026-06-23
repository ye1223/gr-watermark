"use client";

import { CircleDot } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { frameStyles, type FrameStyle } from "@/types/watermark";
import { FieldRow } from "./FieldRow";

export function FrameStyleSelect({
  value,
  onChange,
}: {
  value: FrameStyle;
  onChange: (value: FrameStyle) => void;
}) {
  const t = useTranslations();

  return (
    <FieldRow icon={<CircleDot className="size-3.5" />} label={t("config.frameStyle")}>
      <Select value={value} onValueChange={(next) => onChange(next as FrameStyle)}>
        <SelectTrigger className="h-9 w-full rounded border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {frameStyles.map((style) => (
            <SelectItem key={style} value={style}>
              {t(`presets.${style}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldRow>
  );
}
