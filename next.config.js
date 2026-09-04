/** @type {import('next').NextConfig} */
// the main MOGI site is plain static HTML in public/ — serve it at the root.
// the Drop 0 app lives under /drop0.
const nextConfig = {
  async rewrites() {
    return [{ source: '/', destination: '/index.html' }]
  },
}
module.exports = nextConfig
