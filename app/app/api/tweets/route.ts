import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  console.log('Fetching tweets for username:', username);
  
  if (!username) {
    console.error('No username provided');
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  if (!process.env.TWITTER_BEARER_TOKEN) {
    console.error('Twitter Bearer Token is missing');
    return NextResponse.json({ error: 'Twitter API configuration is missing' }, { status: 500 })
  }

  try {
    // First, get the user ID - Austen's ID is "745273"
    const userId = "745273"; // Hardcoded for @Austen

    // Get tweets with the v2 API
    const tweetsResponse = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?` + 
      'expansions=author_id,referenced_tweets.id,attachments.media_keys&' +
      'tweet.fields=created_at,conversation_id,in_reply_to_user_id,referenced_tweets,text,public_metrics&' +
      'user.fields=name,username,profile_image_url,verified&' +
      'media.fields=url,preview_image_url',
      {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('Tweets response:', tweetsResponse.status);
    const tweetsData = await tweetsResponse.json()
    console.log('Tweets data:', tweetsData);

    if (tweetsData.errors) {
      console.error('Twitter API errors:', tweetsData.errors);
      return NextResponse.json({ error: tweetsData.errors[0].message }, { status: 500 })
    }

    if (!tweetsData.data) {
      return NextResponse.json({ error: 'No tweets found' }, { status: 404 })
    }

    // Combine tweets with author information
    if (tweetsData.includes?.users) {
      tweetsData.data = tweetsData.data.map((tweet: any) => ({
        ...tweet,
        author: tweetsData.includes.users.find((user: any) => user.id === tweet.author_id),
        media: tweet.attachments?.media_keys?.map((key: string) => 
          tweetsData.includes.media?.find((m: any) => m.media_key === key)
        ).filter(Boolean)
      }))
    }

    return NextResponse.json(tweetsData)
  } catch (error) {
    console.error('Failed to fetch tweets:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch tweets'
    }, { status: 500 })
  }
} 