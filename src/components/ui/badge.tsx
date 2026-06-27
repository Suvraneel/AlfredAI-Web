import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-bg-elevated border border-border text-text-secondary",
        success: "bg-success/10 text-success border border-success/20",
        error: "bg-error/10 text-error border border-error/20",
        warning: "bg-warning/10 text-warning border border-warning/20",
        accent: "bg-accent-from/10 text-accent-from border border-accent-from/20",
        outline: "border border-border text-text-secondary",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
