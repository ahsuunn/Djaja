/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Disable server-side features for Tauri
  trailingSlash: true,
}

module.exports = nextConfig
