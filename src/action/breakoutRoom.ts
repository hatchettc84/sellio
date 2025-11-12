'use server'

import { prismaClient } from '@/lib/prismaClient'
import { BreakoutRoomStatus } from '@prisma/client'
import { StreamClient } from '@stream-io/node-sdk'

const streamApiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!
const streamSecret = process.env.STREAM_SECRET!

const streamClient = new StreamClient(streamApiKey, streamSecret)

export const createBreakoutRoom = async (
  webinarId: string,
  name: string,
  description?: string,
  maxParticipants: number = 10,
  callTimeLimit: number = 180,
  enableRecording: boolean = false
) => {
  try {
    // Create Stream.io call for the breakout room
    const callId = `breakout-${webinarId}-${Date.now()}`
    const call = streamClient.video.call('default', callId)

    await call.getOrCreate({
      data: {
        created_by_id: 'system',
        settings_override: {
          audio: {
            mic_default_on: true,
          },
          video: {
            camera_default_on: false,
          },
        },
      },
    })

    // Create breakout room in database
    const breakoutRoom = await prismaClient.breakoutRoom.create({
      data: {
        webinarId,
        name,
        description,
        maxParticipants,
        streamCallId: callId,
        callTimeLimit,
        enableRecording,
      },
      include: {
        participants: true,
        webinar: {
          include: {
            presenter: true,
          },
        },
      },
    })

    return {
      success: true,
      breakoutRoom,
    }
  } catch (error) {
    console.error('Error creating breakout room:', error)
    return {
      success: false,
      error: 'Failed to create breakout room',
    }
  }
}

