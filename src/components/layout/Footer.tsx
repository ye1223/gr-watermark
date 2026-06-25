"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

const githubProfileUrl = "https://github.com/ye1223";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t bg-background/85 px-3 py-3 text-xs text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-4">
      <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center justify-between gap-2">
        <p>{t("copyright", { name: "Levy Liu" })}</p>
        <a
          className="inline-flex items-center gap-1.5 font-medium text-foreground/75 transition-colors hover:text-foreground"
          href={githubProfileUrl}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink className="size-3.5" />
          {t("github")}
        </a>
      </div>
    </footer>
  );
}
