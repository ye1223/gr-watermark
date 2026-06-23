"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FieldRow } from "./FieldRow";

export function SubtitleInput({
  label,
  placeholder,
  enabled,
  value,
  onEnabledChange,
  onChange,
}: {
  label: string;
  placeholder: string;
  enabled: boolean;
  value: string;
  onEnabledChange: (checked: boolean) => void;
  onChange: (value: string) => void;
}) {
  return (
    <FieldRow
      action={
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      }
      label={label}
    >
      {enabled ? (
        <Input
          className="h-9"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}
    </FieldRow>
  );
}
