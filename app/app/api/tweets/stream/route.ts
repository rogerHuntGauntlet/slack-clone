import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  // Set headers for SSE
  const encoder = new TextEncoder()
  const customReadable = new ReadableStream({
    start(controller) {
      // Function to check for new tweets
      const checkNewTweets = async () => {
        try {
          const response = await fetch(
            `https://api.twitter.com/2/users/745273/tweets?` + 
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

          const data = await response.json()
          
          if (data.data?.[0]) {
            // Send the latest tweet if it's new
            const message = encoder.encode(`data: ${JSON.stringify(data.data[0])}\n\n`)
            controller.enqueue(message)
          }
        } catch (error) {
          console.error('Error checking for new tweets:', error)
        }
      }

      // Check for new tweets every 2 minutes
      const interval = setInterval(checkNewTweets, 120000)

      // Cleanup
      return () => {
        clearInterval(interval)
      }
    }
  })

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
} 