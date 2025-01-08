import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const workspaceId = requestUrl.searchParams.get('workspaceId')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Include workspaceId in redirect if it exists
  const redirectUrl = new URL('/platform', requestUrl.origin)
  if (workspaceId) {
    redirectUrl.searchParams.set('workspaceId', workspaceId)
  }
  
  return NextResponse.redirect(redirectUrl)
}

