'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Clock, Video, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { getBreakoutRoomsByWebinar, joinBreakoutRoom, closeBreakoutRoom } from '@/action/breakoutRoom'

type BreakoutRoom = {
  id: string
  name: string
  description?: string | null
  maxParticipants: number
  callTimeLimit: number
  enableRecording: boolean
  streamCallId?: string | null
  participants: Array<{
    id: string
    attendeeId: string
    joinedAt: Date
    leftAt?: Date | null
  }>
}

type Props = {
  webinarId: string
  attendeeId: string
  onJoinRoom: (roomId: string, streamCallId: string) => void
  onCreateRoom?: () => void
  isHost?: boolean
}

export default function BreakoutRoomList({
  webinarId,
  attendeeId,
  onJoinRoom,
  onCreateRoom,
  isHost = false,
}: Props) {
  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null)

  const fetchBreakoutRooms = async () => {
    setLoading(true)
    const result = await getBreakoutRoomsByWebinar(webinarId)

    if (result.success && result.breakoutRooms) {
      setBreakoutRooms(result.breakoutRooms as BreakoutRoom[])
    } else {
      toast.error(result.error || 'Failed to fetch breakout rooms')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBreakoutRooms()

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchBreakoutRooms, 5000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webinarId])

  const handleJoinRoom = async (roomId: string) => {
    setJoiningRoomId(roomId)
    const result = await joinBreakoutRoom(roomId, attendeeId)

    if (result.success && result.streamCallId) {
      toast.success('Joining breakout room...')
      onJoinRoom(roomId, result.streamCallId)
    } else {
      toast.error(result.error || 'Failed to join breakout room')
    }
    setJoiningRoomId(null)
  }

  const handleCloseRoom = async (roomId: string) => {
    const result = await closeBreakoutRoom(roomId)

    if (result.success) {
      toast.success('Breakout room closed')
      fetchBreakoutRooms()
    } else {
      toast.error(result.error || 'Failed to close breakout room')
    }
  }

  const getActiveParticipantCount = (room: BreakoutRoom) => {
    return room.participants.filter((p) => !p.leftAt).length
  }

  const isRoomFull = (room: BreakoutRoom) => {
    return getActiveParticipantCount(room) >= room.maxParticipants
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} min${mins !== 1 ? 's' : ''}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="size-8 rounded-full border-4 border-t-transparent border-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Breakout Rooms</h3>
          <p className="text-sm text-muted-foreground">
            Join a room for smaller group discussions
          </p>
        </div>
        {isHost && onCreateRoom && (
          <Button onClick={onCreateRoom} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Room
          </Button>
        )}
      </div>

      {breakoutRooms.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No breakout rooms available yet
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {breakoutRooms.map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{room.name}</CardTitle>
                    {room.description && (
                      <CardDescription className="mt-1">
                        {room.description}
                      </CardDescription>
                    )}
                  </div>
                  {isHost && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCloseRoom(room.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {getActiveParticipantCount(room)}/{room.maxParticipants}
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(room.callTimeLimit)}
                  </Badge>
                  {room.enableRecording && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      Recording
                    </Badge>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={isRoomFull(room) || joiningRoomId === room.id}
                >
                  {joiningRoomId === room.id ? (
                    <>
                      <div className="size-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2" />
                      Joining...
                    </>
                  ) : isRoomFull(room) ? (
                    'Room Full'
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      Join Room
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
