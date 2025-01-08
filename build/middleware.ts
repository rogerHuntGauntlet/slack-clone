import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get the workspaceId from the URL if it exists
  const url = new URL(req.url)
  const workspaceId = url.searchParams.get('workspaceId')

  if (req.nextUrl.pathname.startsWith('/platform')) {
    if (!session) {
      // Preserve the workspaceId when redirecting to auth
      const redirectUrl = new URL('/auth', req.url)
      if (workspaceId) {
        redirectUrl.searchParams.set('workspaceId', workspaceId)
      }
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: ['/platform/:path*'],
}

