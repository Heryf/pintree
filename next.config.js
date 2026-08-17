/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'favicon.im',
      },
    ],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: true,
    // 注意：unoptimized 会绕过 Next.js 图片优化器（按原图输出）。
    // 若希望启用自动压缩/WebP/响应式裁剪，可改为 unoptimized: false（需保证 sharp 已安装，
    // 且 remotePatterns 覆盖所有图标域名）；当前保持 true 以避免外部图标域名变化导致 500。
    unoptimized: true,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
