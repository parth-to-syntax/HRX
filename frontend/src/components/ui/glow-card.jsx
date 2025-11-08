import React from 'react'
import { cn } from '@/lib/utils'
import { GlowingEffect } from './glowing-effect'

const GlowCard = React.forwardRef(({ className, glow = true, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden",
      className
    )}
    {...props}
  >
    {glow && (
      <GlowingEffect
        spread={60}
        glow={true}
        disabled={false}
        proximity={70}
        inactiveZone={0.01}
        borderWidth={2}
      />
    )}
    <div className="relative z-10">
      {children}
    </div>
  </div>
))
GlowCard.displayName = "GlowCard"

const GlowCardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
GlowCardHeader.displayName = "GlowCardHeader"

const GlowCardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
GlowCardTitle.displayName = "GlowCardTitle"

const GlowCardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
GlowCardDescription.displayName = "GlowCardDescription"

const GlowCardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
GlowCardContent.displayName = "GlowCardContent"

const GlowCardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
GlowCardFooter.displayName = "GlowCardFooter"

export { GlowCard, GlowCardHeader, GlowCardFooter, GlowCardTitle, GlowCardDescription, GlowCardContent }
