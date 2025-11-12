'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { PhoneOff, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { leaveBreakoutRoom, getBreakoutRoomById } from '@/action/breakoutRoom'
import {
  StreamVideoClient,
  StreamVideo,
  StreamCall,
  SpeakerLayout,
  CallControls,
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'

type Props = {
  breakoutRoomId: string
  streamCallId: string
  attendeeId: string
  attendeeName: string
  onLeave: () => void
}

export default function BreakoutRoomVideo({
  breakoutRoomId,
  streamCallId,
  attendeeId,
  attendeeName,
  onLeave,
}: Props) {
  const [client, setClient] = useState<StreamVideoClient | null>(null)
  const [call, setCall] = useState<StreamCall | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<number>(180)
  const [roomName, setRoomName] = useState<string>('')

  const handleLeave = useCallback(async () => {
    try {
      if (call) {
        await call.leave()
      }
      if (client) {
        await client.disconnectUser()
      }
      await leaveBreakoutRoom(breakoutRoomId, attendeeId)
      toast.success('Left breakout room')
      onLeave()
    } catch (error) {
      console.error('Error leaving breakout room:', error)
      toast.error('Error leaving room')
      onLeave()
    }
  }, [call, client, breakoutRoomId, attendeeId, onLeave])

  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Fetch breakout room details
        const roomResult = await getBreakoutRoomById(breakoutRoomId)
        if (roomResult.success && roomResult.breakoutRoom) {
          setRoomName(roomResult.breakoutRoom.name)
          setTimeRemaining(roomResult.breakoutRoom.callTimeLimit)
        }

        // Get Stream.io token (you'll need to implement this)
        const response = await fetch('/api/stream-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: attendeeId,
            userName: attendeeName,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to get Stream token')
        }

        const { token, apiKey } = await response.json()

        // Initialize Stream Video Client
        const streamClient = new StreamVideoClient({
          apiKey,
          user: {
            id: attendeeId,
            name: attendeeName,
          },
          token,
        })

        setClient(streamClient)

        // Join the call
        const streamCall = streamClient.call('default', streamCallId)
        await streamCall.join({ create: false })

        setCall(streamCall)
        setLoading(false)
        toast.success('Joined breakout room')
      } catch (error) {
        console.error('Error initializing call:', error)
        toast.error('Failed to join breakout room')
        setLoading(false)
      }
    }

    initializeCall()

    return () => {
      if (call) {
        call.leave().catch(console.error)
      }
      if (client) {
        client.disconnectUser().catch(console.error)
      }
    }
  }, [breakoutRoomId, streamCallId, attendeeId, attendeeName, call, client])

  // Countdown timer
  useEffect(() => {
    if (loading || !call) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleLeave()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [loading, call, handleLeave])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="size-16 rounded-full border-4 border-t-transparent border-primary animate-spin mx-auto" />
          <p className="text-lg font-medium">Joining breakout room...</p>
        </div>
      </div>
    )
  }

  if (!client || !call) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <p className="text-lg font-medium text-destructive">
            Failed to join breakout room
          </p>
          <Button onClick={onLeave}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{roomName}</h2>
            <p className="text-sm text-muted-foreground">Breakout Room</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span
                className={cn(
                  'font-medium',
                  timeRemaining < 30
                    ? 'text-destructive animate-pulse'
                    : timeRemaining < 60
                    ? 'text-amber-500'
                    : 'text-muted-foreground'
                )}
              >
                {formatTime(timeRemaining)}
              </span>
            </div>
            <Button variant="destructive" size="sm" onClick={handleLeave}>
              <PhoneOff className="h-4 w-4 mr-2" />
              Leave Room
            </Button>
          </div>
        </div>
      </div>

      {/* Video Stream */}
      <div className="flex-1 overflow-hidden">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <div className="h-full">
              <SpeakerLayout />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                <CallControls onLeave={handleLeave} />
              </div>
            </div>
          </StreamCall>
        </StreamVideo>
      </div>

      {/* Warning for time running out */}
      {timeRemaining < 30 && (
        <div className="bg-destructive text-white px-4 py-2 text-center text-sm font-medium">
          Room closing in {formatTime(timeRemaining)}
        </div>
      )}
    </div>
  )
}
