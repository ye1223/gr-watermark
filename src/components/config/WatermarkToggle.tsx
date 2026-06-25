"use client";

import { Switch } from "@/components/ui/switch";
import { FieldRow } from "./FieldRow";

export function WatermarkToggle({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <FieldRow
      action={
        <Switch
          aria-label={label}
          checked={checked}
          onCheckedChange={onChange}
        />
      }
      help={help}
      label={label}
    >
      <div className="h-px" />
    </FieldRow>
  );
}
