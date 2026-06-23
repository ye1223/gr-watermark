"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const t = useTranslations("config");
  const fields = [
    {
      key: "focalLength",
      label: t("exifFocalLength"),
      value: values.focalLength,
      onChange: (value: string) => onChange({ focalLength: value }),
    },
    {
      key: "aperture",
      label: t("exifAperture"),
      value: values.aperture,
      onChange: (value: string) => onChange({ aperture: value }),
    },
    {
      key: "shutter",
      label: t("exifShutter"),
      value: values.shutter,
      onChange: (value: string) => onChange({ shutter: value }),
    },
    {
      key: "iso",
      label: t("exifIso"),
      value: values.iso,
      onChange: (value: string) => onChange({ iso: value }),
    },
  ];

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
        <div className="grid grid-cols-2 gap-2.5">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">
                {field.label}
              </Label>
              <Input
                className="h-9"
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
              />
            </div>
          ))}
        </div>
      ) : null}
    </FieldRow>
  );
}
