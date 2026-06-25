"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WatermarkSettings } from "@/types/watermark";
import { scheduleIdleTask } from "@/utils/preload";
import { FrameStyleSelect } from "./FrameStyleSelect";
import { RatioSelect } from "./RatioSelect";
import { WatermarkToggle } from "./WatermarkToggle";

const loadAdvancedSettings = () => import("./AdvancedSettings").then((mod) => mod.AdvancedSettings);

const AdvancedSettings = dynamic(
  loadAdvancedSettings,
  {
    ssr: false,
    loading: () => <div className="h-72 animate-pulse rounded-lg bg-muted/40" />,
  }
);

export function ConfigPanel({
  settings,
  updateSettings,
}: {
  settings: WatermarkSettings;
  updateSettings: (patch: Partial<WatermarkSettings>) => void;
}) {
  const t = useTranslations("config");
  const [activeTab, setActiveTab] = useState<"output" | "metadata">("output");

  useEffect(() => {
    return scheduleIdleTask(() => {
      void loadAdvancedSettings();
    }, 1800);
  }, []);

  return (
    <aside className="min-h-0 rounded-xl border bg-card shadow-sm md:h-[calc(100vh-5.5rem)] md:overflow-y-auto">
      <div className="border-b p-4">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <span className="size-2 rounded-full bg-primary" />
          {t("title")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="p-4">
        <div className="grid h-8 w-full grid-cols-2 rounded-lg bg-muted p-[3px]" role="tablist">
          {(["output", "metadata"] as const).map((tab) => (
            <button
              key={tab}
              aria-selected={activeTab === tab}
              className={cn(
                "rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                activeTab === tab && "bg-background text-foreground shadow-sm dark:bg-input/30"
              )}
              role="tab"
              type="button"
              onFocus={() => {
                if (tab === "metadata") void loadAdvancedSettings();
              }}
              onClick={() => {
                if (tab === "metadata") void loadAdvancedSettings();
                setActiveTab(tab);
              }}
              onPointerEnter={() => {
                if (tab === "metadata") void loadAdvancedSettings();
              }}
              onPointerDown={() => {
                if (tab === "metadata") void loadAdvancedSettings();
              }}
            >
              {tab === "output" ? t("outputTab") : t("metadataTab")}
            </button>
          ))}
        </div>
        <div className="mt-4">
          {activeTab === "output" ? (
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
              <WatermarkToggle
                checked={settings.cardMode}
                help={t("cardModeHint")}
                label={t("cardMode")}
                onChange={(cardMode) => updateSettings({ cardMode })}
              />
            </CardContent>
          </Card>
          ) : (
          <Card size="sm">
            <CardHeader>
              <CardTitle>{t("metadataTab")}</CardTitle>
              <CardDescription>{t("metadataDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedSettings settings={settings} updateSettings={updateSettings} />
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </aside>
  );
}
