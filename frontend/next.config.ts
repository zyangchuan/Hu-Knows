import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a minimal standalone server bundle for small production images.
  output: "standalone",
  async rewrites() {
    const dockerProxy = process.env.NEXT_PUBLIC_API_PROXY_ORIGIN || "http://127.0.0.1";
    return [
      {
        source: "/api/user-service/:path*",
        destination: `${dockerProxy}/api/user-service/:path*`,
      },
      {
        source: "/api/via-log-service/:path*",
        destination: `${dockerProxy}/api/via-log-service/:path*`,
      },
      {
        source: "/api/game-service/:path*",
        destination: `${dockerProxy}/api/game-service/:path*`,
      },
      {
        source: "/api/game-service-demo/:path*",
        destination: `${dockerProxy}/api/game-service-demo/:path*`,
      },
    ];
  },
};

export default nextConfig;
