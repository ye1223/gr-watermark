"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="space-y-4">
      <BrandLogoSelect
        label={t("brandLogo")}
        value={settings.brandId}
        onChange={(brandId) => updateSettings({ brandId })}
      />
      <FieldRow label={t("borderTone")}>
        <div className="grid grid-cols-2 gap-2">
          {(["white", "black"] as const).map((tone) => (
            <Button
              key={tone}
              className={`h-9 justify-center text-xs uppercase ${
                settings.borderTone === tone ? "border-primary ring-2 ring-primary/20" : ""
              } ${
                tone === "black"
                  ? "bg-[#11100e] text-[#f4efe7] hover:bg-[#181612] hover:text-[#f4efe7] dark:bg-[#11100e] dark:text-[#f4efe7] dark:hover:bg-[#181612] dark:hover:text-[#f4efe7]"
                  : "bg-[#f7f3ec] text-[#15130f] hover:bg-[#eee8dd] hover:text-[#15130f] dark:bg-[#f7f3ec] dark:text-[#15130f] dark:hover:bg-[#eee8dd] dark:hover:text-[#15130f]"
              }`}
              type="button"
              variant="outline"
              onClick={() => updateSettings({ borderTone: tone })}
            >
              {t(tone)}
            </Button>
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
    </div>
  );
}
