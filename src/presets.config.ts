export const presetGroups = [
  { id: "basic", labelKey: "presetGroups.basic" },
  { id: "frame", labelKey: "presetGroups.frame" },
  { id: "film", labelKey: "presetGroups.film" },
] as const;

export const framePresets = [
  {
    id: "CLASSIC",
    name: "CLASSIC",
    group: "basic",
    canvasRatio: null,
    border: { top: 0, right: 0, bottom: 0.095, left: 0 },
    lockRatio: false,
    defaultColor: "white",
    showWatermarkBar: true,
  },
  {
    id: "MINIMAL",
    name: "MINIMAL",
    group: "basic",
    canvasRatio: null,
    border: { top: 0, right: 0, bottom: 0.065, left: 0 },
    lockRatio: false,
    defaultColor: "white",
    showWatermarkBar: true,
  },
  {
    id: "FRAME",
    name: "FRAME",
    group: "frame",
    canvasRatio: null,
    border: { top: 0.07, right: 0.07, bottom: 0.095, left: 0.07 },
    lockRatio: false,
    defaultColor: "white",
    showWatermarkBar: true,
  },
  {
    id: "INSTAX_MINI",
    name: "INSTAX MINI",
    group: "film",
    canvasRatio: "2:3",
    border: { top: 0.06, right: 0.06, bottom: 0.2, left: 0.06 },
    lockRatio: true,
    defaultColor: "white",
    showWatermarkBar: false,
  },
  {
    id: "INSTAX_WIDE",
    name: "INSTAX WIDE",
    group: "film",
    canvasRatio: "3:2",
    border: { top: 0.06, right: 0.06, bottom: 0.2, left: 0.06 },
    lockRatio: true,
    defaultColor: "white",
    showWatermarkBar: false,
  },
  {
    id: "INSTAX_SQUARE",
    name: "INSTAX SQUARE",
    group: "film",
    canvasRatio: "1:1",
    border: { top: 0.05, right: 0.05, bottom: 0.12, left: 0.05 },
    lockRatio: true,
    defaultColor: "white",
    showWatermarkBar: false,
  },
  {
    id: "POLAROID",
    name: "POLAROID",
    group: "film",
    canvasRatio: "4:5",
    border: { top: 0.05, right: 0.05, bottom: 0.28, left: 0.05 },
    lockRatio: true,
    defaultColor: "white",
    showWatermarkBar: false,
  },
] as const;

export type PresetGroupId = (typeof presetGroups)[number]["id"];
export type FramePresetId = (typeof framePresets)[number]["id"];

export function getFramePreset(id: string) {
  return framePresets.find((preset) => preset.id === id) ?? framePresets[0];
}
