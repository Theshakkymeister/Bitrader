"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Chart context for providing default colors and config
const ChartContext = React.createContext<{
  colors: string[]
}>({
  colors: ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
})

// Chart container component
interface ChartContainerProps {
  children: React.ReactNode
  className?: string
  config?: Record<string, any>
}

export function ChartContainer({ 
  children, 
  className,
  config = {} 
}: ChartContainerProps) {
  const colors = [
    "hsl(217, 91%, 60%)", // Primary blue
    "hsl(142, 76%, 36%)", // Success green  
    "hsl(38, 92%, 50%)",  // Warning yellow
    "hsl(0, 72%, 51%)",   // Error red
    "hsl(262, 83%, 58%)", // Purple
    "hsl(173, 58%, 39%)"  // Teal
  ]

  return (
    <ChartContext.Provider value={{ colors }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </ChartContext.Provider>
  )
}

// Chart tooltip component
interface ChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  className?: string
}

export function ChartTooltip({ 
  active, 
  payload, 
  label, 
  className 
}: ChartTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className={cn(
      "rounded-lg border bg-background p-2 shadow-md",
      "bg-slate-800 border-slate-700 text-white",
      className
    )}>
      {label && (
        <div className="text-sm font-medium text-slate-300 mb-1">
          {label}
        </div>
      )}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center space-x-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="font-medium text-white">
            {typeof entry.value === 'number' 
              ? entry.value.toLocaleString() 
              : entry.value
            }
          </span>
        </div>
      ))}
    </div>
  )
}

// Chart legend component
interface ChartLegendProps {
  payload?: any[]
  className?: string
}

export function ChartLegend({ payload, className }: ChartLegendProps) {
  if (!payload || !payload.length) {
    return null
  }

  return (
    <div className={cn("flex flex-wrap gap-4 justify-center", className)}>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center space-x-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// Hook to use chart colors
export function useChartColors() {
  const context = React.useContext(ChartContext)
  return context.colors
}

