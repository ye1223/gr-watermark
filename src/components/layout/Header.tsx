"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const t = useTranslations("header");
  const locale = useLocale();
  const nextLocale = locale === "zh" ? "en" : "zh";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-4">
      <Link className="flex items-center gap-2.5 leading-none" href={`/${locale}`} aria-label={t("title")}>
        <span className="font-mono text-[13px] font-semibold tracking-[0.14em] text-foreground">
          GR
        </span>
        <span className="h-4 w-px bg-border" />
        <span className="text-sm font-medium tracking-normal text-foreground/90">
          Watermark
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              className="text-muted-foreground hover:text-foreground"
              size="icon-sm"
              variant="ghost"
            >
              <Link aria-label={t("language")} href={`/${nextLocale}`}>
                <Languages className="size-3.5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("language")}</TooltipContent>
        </Tooltip>
        <ThemeToggle />
      </div>
    </header>
  );
}
