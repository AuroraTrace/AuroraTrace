import React, { CSSProperties, FC, ReactNode, forwardRef, Ref } from "react"
import { cn } from "@/libs"

interface ShinyTextGlowProps {
  children: ReactNode
  className?: string
  shimmerWidth?: number
  shimmerSpeed?: number // in milliseconds
  glow?: boolean
  shimmerColor?: string // CSS color for the shine
  direction?: "ltr" | "rtl"
}

/**
 * A text component with a shimmering gradient and optional glow.
 */
export const ShinyTextGlow = React.memo(
  forwardRef(
    (
      {
        children,
        className,
        shimmerWidth = 120,
        shimmerSpeed = 1000,
        glow = false,
        shimmerColor = "#00000080",
        direction = "ltr",
      }: ShinyTextGlowProps,
      ref: Ref<HTMLSpanElement>
    ) => {
      const styles: CSSProperties = {
        "--shiny-width": `${shimmerWidth}px`,
        "--shiny-speed": `${shimmerSpeed}ms`,
        "--shiny-color": shimmerColor,
        "--shiny-direction": direction === "rtl" ? "100% 0" : "0 0",
      } as CSSProperties

      return (
        <span
          ref={ref}
          style={styles}
          className={cn(
            "relative inline-block text-neutral-600/70 dark:text-neutral-400/70",
            // shimmer
            "animate-shiny-text bg-clip-text bg-no-repeat",
            "[background-size:var(--shiny-width)_100%]",
            `[background-position:var(--shiny-direction)]`,
            `[transition:background-position_var(--shiny-speed)_cubic-bezier(.6,.6,0,1)_infinite]`,
            // gradient uses CSS var for color
            `bg-gradient-to-r from-transparent via-[var(--shiny-color)] via-50% to-transparent`,
            // optional glow
            glow &&
              "drop-shadow-[0_0_4px_rgba(255,255,255,0.2)] dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]",
            className
          )}
        >
          {children}
        </span>
      )
    }
  )
)

ShinyTextGlow.displayName = "ShinyTextGlow"
