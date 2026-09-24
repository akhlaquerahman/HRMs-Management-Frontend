/** @type {import('next').NextConfig} */
const nextConfig = {
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      preventFullImport: true,
    },
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
