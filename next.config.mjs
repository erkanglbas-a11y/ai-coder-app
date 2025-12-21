/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Bazen WebContainer mount işlemlerinde double-invoke sorununu önlemek için kapatılabilir
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;