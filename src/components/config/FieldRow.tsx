"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export function FieldRow({
  label,
  icon,
  action,
  children,
}: {
  label: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex min-h-6 items-center justify-between gap-3">
        <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          {icon}
          {label}
        </Label>
        {action}
      </div>
      {children}
    </div>
  );
}
