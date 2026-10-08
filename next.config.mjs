/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === "true"

const nextConfig = {
  ...(isGitHubPages
    ? {
        output: "export",
        basePath: "/SATCOM_Antenna_Project",
        assetPrefix: "/SATCOM_Antenna_Project/",
        trailingSlash: true,
      }
    : {}),
  images: {
    unoptimized: true,
  },
}

export default nextConfig
