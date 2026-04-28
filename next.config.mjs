/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === "true";

const nextConfig = {
  output: isGithubActions ? "export" : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isGithubActions ? "/huangdi-system" : undefined,
  assetPrefix: isGithubActions ? "/huangdi-system/" : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubActions ? "/huangdi-system" : "",
  },
};

export default nextConfig;