export const getBreakoutRoomsByWebinar = async (webinarId: string) => {
  try {
    const breakoutRooms = await prismaClient.breakoutRoom.findMany({
      where: {
        webinarId,
        status: BreakoutRoomStatus.ACTIVE,
      },
      include: {
        participants: true,
        webinar: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      breakoutRooms,
    }
  } catch (error) {
    console.error('Error fetching breakout rooms:', error)
    return {
      success: false,
      error: 'Failed to fetch breakout rooms',
    }
  }
}

export const getBreakoutRoomById = async (breakoutRoomId: string) => {
  try {
    const breakoutRoom = await prismaClient.breakoutRoom.findUnique({
      where: {
        id: breakoutRoomId,
      },
      include: {
        participants: true,
        webinar: {
          include: {
            presenter: true,
          },
        },
      },
    })

    if (!breakoutRoom) {
      return {
        success: false,
        error: 'Breakout room not found',
      }
    }

    return {
      success: true,
      breakoutRoom,
    }
  } catch (error) {
    console.error('Error fetching breakout room:', error)
    return {
      success: false,
      error: 'Failed to fetch breakout room',
    }
  }
}

export const joinBreakoutRoom = async (
  breakoutRoomId: string,
  attendeeId: string,
  isModerator: boolean = false
) => {
  try {
    // Check if breakout room exists and is active
    const breakoutRoom = await prismaClient.breakoutRoom.findUnique({
      where: {
        id: breakoutRoomId,
      },
      include: {
        participants: true,
      },
    })

    if (!breakoutRoom) {
      return {
        success: false,
        error: 'Breakout room not found',
      }
    }

    if (breakoutRoom.status !== BreakoutRoomStatus.ACTIVE) {
      return {
        success: false,
        error: 'Breakout room is closed',
      }
    }

    // Check if room is full
    const activeParticipants = breakoutRoom.participants.filter(
      (p) => !p.leftAt
    ).length

    if (activeParticipants >= breakoutRoom.maxParticipants) {
      return {
        success: false,
        error: 'Breakout room is full',
      }
    }

    // Check if participant is already in the room
    const existingParticipant = await prismaClient.breakoutRoomParticipant.findUnique({
      where: {
        breakoutRoomId_attendeeId: {
          breakoutRoomId,
          attendeeId,
        },
      },
    })

    if (existingParticipant && !existingParticipant.leftAt) {
      return {
        success: false,
        error: 'Already in breakout room',
      }
    }

    // Create or update participant
    const participant = await prismaClient.breakoutRoomParticipant.upsert({
      where: {
        breakoutRoomId_attendeeId: {
          breakoutRoomId,
          attendeeId,
        },
      },
      create: {
        breakoutRoomId,
        attendeeId,
        isModerator,
        joinedAt: new Date(),
      },
      update: {
        leftAt: null,
        joinedAt: new Date(),
      },
    })

    // Update attendance type to BREAKOUT_ROOM
    const attendee = await prismaClient.attendee.findUnique({
      where: { id: attendeeId },
      include: { Attendance: true },
    })

    if (attendee && attendee.Attendance.length > 0) {
      await prismaClient.attendance.updateMany({
        where: {
          attendeeId,
          webinarId: breakoutRoom.webinarId,
        },
        data: {
          attendedType: 'BREAKOUT_ROOM',
        },
      })
    }

    return {
      success: true,
      participant,
      streamCallId: breakoutRoom.streamCallId,
    }
  } catch (error) {
    console.error('Error joining breakout room:', error)
    return {
      success: false,
      error: 'Failed to join breakout room',
    }
  }
}

export const leaveBreakoutRoom = async (
  breakoutRoomId: string,
  attendeeId: string
) => {
  try {
    const participant = await prismaClient.breakoutRoomParticipant.updateMany({
      where: {
        breakoutRoomId,
        attendeeId,
        leftAt: null,
      },
      data: {
        leftAt: new Date(),
      },
    })

    if (participant.count === 0) {
      return {
        success: false,
        error: 'Participant not found in breakout room',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error leaving breakout room:', error)
    return {
      success: false,
      error: 'Failed to leave breakout room',
    }
  }
}

export const closeBreakoutRoom = async (breakoutRoomId: string) => {
  try {
    // Update all active participants to mark them as left
    await prismaClient.breakoutRoomParticipant.updateMany({
      where: {
        breakoutRoomId,
        leftAt: null,
      },
      data: {
        leftAt: new Date(),
      },
    })

    // Close the breakout room
    const breakoutRoom = await prismaClient.breakoutRoom.update({
      where: {
        id: breakoutRoomId,
      },
      data: {
        status: BreakoutRoomStatus.CLOSED,
      },
    })

    // End the Stream.io call
    if (breakoutRoom.streamCallId) {
      try {
        const call = streamClient.video.call('default', breakoutRoom.streamCallId)
        await call.endCall()
      } catch (error) {
        console.error('Error ending Stream.io call:', error)
      }
    }

    return {
      success: true,
      breakoutRoom,
    }
  } catch (error) {
    console.error('Error closing breakout room:', error)
    return {
      success: false,
      error: 'Failed to close breakout room',
    }
  }
}

export const getBreakoutRoomParticipants = async (breakoutRoomId: string) => {
  try {
    const participants = await prismaClient.breakoutRoomParticipant.findMany({
      where: {
        breakoutRoomId,
        leftAt: null,
      },
      orderBy: {
        joinedAt: 'asc',
      },
    })

    return {
      success: true,
      participants,
    }
  } catch (error) {
    console.error('Error fetching breakout room participants:', error)
    return {
      success: false,
      error: 'Failed to fetch participants',
    }
  }
}

export const deleteBreakoutRoom = async (breakoutRoomId: string) => {
  try {
    // First close the room if it's still active
    const breakoutRoom = await prismaClient.breakoutRoom.findUnique({
      where: { id: breakoutRoomId },
    })

    if (breakoutRoom?.status === BreakoutRoomStatus.ACTIVE) {
      await closeBreakoutRoom(breakoutRoomId)
    }

    // Delete the breakout room (cascade will delete participants)
    await prismaClient.breakoutRoom.delete({
      where: {
        id: breakoutRoomId,
      },
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error deleting breakout room:', error)
    return {
      success: false,
      error: 'Failed to delete breakout room',
    }
  }
}
