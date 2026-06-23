"use client";

import { useTranslations } from "next-intl";
import type { WatermarkSettings } from "@/types/watermark";
import { AdvancedSettings } from "./AdvancedSettings";
import { CropControls } from "./CropControls";
import { FrameStyleSelect } from "./FrameStyleSelect";
import { RatioSelect } from "./RatioSelect";
import { WatermarkToggle } from "./WatermarkToggle";

export function ConfigPanel({
  settings,
  updateSettings,
}: {
  settings: WatermarkSettings;
  updateSettings: (patch: Partial<WatermarkSettings>) => void;
}) {
  const t = useTranslations("config");

  return (
    <aside className="border-t bg-background p-4 md:h-[calc(100vh-3.5rem)] md:w-[360px] md:shrink-0 md:overflow-y-auto md:border-l md:border-t-0 md:p-5">
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className="size-2 rounded-full bg-[#CC0000]" />
          {t("title")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="space-y-5">
        <FrameStyleSelect
          value={settings.frameStyle}
          onChange={(frameStyle) => updateSettings({ frameStyle })}
        />
        <RatioSelect
          value={settings.outputRatio}
          onChange={(outputRatio) =>
            updateSettings({ outputRatio, cropZoom: 1, cropX: 0, cropY: 0 })
          }
        />
        <CropControls settings={settings} updateSettings={updateSettings} />
        <WatermarkToggle
          checked={settings.watermark}
          label={t("watermarkOverlay")}
          onChange={(watermark) => updateSettings({ watermark })}
        />
        <AdvancedSettings settings={settings} updateSettings={updateSettings} />
      </div>
    </aside>
  );
}
