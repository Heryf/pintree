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
    // 启用 Next.js 图片优化器：
    // 1. 服务端按需下载外部 favicon 并转 WebP（体积减小 50-80%），客户端下载更快
    // 2. 优化器内部带缓存，同一图标只下载一次，后续请求直接走 CDN/缓存
    // 3. 避免浏览器直连外部域名的逐个 DNS+TLS 握手导致的"一段一段加载"
    // sharp 随 next 一起安装，无需额外配置
    unoptimized: false,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
