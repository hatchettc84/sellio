'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AttendedTypeEnum, CallStatusEnum } from '@prisma/client'
import { Clock, Mail } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Customer = {
  id: string
  name: string | null
  email: string
  callStatus: CallStatusEnum
  createdAt: Date
  updatedAt: Date
  Attendance: Array<{
    attendedType: AttendedTypeEnum
    joinedAt: Date
    webinarId: string
    webinar: {
      id: string
      title: string
      tags: string[]
      startTime: Date
    }
  }>
}

type Props = {
  title: string
  count: number
  customers: Customer[]
  stage: AttendedTypeEnum
}

const getStageColor = (stage: AttendedTypeEnum) => {
  const colors: Record<AttendedTypeEnum, string> = {
    [AttendedTypeEnum.REGISTERED]: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    [AttendedTypeEnum.ATTENDED]: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    [AttendedTypeEnum.ADDED_TO_CART]:
      'bg-amber-500/10 text-amber-500 border-amber-500/20',
    [AttendedTypeEnum.BREAKOUT_ROOM]:
      'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    [AttendedTypeEnum.FOLLOW_UP]: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    [AttendedTypeEnum.CONVERTED]: 'bg-green-500/10 text-green-500 border-green-500/20',
  }
  return colors[stage]
}

const CustomerCard = ({ customer }: { customer: Customer }) => {
  const latestWebinar = customer.Attendance[0]?.webinar

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {customer.name?.charAt(0).toUpperCase() || customer.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">
              {customer.name || 'Unknown'}
            </h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Mail className="h-3 w-3" />
              <span className="truncate">{customer.email}</span>
            </div>
            {latestWebinar && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground truncate">
                  {latestWebinar.title}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(customer.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            )}
            {latestWebinar?.tags && latestWebinar.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {latestWebinar.tags.slice(0, 2).map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {latestWebinar.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{latestWebinar.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function CustomerJourneyColumn({
  title,
  count,
  customers,
  stage,
}: Props) {
  return (
    <div className="flex-shrink-0 w-[300px]">
      <Card className={`h-full ${getStageColor(stage)} border-2`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-base">{title}</span>
            <Badge variant="secondary" className="ml-2">
              {count}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {customers.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No customers in this stage
            </div>
          ) : (
            customers.slice(0, 10).map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))
          )}
          {customers.length > 10 && (
            <div className="text-center text-sm text-muted-foreground pt-2">
              +{customers.length - 10} more
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
