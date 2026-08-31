import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["canvas", "pdfjs-dist", "@pdfme/ui", "@pdfme/converter", "clawpdf"],
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        "fs/promises": false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
        module: false,
        url: false,
        worker_threads: false,
        child_process: false,
        net: false,
        tls: false,
        zlib: false,
        http: false,
        https: false,
        os: false,
        canvas: false,
      };

      // Strip node: prefix for all node: built-in modules in browser bundles
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: any) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );
    }
    return config;
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8001";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/storage/:path*",
        destination: `${backendUrl}/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;
