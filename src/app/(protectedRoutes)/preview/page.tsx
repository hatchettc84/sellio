'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Webcam, Calendar, Clock, Users, DollarSign, ArrowRight, Eye } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'

/**
 * Preview page showing what customers see when they visit a webinar
 * This is a mock/preview version of the customer-facing portal
 */
const PreviewPage = () => {
  const [selectedWebinar, setSelectedWebinar] = useState<'upcoming' | 'live' | 'ended'>('upcoming')

  // Mock webinar data for preview
  const mockWebinars = {
    upcoming: {
      id: 'preview-upcoming',
      title: 'Introduction to AI-Powered Sales Automation',
      description:
        'Learn how to leverage AI to automate your sales process and increase conversion rates. Join us for an interactive session with live Q&A.',
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      thumbnail: '/placeholder.svg?height=400&width=600',
      presenter: {
        name: 'John Smith',
        title: 'Sales Automation Expert',
        image: '/placeholder.svg?height=100&width=100',
      },
      tags: ['AI', 'Sales', 'Automation'],
      price: 49.99,
      ctaLabel: 'Register Now',
      attendeeCount: 127,
    },
    live: {
      id: 'preview-live',
      title: 'Advanced Webinar Marketing Strategies',
      description: 'Real-time strategies for maximizing your webinar ROI and audience engagement.',
      startTime: new Date(),
      thumbnail: '/placeholder.svg?height=400&width=600',
      presenter: {
        name: 'Sarah Johnson',
        title: 'Marketing Strategist',
        image: '/placeholder.svg?height=100&width=100',
      },
      tags: ['Marketing', 'Strategy', 'ROI'],
      price: 79.99,
      ctaLabel: 'Join Live',
      attendeeCount: 342,
      isLive: true,
    },
    ended: {
      id: 'preview-ended',
      title: 'Customer Success Best Practices',
      description: 'Learn proven strategies for customer retention and success from industry leaders.',
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      thumbnail: '/placeholder.svg?height=400&width=600',
      presenter: {
        name: 'Mike Chen',
        title: 'Customer Success Director',
        image: '/placeholder.svg?height=100&width=100',
      },
      tags: ['Customer Success', 'Retention'],
      price: 0,
      ctaLabel: 'Watch Recording',
      attendeeCount: 89,
      hasRecording: true,
    },
  }

  const currentWebinar = mockWebinars[selectedWebinar]

  return (
    <main className="space-y-6 py-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Customer Portal Preview</p>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Preview Customer Experience</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          See exactly what your customers see when they visit your webinars. This is a preview of the public-facing portal.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This is a preview mode. Changes here don&apos;t affect your actual webinars. Use the tabs below to see different
          webinar states.
        </AlertDescription>
      </Alert>

      {/* Preview Mode Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Preview Mode</CardTitle>
          <CardDescription>Select a webinar state to preview</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedWebinar} onValueChange={(v) => setSelectedWebinar(v as typeof selectedWebinar)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="live">Live</TabsTrigger>
              <TabsTrigger value="ended">Ended</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Customer-Facing Webinar View */}
      <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 bg-muted/20">
        <div className="space-y-6">
          {/* Webinar Header */}
          <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
            {currentWebinar.thumbnail && (
              <Image
                src={currentWebinar.thumbnail}
                alt={currentWebinar.title}
                fill
                className="object-cover"
                priority
              />
            )}
            {currentWebinar.isLive && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-red-500 text-white animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                  LIVE
                </Badge>
              </div>
            )}
            {currentWebinar.hasRecording && (
              <div className="absolute top-4 right-4">
                <Badge variant="secondary">Recording Available</Badge>
              </div>
            )}
          </div>

          {/* Webinar Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{currentWebinar.title}</h1>
              <p className="text-muted-foreground">{currentWebinar.description}</p>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(currentWebinar.startTime, 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{format(currentWebinar.startTime, 'h:mm a')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{currentWebinar.attendeeCount} registered</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {currentWebinar.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Presenter Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-muted overflow-hidden">
                    {currentWebinar.presenter.image && (
                      <Image
                        src={currentWebinar.presenter.image}
                        alt={currentWebinar.presenter.name}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{currentWebinar.presenter.name}</p>
                    <p className="text-sm text-muted-foreground">{currentWebinar.presenter.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Price</p>
                    <p className="text-3xl font-bold">
                      {currentWebinar.price > 0 ? `$${currentWebinar.price.toFixed(2)}` : 'Free'}
                    </p>
                  </div>
                  <Button size="lg" className="gap-2">
                    {currentWebinar.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Notes */}
      <Card>
        <CardHeader>
          <CardTitle>What Customers See</CardTitle>
          <CardDescription>Key features visible to your customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Webcam className="h-4 w-4" />
                Webinar Details
              </h4>
              <p className="text-sm text-muted-foreground">
                Customers see the full webinar information, presenter details, and pricing.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Registration
              </h4>
              <p className="text-sm text-muted-foreground">
                Attendees can register, see attendee count, and join live webinars.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment
              </h4>
              <p className="text-sm text-muted-foreground">
                Direct payment integration via Stripe Connect for seamless transactions.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Live Experience
              </h4>
              <p className="text-sm text-muted-foreground">
                Real-time streaming, chat, and AI agent interactions during live webinars.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export default PreviewPage

