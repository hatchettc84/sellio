import type { ButtonHTMLAttributes, DetailedHTMLProps } from "react"
import { cn } from "@/lib/utils"

interface ChipProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  selected?: boolean
}

export function Chip({ selected = false, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      data-slot="chip"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-muted-foreground/20 bg-muted/50 text-muted-foreground hover:border-primary/40 hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}


