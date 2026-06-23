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
    <header className="flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
      <Link className="flex items-center gap-2 font-medium tracking-normal" href={`/${locale}`}>
        <span className="size-2 rounded-full bg-[#CC0000]" />
        <span>{t("title")}</span>
      </Link>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild className="h-8 rounded border px-2 text-xs" variant="ghost">
              <Link aria-label={t("language")} href={`/${nextLocale}`}>
                <Languages className="mr-1 size-3.5" />
                {locale.toUpperCase()} / {nextLocale.toUpperCase()}
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
