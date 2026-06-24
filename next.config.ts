import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const nextConfig: NextConfig = {
  basePath: "/gr-watermark",
  output: "export",
  images: { unoptimized: true },
  outputFileTracingRoot: process.cwd(),
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/gr-watermark",
  skipWaiting: true,
});

export default withNextIntl(withPWA(nextConfig));
