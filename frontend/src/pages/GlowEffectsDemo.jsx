import React from 'react'
import { GlowCard, GlowCardHeader, GlowCardTitle, GlowCardDescription, GlowCardContent } from '@/components/ui/glow-card'
import { GlowButton } from '@/components/ui/glow-button'
import { Box, Lock, Search, Settings, Sparkles, Zap } from 'lucide-react'

export default function GlowEffectsDemo() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Glowing Effects Demo</h1>
        <p className="text-muted-foreground">Hover over the cards and buttons to see the glowing effect</p>
      </div>

      {/* Glow Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GlowCard>
          <GlowCardHeader>
            <div className="w-fit rounded-lg border bg-muted p-2 mb-3">
              <Box className="h-5 w-5" />
            </div>
            <GlowCardTitle>Dashboard Overview</GlowCardTitle>
            <GlowCardDescription>
              View all your metrics at a glance
            </GlowCardDescription>
          </GlowCardHeader>
          <GlowCardContent>
            <p className="text-sm text-muted-foreground">
              Track employee attendance, leave requests, and payroll information in real-time.
            </p>
          </GlowCardContent>
        </GlowCard>

        <GlowCard>
          <GlowCardHeader>
            <div className="w-fit rounded-lg border bg-muted p-2 mb-3">
              <Settings className="h-5 w-5" />
            </div>
            <GlowCardTitle>System Settings</GlowCardTitle>
            <GlowCardDescription>
              Configure your HRMS preferences
            </GlowCardDescription>
          </GlowCardHeader>
          <GlowCardContent>
            <p className="text-sm text-muted-foreground">
              Customize departments, roles, and access controls for your organization.
            </p>
          </GlowCardContent>
        </GlowCard>

        <GlowCard>
          <GlowCardHeader>
            <div className="w-fit rounded-lg border bg-muted p-2 mb-3">
              <Lock className="h-5 w-5" />
            </div>
            <GlowCardTitle>Security & Privacy</GlowCardTitle>
            <GlowCardDescription>
              Your data is protected
            </GlowCardDescription>
          </GlowCardHeader>
          <GlowCardContent>
            <p className="text-sm text-muted-foreground">
              Enterprise-grade security with end-to-end encryption and role-based access.
            </p>
          </GlowCardContent>
        </GlowCard>

        <GlowCard>
          <GlowCardHeader>
            <div className="w-fit rounded-lg border bg-muted p-2 mb-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <GlowCardTitle>AI-Powered Insights</GlowCardTitle>
            <GlowCardDescription>
              Smart analytics for better decisions
            </GlowCardDescription>
          </GlowCardHeader>
          <GlowCardContent>
            <p className="text-sm text-muted-foreground">
              Get predictive analytics and automated recommendations for HR operations.
            </p>
          </GlowCardContent>
        </GlowCard>

        <GlowCard>
          <GlowCardHeader>
            <div className="w-fit rounded-lg border bg-muted p-2 mb-3">
              <Search className="h-5 w-5" />
            </div>
            <GlowCardTitle>Advanced Search</GlowCardTitle>
            <GlowCardDescription>
              Find anything instantly
            </GlowCardDescription>
          </GlowCardHeader>
          <GlowCardContent>
            <p className="text-sm text-muted-foreground">
              Powerful search across employees, documents, and records with filters.
            </p>
          </GlowCardContent>
        </GlowCard>

        <GlowCard>
          <GlowCardHeader>
            <div className="w-fit rounded-lg border bg-muted p-2 mb-3">
              <Zap className="h-5 w-5" />
            </div>
            <GlowCardTitle>Lightning Fast</GlowCardTitle>
            <GlowCardDescription>
              Optimized for performance
            </GlowCardDescription>
          </GlowCardHeader>
          <GlowCardContent>
            <p className="text-sm text-muted-foreground">
              Built with modern tech stack for blazing fast load times and smooth UX.
            </p>
          </GlowCardContent>
        </GlowCard>
      </div>

      {/* Glow Buttons */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Glowing Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <GlowButton>Primary Action</GlowButton>
          <GlowButton variant="outline">Secondary Action</GlowButton>
          <GlowButton variant="destructive">Delete</GlowButton>
          <GlowButton variant="secondary">Settings</GlowButton>
          <GlowButton variant="ghost" className="border">Ghost with Border</GlowButton>
        </div>
      </div>

      {/* Large Feature Card */}
      <GlowCard className="col-span-full">
        <GlowCardHeader>
          <div className="w-fit rounded-lg border bg-primary/10 p-3 mb-3">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <GlowCardTitle className="text-3xl">Experience the Power of HRX</GlowCardTitle>
          <GlowCardDescription className="text-base">
            The next-generation HRMS platform designed for modern organizations
          </GlowCardDescription>
        </GlowCardHeader>
        <GlowCardContent>
          <p className="text-muted-foreground mb-4">
            HRX combines cutting-edge technology with intuitive design to streamline your HR operations.
            From employee onboarding to payroll management, we've got you covered.
          </p>
          <div className="flex gap-3">
            <GlowButton>Get Started</GlowButton>
            <GlowButton variant="outline">Learn More</GlowButton>
          </div>
        </GlowCardContent>
      </GlowCard>
    </div>
  )
}
