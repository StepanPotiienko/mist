import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens, getGoogleAuthUrl } from "@/lib/google-calendar"
import { saveCredential } from "@/lib/credentials"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")

  // Step 1: Redirect to Google OAuth if no code
  if (!code) {
    const authUrl = getGoogleAuthUrl()
    return NextResponse.redirect(authUrl)
  }

  // Step 2: Exchange code for tokens
  try {
    const tokens = await exchangeCodeForTokens(code)
    await saveCredential("google", tokens)
    return NextResponse.redirect(new URL("/settings?connected=google", req.url))
  } catch (err) {
    return NextResponse.redirect(
      new URL(`/settings?error=google_auth_failed&detail=${encodeURIComponent(String(err))}`, req.url)
    )
  }
}
