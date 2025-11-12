import { NextRequest, NextResponse } from 'next/server'
import { StreamClient } from '@stream-io/node-sdk'

const streamApiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!
const streamSecret = process.env.STREAM_SECRET!

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Create Stream client
    const streamClient = new StreamClient(streamApiKey, streamSecret)

    // Generate token for user
    const token = streamClient.generateUserToken({ user_id: userId })

    return NextResponse.json({
      token,
      apiKey: streamApiKey,
      userId,
    })
  } catch (error) {
    console.error('Error generating Stream token:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}
