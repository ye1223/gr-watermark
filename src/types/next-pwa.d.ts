declare module "next-pwa" {
  import type { NextConfig } from "next";

  export default function withPWAInit(options: {
    dest: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    skipWaiting?: boolean;
  }): (config: NextConfig) => NextConfig;
}
