import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware.ts file ensures Next.js properly generates the middleware-manifest.json
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: []
}
