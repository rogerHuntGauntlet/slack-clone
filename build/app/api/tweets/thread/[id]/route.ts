import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const tweetId = params.id

  if (!tweetId) {
    return NextResponse.json({ error: 'Tweet ID is required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}/conversation?expansions=author_id,referenced_tweets.id&user.fields=profile_image_url`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
      }
    )

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 })
  }
} 