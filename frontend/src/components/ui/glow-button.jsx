import React from 'react'
import { Button } from './button'
import { GlowingEffect } from './glowing-effect'
import { cn } from '@/lib/utils'

const GlowButton = React.forwardRef(({ className, glow = true, children, ...props }, ref) => (
  <div className="relative group inline-block">
    {glow && (
      <GlowingEffect
        spread={50}
        glow={true}
        disabled={false}
        proximity={70}
        inactiveZone={0.01}
        borderWidth={2}
      />
    )}
    <Button
      ref={ref}
      className={cn("relative transition-all duration-300", className)}
      {...props}
    >
      {children}
    </Button>
  </div>
))
GlowButton.displayName = "GlowButton"

export { GlowButton }
