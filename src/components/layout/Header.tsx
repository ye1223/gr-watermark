"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const t = useTranslations("header");
  const locale = useLocale();
  const nextLocale = locale === "zh" ? "en" : "zh";
  const primaryMark = nextLocale === "zh" ? "中" : "A";
  const secondaryMark = nextLocale === "zh" ? "A" : "中";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-4">
      <Link className="group flex items-center gap-2.5 leading-none" href={`/${locale}`}>
        <span className="relative grid h-8 w-11 place-items-center rounded-lg bg-foreground font-mono text-[15px] font-bold tracking-[0.06em] text-background shadow-sm transition group-hover:shadow-md">
          <span>GR</span>
          <span className="absolute bottom-1 right-1 size-1.5 rounded-full bg-primary ring-2 ring-foreground" />
        </span>
        <span className="text-[18px] font-semibold tracking-normal text-foreground">
          {t("wordmark")}
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Button
          asChild
          className="size-8 rounded-lg border bg-muted text-muted-foreground hover:bg-background hover:text-foreground"
          size="icon"
          title={t("language")}
          variant="ghost"
        >
          <Link aria-label={`${t("language")} ${primaryMark} ${secondaryMark}`} href={`/${nextLocale}`}>
            <span aria-hidden className="relative block size-4">
              <span className="absolute left-0 top-0 font-mono text-[12px] font-semibold leading-none">
                {primaryMark}
              </span>
              <span className="absolute bottom-0 right-0 rounded-[3px] bg-background px-[2px] font-mono text-[7px] font-semibold leading-[9px] text-primary shadow-sm">
                {secondaryMark}
              </span>
            </span>
          </Link>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
