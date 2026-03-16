'use client'

import { motion } from 'framer-motion'
import { Check, Circle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PipelineStep = {
  id: string
  label: string
  status: 'pending' | 'processing' | 'completed' | 'error'
}

interface PipelineProgressProps {
  steps: PipelineStep[]
  className?: string
}

export function PipelineProgress({ steps, className }: PipelineProgressProps) {
  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex flex-col space-y-4">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1
          
          return (
            <div key={step.id} className="flex relative">
              {/* Vertical line connecting steps */}
              {!isLast && (
                <div 
                  className={cn(
                    "absolute left-[11px] top-6 bottom-[-16px] w-[2px]",
                    step.status === 'completed' ? "bg-primary" : "bg-muted"
                  )} 
                />
              )}
              
              <div className="flex items-center gap-4 relative z-10 w-full">
                <div 
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-background",
                    step.status === 'completed' && "border-primary text-primary bg-primary/10",
                    step.status === 'processing' && "border-primary text-primary",
                    step.status === 'error' && "border-destructive text-destructive bg-destructive/10",
                    step.status === 'pending' && "border-muted text-muted-foreground"
                  )}
                >
                  {step.status === 'completed' && <Check className="h-4 w-4" />}
                  {step.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {step.status === 'error' && <Circle className="h-4 w-4 fill-current" />}
                  {step.status === 'pending' && <Circle className="h-2 w-2 fill-current" />}
                </div>
                
                <div className="flex-1 flex justify-between items-center">
                  <span 
                    className={cn(
                      "text-sm font-medium",
                      step.status === 'pending' && "text-muted-foreground",
                      step.status === 'processing' && "text-foreground font-semibold",
                      step.status === 'completed' && "text-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                  
                  {step.status === 'processing' && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-primary font-medium"
                    >
                      Processing...
                    </motion.span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
