import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = "/cineapplication";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : undefined,
  basePath: isGithubPages ? repoName : "",
  assetPrefix: isGithubPages ? `${repoName}/` : undefined,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["@electric-sql/pglite", "@neondatabase/serverless", "pg"],
};

export default nextConfig;
