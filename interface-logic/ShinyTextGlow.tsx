import React, {
  CSSProperties,
  FC,
  ReactNode,
  forwardRef,
  Ref,
  useMemo,
} from "react"
import { cn } from "@/libs"

interface ShinyTextGlowProps {
  children: ReactNode
  className?: string
  shimmerWidth?: number
  shimmerSpeed?: number // in milliseconds
  shimmerColor?: string // CSS color
  glow?: boolean
  glowStrength?: number // px value for drop-shadow
  direction?: "ltr" | "rtl"
  intensity?: number // opacity multiplier for shimmer
  disabled?: boolean
  tag?: keyof JSX.IntrinsicElements
}

/**
 * A highly customizable, performant, shimmering text component.
 */
export const ShinyTextGlow = React.memo(
  forwardRef<HTMLElement, ShinyTextGlowProps>(
    (
      {
        children,
        className,
        shimmerWidth = 120,
        shimmerSpeed = 1200,
        shimmerColor = "#ffffff66",
        glow = false,
        glowStrength = 5,
        direction = "ltr",
        intensity = 0.7,
        disabled = false,
        tag = "span",
      },
      ref
    ) => {
      const Component = tag as any

      const styles: CSSProperties = useMemo(
        () => ({
          "--shiny-width": `${shimmerWidth}px`,
          "--shiny-speed": `${shimmerSpeed}ms`,
          "--shiny-color": shimmerColor,
          "--shiny-direction": direction === "rtl" ? "100% 0" : "0 0",
          "--shiny-opacity": intensity,
        }),
        [shimmerWidth, shimmerSpeed, shimmerColor, direction, intensity]
      )

      return (
        <Component
          ref={ref}
          role="text"
          aria-hidden={disabled}
          style={styles}
          className={cn(
            "relative inline-block bg-clip-text bg-no-repeat text-neutral-700 dark:text-neutral-300",
            !disabled &&
              "animate-shiny-text [background-size:var(--shiny-width)_100%]",
            !disabled &&
              "[background-position:var(--shiny-direction)]",
            !disabled &&
              `[transition:background-position_var(--shiny-speed)_cubic-bezier(.6,.6,0,1)_infinite]`,
            !disabled &&
              "bg-gradient-to-r from-transparent via-[var(--shiny-color)] via-50% to-transparent",
            !disabled &&
              glow &&
              `drop-shadow-[0_0_${glowStrength}px_rgba(255,255,255,0.3)] dark:drop-shadow-[0_0_${
                glowStrength + 2
              }px_rgba(255,255,255,0.4)]`,
            className
          )}
        >
          {children}
        </Component>
      )
    }
  )
)

ShinyTextGlow.displayName = "ShinyTextGlow"
