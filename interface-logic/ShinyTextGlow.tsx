import { CSSProperties, FC, ReactNode } from "react";
import { cn } from "@/libs";

interface ShinyTextGlowProps {
  children: ReactNode;
  className?: string;
  shimmerWidth?: number;
  shimmerSpeed?: number; // В миллисекундах
  glow?: boolean;
}

export const ShinyTextGlow: FC<ShinyTextGlowProps> = ({
  children,
  className,
  shimmerWidth = 120,
  shimmerSpeed = 1000,
  glow = false,
}) => {
  const customStyles: CSSProperties = {
    "--shiny-width": `${shimmerWidth}px`,
    "--shiny-speed": `${shimmerSpeed}ms`,
  } as CSSProperties;

  return (
    <p
      style={customStyles}
      className={cn(
        "relative w-fit text-neutral-600/70 dark:text-neutral-400/70",

        // Shine effect
        "animate-shiny-text bg-clip-text bg-no-repeat [background-position:0_0]",
        "[background-size:var(--shiny-width)_100%] [transition:background-position_var(--shiny-speed)_cubic-bezier(.6,.6,0,1)_infinite]",

        // Shine gradient
        "bg-gradient-to-r from-transparent via-black/80 via-50% to-transparent dark:via-white/80",

        // Optional glow
        glow &&
          "drop-shadow-[0_0_4px_rgba(255,255,255,0.2)] dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]",

        className
      )}
    >
      {children}
    </p>
  );
};
