/**
 * أدوات معاينة Vercel تحقن سكربتًا من vercel.live في بيئات المعاينة فقط.
 * السماح بها لا يفتح أي باب إضافي في الإنتاج، لكنه يمنع تعطّل شريط المعاينة.
 */
const vercelLive = "https://vercel.live";

const scriptSources =
  process.env.NODE_ENV === "production"
    ? `script-src 'self' 'unsafe-inline' ${vercelLive}`
    : `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${vercelLive}`;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      scriptSources,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' https://*.supabase.co https://open.er-api.com https://cdn.jsdelivr.net ${vercelLive}`,
      `frame-src https://www.youtube.com https://www.instagram.com https://player.vimeo.com ${vercelLive}`,
      "media-src 'self' blob: https:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
