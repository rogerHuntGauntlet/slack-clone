/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME,
    DYNAMODB_CHANNELS_TABLE_NAME: process.env.DYNAMODB_CHANNELS_TABLE_NAME,
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
    NEXT_PUBLIC_AWS_USER_POOL_ID: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID,
    NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID: process.env.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID,
    NEXT_PUBLIC_AWS_API_ENDPOINT: process.env.NEXT_PUBLIC_AWS_API_ENDPOINT,
  },
}

module.exports = nextConfig

