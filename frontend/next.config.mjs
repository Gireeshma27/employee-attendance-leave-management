/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
