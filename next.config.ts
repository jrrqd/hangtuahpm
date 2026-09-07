import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/hangtuahpm",
  assetPrefix: "/hangtuahpm",
  images: {
    // Brand/hero assets are served from public/brand (no remote hotlinking).
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
