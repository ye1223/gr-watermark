export type FrameStyle =
  | "ORIGINAL"
  | "CLASSIC"
  | "MINIMAL"
  | "INSTAX_MINI"
  | "INSTAX_SQUARE"
  | "INSTAX_WIDE"
  | "POLAROID";
export const outputRatios = [
  "3:2",
  "2:3",
  "4:3",
  "3:4",
  "1:1",
  "4:5",
  "5:4",
  "16:9",
  "9:16",
] as const;
export type OutputRatio = (typeof outputRatios)[number];
export type BorderTone = "white" | "black";

export interface WatermarkSettings {
  frameStyle: FrameStyle;
  outputRatio: OutputRatio;
  watermark: boolean;
  cardMode: boolean;
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
  "INSTAX_MINI",
  "INSTAX_SQUARE",
  "INSTAX_WIDE",
  "POLAROID",
];
