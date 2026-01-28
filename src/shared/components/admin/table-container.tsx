import type * as React from "react"
import { cn } from "@/shared/lib/utils"

type TableContainerProps = React.ComponentProps<"div">

export function TableContainer({ className, children, ...props }: TableContainerProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card flex-1 flex flex-col min-h-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

type TableScrollAreaProps = React.ComponentProps<"div">

export function TableScrollArea({ className, children, ...props }: TableScrollAreaProps) {
  return (
    <div
      className={cn("flex-1 min-h-0 overflow-auto no-scrollbar", className)}
      {...props}
    >
      {children}
    </div>
  )
}
