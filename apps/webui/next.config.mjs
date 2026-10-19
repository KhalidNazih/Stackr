/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },

  // Proxy /backend/* → FastAPI so the browser never calls the cluster IP directly.
  // BACKEND_URL is server-side only (never baked into the client bundle).
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL
    if (!backendUrl) {
      console.warn('[Next.js] WARNING: Neither BACKEND_URL nor NEXT_PUBLIC_API_URL is set. API rewrites may fail if backend is unreachable.')
    }
    return [
      {
        source: '/backend/:path*',
        destination: `${backendUrl || 'http://platform-api-svc.admin:8000'}/:path*`,
      },
    ]
  },
}

export default nextConfig
