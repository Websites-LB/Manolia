import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

/**
 * Sent with every page. The site loads nothing from other origins (fonts are self-hosted by next/font,
 * the art is drawn in the browser), so the policy can be strict: no framing, no third-party scripts,
 * forms only post back to us. Next's own inline bootstrap needs 'unsafe-inline'; dev also needs eval and a socket.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  `connect-src 'self'${dev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Lets a production build run alongside `next dev` without sharing .next/.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  // photographs are served in the smallest format the browser takes, and cached for a month once resized
  images: { formats: ["image/avif", "image/webp"], minimumCacheTTL: 60 * 60 * 24 * 30 },
  // only the parts of these libraries that are used end up in the bundle
  experimental: { optimizePackageImports: ["lucide-react", "gsap"] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), payment=(), microphone=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
      // files that never change keep for a year
      { source: "/art/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      // order, request and board pages carry private details: never cached, never indexed
      { source: "/(order|request|atelier|checkout|pay|note)/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
