"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WatermarkSettings } from "@/types/watermark";
import { AdvancedSettings } from "./AdvancedSettings";
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
    <aside className="min-h-0 rounded-xl border bg-card shadow-sm md:h-[calc(100vh-5.5rem)] md:overflow-y-auto">
      <div className="border-b p-4">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <span className="size-2 rounded-full bg-primary" />
          {t("title")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>
      <Tabs className="p-4" defaultValue="output">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="output">{t("outputTab")}</TabsTrigger>
          <TabsTrigger value="metadata">{t("metadataTab")}</TabsTrigger>
        </TabsList>
        <TabsContent className="mt-4" value="output">
          <Card size="sm">
            <CardHeader>
              <CardTitle>{t("outputTab")}</CardTitle>
              <CardDescription>{t("outputDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FrameStyleSelect
                value={settings.frameStyle}
                onChange={(frameStyle) => updateSettings({ frameStyle })}
              />
              <RatioSelect
                value={settings.outputRatio}
                onChange={(outputRatio) => updateSettings({ outputRatio })}
              />
              <WatermarkToggle
                checked={settings.watermark}
                label={t("watermarkOverlay")}
                onChange={(watermark) => updateSettings({ watermark })}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent className="mt-4" value="metadata">
          <Card size="sm">
            <CardHeader>
              <CardTitle>{t("metadataTab")}</CardTitle>
              <CardDescription>{t("metadataDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedSettings settings={settings} updateSettings={updateSettings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
