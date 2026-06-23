"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FieldRow } from "./FieldRow";

type ExifInputValues = {
  focalLength: string;
  aperture: string;
  shutter: string;
  iso: string;
};

export function ExifInputs({
  label,
  enabled,
  values,
  onEnabledChange,
  onChange,
}: {
  label: string;
  enabled: boolean;
  values: ExifInputValues;
  onEnabledChange: (checked: boolean) => void;
  onChange: (values: Partial<ExifInputValues>) => void;
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
        <div className="grid grid-cols-2 gap-2">
          <Input className="h-9" value={values.focalLength} onChange={(event) => onChange({ focalLength: event.target.value })} />
          <Input className="h-9" value={values.aperture} onChange={(event) => onChange({ aperture: event.target.value })} />
          <Input className="h-9" value={values.shutter} onChange={(event) => onChange({ shutter: event.target.value })} />
          <Input className="h-9" value={values.iso} onChange={(event) => onChange({ iso: event.target.value })} />
        </div>
      ) : null}
    </FieldRow>
  );
}
