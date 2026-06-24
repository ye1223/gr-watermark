"use client";

import { cn } from "@/lib/utils";
import { FieldRow } from "./FieldRow";

export function WatermarkToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <FieldRow
      action={
        <button
          aria-checked={checked}
          aria-label={label}
          className={cn(
            "relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-colors",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            checked ? "bg-primary" : "bg-input dark:bg-input/80"
          )}
          role="switch"
          type="button"
          onClick={() => onChange(!checked)}
        >
          <span
            className={cn(
              "size-4 rounded-full bg-background transition-transform dark:bg-foreground",
              checked && "translate-x-4 dark:bg-primary-foreground"
            )}
          />
        </button>
      }
      label={label}
    >
      <div className="h-px" />
    </FieldRow>
  );
}
