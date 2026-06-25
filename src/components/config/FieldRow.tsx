"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function FieldRow({
  label,
  help,
  icon,
  action,
  children,
}: {
  label: string;
  help?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex min-h-6 items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          {icon}
          {label}
          {help ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label={help}
                  className="grid size-4 place-items-center rounded-full text-muted-foreground outline-none transition hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  type="button"
                >
                  <Info className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                align="start"
                className="z-[100] max-w-60 text-left text-[11px] font-medium normal-case leading-4 shadow-lg"
                side="left"
                sideOffset={8}
              >
                {help}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
