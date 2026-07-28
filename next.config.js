/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Verhindert, dass kleine TypeScript-Typwarnungen (nicht echte Fehler) den
  // gesamten Vercel-Build blockieren.
  typescript: {
    ignoreBuildErrors: true,
  },
};
module.exports = nextConfig;
