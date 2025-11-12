'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { createBreakoutRoom } from '@/action/breakoutRoom'

type Props = {
  webinarId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoomCreated?: () => void
}

export default function CreateBreakoutRoomDialog({
  webinarId,
  open,
  onOpenChange,
  onRoomCreated,
}: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [maxParticipants, setMaxParticipants] = useState(10)
  const [callTimeLimit, setCallTimeLimit] = useState(180) // 3 minutes in seconds
  const [enableRecording, setEnableRecording] = useState(false)
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a room name')
      return
    }

    if (maxParticipants < 2 || maxParticipants > 50) {
      toast.error('Max participants must be between 2 and 50')
      return
    }

    if (callTimeLimit < 60 || callTimeLimit > 3600) {
      toast.error('Call time limit must be between 1 and 60 minutes')
      return
    }

    setCreating(true)
    const result = await createBreakoutRoom(
      webinarId,
      name,
      description || undefined,
      maxParticipants,
      callTimeLimit,
      enableRecording
    )

    if (result.success) {
      toast.success('Breakout room created successfully')
      onOpenChange(false)
      resetForm()
      onRoomCreated?.()
    } else {
      toast.error(result.error || 'Failed to create breakout room')
    }
    setCreating(false)
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setMaxParticipants(10)
    setCallTimeLimit(180)
    setEnableRecording(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Breakout Room</DialogTitle>
          <DialogDescription>
            Set up a new breakout room for smaller group discussions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Room Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Team Discussion 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description of the room's purpose"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                min={2}
                max={50}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 10)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="callTimeLimit">Time Limit (minutes)</Label>
              <Input
                id="callTimeLimit"
                type="number"
                min={1}
                max={60}
                value={Math.floor(callTimeLimit / 60)}
                onChange={(e) =>
                  setCallTimeLimit((parseInt(e.target.value) || 3) * 60)
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enableRecording">Enable Recording</Label>
              <p className="text-sm text-muted-foreground">
                Record the breakout room session
              </p>
            </div>
            <Switch
              id="enableRecording"
              checked={enableRecording}
              onCheckedChange={setEnableRecording}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? (
              <>
                <div className="size-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Room'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
