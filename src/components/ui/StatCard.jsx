import { Card, CardContent, CardHeader, CardTitle } from './card'
import { InteractiveCard } from './interactive-card'
import { cn } from '@/lib/utils'

export default function StatCard({ title, value, icon: Icon, trend, trendValue, className }) {
  return (
    <InteractiveCard
      className={cn("relative", className)}
      enableTilt={true}
      enableParticles={true}
      enableMagnetism={false}
      clickEffect={true}
      particleCount={6}
      glowColor="13, 148, 136"
    >
      <Card className="relative hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300 h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <p className={cn(
              "text-xs mt-1",
              trend === 'up' ? "text-teal-600" : trend === 'down' ? "text-red-600" : "text-muted-foreground"
            )}>
              {trendValue}
            </p>
          )}
        </CardContent>
      </Card>
    </InteractiveCard>
  )
}
