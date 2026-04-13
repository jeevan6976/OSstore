/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  // Server-side only env vars (no NEXT_PUBLIC_ prefix) — never sent to browser
  env: {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  },
};

module.exports = nextConfig;
