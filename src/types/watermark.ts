export type FrameStyle = "ORIGINAL" | "CLASSIC" | "MINIMAL" | "INSTAX" | "POLAROID";
export const outputRatios = [
  "CLASSIC_LANDSCAPE",
  "CLASSIC_PORTRAIT",
  "SQUARE",
  "SOCIAL_PORTRAIT",
  "CINEMA_WIDE",
  "STORY_VERTICAL",
  "INSTAX_MINI",
  "INSTAX_SQUARE",
  "INSTAX_WIDE",
] as const;
export type OutputRatio = (typeof outputRatios)[number];
export type BorderTone = "white" | "black";

export interface WatermarkSettings {
  frameStyle: FrameStyle;
  outputRatio: OutputRatio;
  watermark: boolean;
  brandId: string;
  borderTone: BorderTone;
  showModel: boolean;
  model: string;
  showExif: boolean;
  focalLength: string;
  aperture: string;
  shutter: string;
  iso: string;
  showDate: boolean;
  date: string;
  showSubtitle: boolean;
  subtitle: string;
}

export interface ImageSource {
  file: File;
  url: string;
  originalUrl: string;
  name: string;
  width: number;
  height: number;
}

export interface ParsedExif {
  model?: string;
  focalLength?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
  date?: string;
}

export const frameStyles: FrameStyle[] = [
  "ORIGINAL",
  "CLASSIC",
  "MINIMAL",
  "INSTAX",
  "POLAROID",
];
