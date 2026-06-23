"use client";

import { ModelInput } from "./ModelInput";

export function DatetimeInput(props: {
  label: string;
  enabled: boolean;
  value: string;
  onEnabledChange: (checked: boolean) => void;
  onChange: (value: string) => void;
}) {
  return <ModelInput {...props} />;
}
