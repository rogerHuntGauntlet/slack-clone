import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID,
  },
  API: {
    endpoints: [
      {
        name: "chatAPI",
        endpoint: process.env.NEXT_PUBLIC_AWS_API_ENDPOINT,
        region: process.env.NEXT_PUBLIC_AWS_REGION
      },
    ]
  }
});

