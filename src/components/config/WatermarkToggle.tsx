"use client";

import { Switch } from "@/components/ui/switch";
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
        <Switch
          checked={checked}
          onCheckedChange={onChange}
        />
      }
      label={label}
    >
      <div className="h-px" />
    </FieldRow>
  );
}
