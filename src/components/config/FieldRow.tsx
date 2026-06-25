"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";

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
            <span className="group/help relative inline-flex">
              <button
                aria-label={help}
                className="grid size-4 place-items-center rounded-full text-muted-foreground outline-none transition hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                title={help}
                type="button"
              >
                <Info className="size-3.5" />
              </button>
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 top-5 z-20 w-56 rounded-md bg-foreground px-2.5 py-1.5 text-left text-[11px] font-medium normal-case leading-4 text-background opacity-0 shadow-md transition group-hover/help:opacity-100 group-focus-within/help:opacity-100"
              >
                {help}
              </span>
            </span>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
