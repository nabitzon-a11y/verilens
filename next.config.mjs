/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // 주의: X-Frame-Options / frame-ancestors 는 설정하지 않습니다.
          // Pi Sandbox(데스크톱 개발 환경)는 앱을 iframe 안에서 로드하므로
          // 프레임을 막으면 샌드박스 테스트가 깨집니다.
        ],
      },
    ];
  },
};

export default nextConfig;
