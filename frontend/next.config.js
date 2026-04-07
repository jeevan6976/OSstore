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
  // GITHUB_TOKEN is server-side only (no NEXT_PUBLIC_ prefix) — safe
  env: {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  },
};

module.exports = nextConfig;
