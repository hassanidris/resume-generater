/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      //   {
      //     protocol: "https",
      //     hostname: "picsum.photos",
      //   },
      //   {
      //     protocol: "http",
      //     hostname: "unsplash.com",
      //   },
    ],
  },
};

export default nextConfig;
