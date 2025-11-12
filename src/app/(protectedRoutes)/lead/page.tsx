import LeadIcon from '@/icons/LeadIcon'
import PipelineIcon from '@/icons/PipelineIcon'
import React from 'react'
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
import PageHeader from '@/components/ReusableComponent/PageHeader'
import { Webcam, Users, Mail, TrendingUp } from 'lucide-react'
import { getLeads } from '@/action/leads'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <Users className="w-12 h-12 text-muted-foreground" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">No leads yet</h3>
        <p className="text-sm text-muted-foreground">
          Your leads will appear here once people register for your webinars
        </p>
      </div>
    </div>
  )
}

const page = async () => {
  const response = await getLeads()

  if (response.status === 403) {
    redirect('/sign-in')
  }

  if (response.status !== 200 || !response.leads) {
    return <div>Error loading leads</div>
  }

  return (
    <div className="w-full flex flex-col gap-8">
      <PageHeader
        leftIcon={<Webcam className="w-3 h-3" />}
        mainIcon={<LeadIcon className="w-12 h-12" />}
        rightIcon={<PipelineIcon className="w-3 h-3" />}
        heading="The home to all your customers"
        placeholder="Search customer..."
      />

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{response.leads.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered attendees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Tags</CardTitle>
            <Badge className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {response.leads.filter((l: { tags: string[] }) => l.tags?.length > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Tagged customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/customers">
              <Button variant="outline" size="sm" className="w-full">
                View Customer Journey
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      {response.leads.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Leads</CardTitle>
            <CardDescription>
              Complete list of registered webinar attendees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm text-muted-foreground">
                    Customer
                  </TableHead>
                  <TableHead className="text-sm text-muted-foreground">
                    Email
                  </TableHead>
                  <TableHead className="text-sm text-muted-foreground">
                    Phone
                  </TableHead>
                  <TableHead className="text-right text-sm text-muted-foreground">
                    Tags
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {response.leads?.map((lead: { name: string | null; email: string; phone: string; tags: string[] }, idx: number) => (
                  <TableRow
                    key={idx}
                    className="border-0"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {lead?.name?.charAt(0).toUpperCase() || lead?.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{lead?.name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {lead?.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead?.phone || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {lead?.tags?.slice(0, 2).map((tag: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {lead?.tags?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{lead.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
export default page
