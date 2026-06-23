"use client";

import { ChevronDown, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import type { WatermarkSettings } from "@/types/watermark";
import { BrandLogoSelect } from "./BrandLogoSelect";
import { DatetimeInput } from "./DatetimeInput";
import { ExifInputs } from "./ExifInputs";
import { FieldRow } from "./FieldRow";
import { ModelInput } from "./ModelInput";
import { SubtitleInput } from "./SubtitleInput";

export function AdvancedSettings({
  settings,
  updateSettings,
}: {
  settings: WatermarkSettings;
  updateSettings: (patch: Partial<WatermarkSettings>) => void;
}) {
  const t = useTranslations("config");
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase text-muted-foreground">
        <span className="flex items-center gap-2">
          <Settings2 className="size-3.5" />
          {t("advancedSettings")}
        </span>
        <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-4">
        <Separator className="border-dashed" />
        <BrandLogoSelect
          label={t("brandLogo")}
          value={settings.brandId}
          onChange={(brandId) => updateSettings({ brandId })}
        />
        <FieldRow label={t("borderTone")}>
          <div className="grid grid-cols-2 gap-2">
            {(["white", "black"] as const).map((tone) => (
              <button
                key={tone}
                className={`h-9 rounded border text-xs uppercase ${
                  settings.borderTone === tone ? "border-[#CC0000]" : "border-border"
                } ${tone === "black" ? "bg-zinc-950 text-white" : "bg-white text-zinc-950"}`}
                type="button"
                onClick={() => updateSettings({ borderTone: tone })}
              >
                {t(tone)}
              </button>
            ))}
          </div>
        </FieldRow>
        <ModelInput
          enabled={settings.showModel}
          label={t("cameraModel")}
          value={settings.model}
          onChange={(model) => updateSettings({ model })}
          onEnabledChange={(showModel) => updateSettings({ showModel })}
        />
        <ExifInputs
          enabled={settings.showExif}
          label={t("exifData")}
          values={settings}
          onChange={updateSettings}
          onEnabledChange={(showExif) => updateSettings({ showExif })}
        />
        <DatetimeInput
          enabled={settings.showDate}
          label={t("datetime")}
          value={settings.date}
          onChange={(date) => updateSettings({ date })}
          onEnabledChange={(showDate) => updateSettings({ showDate })}
        />
        <SubtitleInput
          enabled={settings.showSubtitle}
          label={t("photoSubtitle")}
          placeholder={t("subtitlePlaceholder")}
          value={settings.subtitle}
          onChange={(subtitle) => updateSettings({ subtitle })}
          onEnabledChange={(showSubtitle) => updateSettings({ showSubtitle })}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
