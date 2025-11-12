import PageHeader from '@/components/ReusableComponent/PageHeader'
import { Users, TrendingUp, CheckCircle2, ArrowLeft } from 'lucide-react'
import React from 'react'
import { getConvertedCustomers, getCustomerStats } from '@/action/customers'
import { redirect } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <CheckCircle2 className="w-12 h-12 text-muted-foreground" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">No converted customers yet</h3>
        <p className="text-sm text-muted-foreground">
          Your converted customers will appear here once they complete a purchase
        </p>
      </div>
    </div>
  )
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
  const [customersResponse, statsResponse] = await Promise.all([
    getConvertedCustomers(),
    getCustomerStats(),
  ])

  if (customersResponse.status === 403 || statsResponse.status === 403) {
    redirect('/sign-in')
  }

  if (customersResponse.status !== 200 || !customersResponse.customers) {
    return <div>Error loading converted customers</div>
  }

  if (statsResponse.status !== 200 || !statsResponse.stats) {
    return <div>Error loading stats</div>
  }

  const customers = customersResponse.customers
  const stats = statsResponse.stats

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Journey
          </Button>
        </Link>
      </div>

      <PageHeader
        leftIcon={<CheckCircle2 className="w-4 h-4" />}
        mainIcon={<Users className="w-12 h-12" />}
        rightIcon={<TrendingUp className="w-3 h-3" />}
        heading="See the list of your current customers"
        placeholder="Search customer..."
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Converted"
          value={stats.converted}
          description="Successfully converted customers"
          icon={CheckCircle2}
        />
        <StatsCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          description={`${stats.converted} of ${stats.totalLeads} leads`}
          icon={TrendingUp}
        />
        <StatsCard
          title="Total Leads"
          value={stats.totalLeads}
          description="All registered attendees"
          icon={Users}
        />
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Converted Customers</CardTitle>
            <CardDescription>
              All customers who have successfully completed a purchase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm text-muted-foreground">Customer</TableHead>
                  <TableHead className="text-sm text-muted-foreground">Email</TableHead>
                  <TableHead className="text-sm text-muted-foreground">
                    Webinar
                  </TableHead>
                  <TableHead className="text-sm text-muted-foreground">Tags</TableHead>
                  <TableHead className="text-sm text-muted-foreground">
                    Converted
                  </TableHead>
                  <TableHead className="text-right text-sm text-muted-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => {
                  const latestWebinar = customer.Attendance[0]?.webinar
                  return (
                    <TableRow key={customer.id} className="border-0">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {customer.name?.charAt(0).toUpperCase() ||
                                customer.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {customer.name || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {customer.email}
                      </TableCell>
                      <TableCell>
                        {latestWebinar && (
                          <div>
                            <p className="text-sm font-medium">{latestWebinar.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(latestWebinar.startTime), 'MMM d, yyyy')}
                            </p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {latestWebinar?.tags.slice(0, 2).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {latestWebinar && latestWebinar.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{latestWebinar.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(customer.updatedAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-500 border-green-500/20"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Converted
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default page
