/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === "true";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isGithubActions ? "/huangdi-system" : undefined,
  assetPrefix: isGithubActions ? "/huangdi-system/" : undefined,
};

export default nextConfig;
