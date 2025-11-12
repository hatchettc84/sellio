'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WebinarStatusEnum, type Webinar } from '@prisma/client'
import { changeWebinarStatus } from '@/action/webinar'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Play, Square, MoreVertical } from 'lucide-react'

type Props = {
  webinar: Webinar
}

const WebinarStatusActions = ({ webinar }: Props) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleStatusChange = async (newStatus: WebinarStatusEnum) => {
    setIsLoading(true)
    try {
      const result = await changeWebinarStatus(webinar.id, newStatus)
      if (result.success) {
        toast.success(result.message || 'Webinar status updated')
        router.refresh()
      } else {
        toast.error(result.message || 'Failed to update status')
      }
    } catch (error) {
      toast.error('An error occurred while updating the status')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusActions = () => {
    switch (webinar.webinarStatus) {
      case WebinarStatusEnum.SCHEDULED:
        return [
          {
            label: 'Start Webinar',
            status: WebinarStatusEnum.LIVE,
            icon: Play,
            variant: 'default' as const,
          },
          {
            label: 'Cancel',
            status: WebinarStatusEnum.CANCELLED,
            icon: Square,
            variant: 'destructive' as const,
          },
        ]
      case WebinarStatusEnum.LIVE:
        return [
          {
            label: 'End Webinar',
            status: WebinarStatusEnum.ENDED,
            icon: Square,
            variant: 'destructive' as const,
          },
        ]
      case WebinarStatusEnum.ENDED:
      case WebinarStatusEnum.CANCELLED:
        return []
      default:
        return []
    }
  }

  const actions = getStatusActions()

  if (actions.length === 0) {
    return null
  }

  if (actions.length === 1) {
    const action = actions[0]
    const Icon = action.icon
    return (
      <Button
        variant={action.variant}
        onClick={() => handleStatusChange(action.status)}
        disabled={isLoading}
      >
        <Icon className="mr-2 h-4 w-4" />
        {action.label}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
          <MoreVertical className="mr-2 h-4 w-4" />
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <DropdownMenuItem
              key={action.status}
              onClick={() => handleStatusChange(action.status)}
              className={action.variant === 'destructive' ? 'text-destructive' : ''}
            >
              <Icon className="mr-2 h-4 w-4" />
              {action.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default WebinarStatusActions

