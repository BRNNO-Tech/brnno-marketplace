/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack config (empty is fine)
  turbopack: {},

  // Custom webpack tweaks
  webpack: (config, { dev }) => {
    // Suppress noisy filesystem cache warnings in dev on some Windows setups
    if (dev) {
      config.cache = false
    }
    return config
  },
}

module.exports = nextConfig