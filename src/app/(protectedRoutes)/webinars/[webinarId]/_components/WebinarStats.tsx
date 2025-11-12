'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users, TrendingUp, DollarSign, Target } from 'lucide-react'
import { type Webinar } from '@prisma/client'
import { type AttendanceData } from '@/lib/type'

type Props = {
  webinar: Webinar
  attendanceData: Record<string, AttendanceData>
}

const WebinarStats = ({ attendanceData }: Props) => {
  // Calculate stats from attendance data
  const totalAttendees = Object.values(attendanceData).reduce((sum, data) => sum + data.count, 0)
  const converted = attendanceData.CONVERTED?.count || 0
  const registered = attendanceData.REGISTERED?.count || 0
  const conversionRate = totalAttendees > 0 ? ((converted / totalAttendees) * 100).toFixed(1) : '0'

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Attendees</p>
              <p className="text-2xl font-bold">{totalAttendees}</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Registered</p>
              <p className="text-2xl font-bold">{registered}</p>
            </div>
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold">{conversionRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Converted</p>
              <p className="text-2xl font-bold">{converted}</p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default WebinarStats

