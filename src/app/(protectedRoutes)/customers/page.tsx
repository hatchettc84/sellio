import PageHeader from '@/components/ReusableComponent/PageHeader'
import { Users, TrendingUp, Target, BarChart3 } from 'lucide-react'
import React from 'react'
import { getCustomerJourney, getCustomerStats } from '@/action/customers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CustomerJourneyColumn from './_components/CustomerJourneyColumn'
import { AttendedTypeEnum } from '@prisma/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const formatStageTitle = (stage: AttendedTypeEnum): string => {
  const titles: Record<AttendedTypeEnum, string> = {
    [AttendedTypeEnum.REGISTERED]: 'Registered',
    [AttendedTypeEnum.ATTENDED]: 'Attended',
    [AttendedTypeEnum.ADDED_TO_CART]: 'Added to Cart',
    [AttendedTypeEnum.BREAKOUT_ROOM]: 'Breakout Room',
    [AttendedTypeEnum.FOLLOW_UP]: 'Follow Up',
    [AttendedTypeEnum.CONVERTED]: 'Converted',
  }
  return titles[stage]
}

const StatsCard = ({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
)

const page = async () => {
  const [journeyResponse, statsResponse] = await Promise.all([
    getCustomerJourney(),
    getCustomerStats(),
  ])

  if (journeyResponse.status === 403 || statsResponse.status === 403) {
    redirect('/sign-in')
  }

  if (journeyResponse.status !== 200 || !journeyResponse.data) {
    return <div>Error loading customer journey</div>
  }

  if (statsResponse.status !== 200 || !statsResponse.stats) {
    return <div>Error loading stats</div>
  }

  const { journeyData, metrics } = journeyResponse.data
  const stats = statsResponse.stats

  return (
    <div className="w-full flex flex-col gap-8">
      <PageHeader
        leftIcon={<Users className="w-4 h-4" />}
        mainIcon={<Users className="w-12 h-12" />}
        rightIcon={<TrendingUp className="w-3 h-3" />}
        heading="See how far along are your potential customers"
        placeholder="Search customer..."
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Leads"
          value={stats.totalLeads}
          description="All registered attendees"
          icon={Users}
        />
        <StatsCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          description={`${stats.converted} of ${stats.totalLeads} converted`}
          icon={TrendingUp}
        />
        <StatsCard
          title="In Pipeline"
          value={stats.inProgress}
          description="Active in journey"
          icon={Target}
        />
        <StatsCard
          title="Webinars"
          value={stats.webinarCount}
          description="Total webinars created"
          icon={BarChart3}
        />
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer Journey Pipeline</CardTitle>
              <CardDescription>
                Track your customers progress through the conversion funnel
              </CardDescription>
            </div>
            <Link href="/customers/converted">
              <Button variant="outline">
                View Converted Customers
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="text-sm text-muted-foreground">
              Total Customers: <span className="font-semibold text-foreground">{metrics.totalCustomers}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Conversion Rate: <span className="font-semibold text-foreground">{metrics.conversionRate}%</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Converted: <span className="font-semibold text-foreground">{metrics.converted}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journey Columns */}
      <div className="flex overflow-x-auto pb-4 gap-4 md:gap-6">
        {Object.entries(journeyData).map(([stage, data]) => (
          <CustomerJourneyColumn
            key={stage}
            title={formatStageTitle(stage as AttendedTypeEnum)}
            count={data.count}
            customers={data.customers}
            stage={stage as AttendedTypeEnum}
          />
        ))}
      </div>
    </div>
  )
}

export default page
