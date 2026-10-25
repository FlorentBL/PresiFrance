import { useRef, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlowCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Couleur du halo : bleu, rouge ou neutre (blanc). */
  glow?: "blue" | "red" | "white";
  /** Halo qui suit le pointeur (désactivé au tactile). */
  interactive?: boolean;
}

const GLOW_VAR = { blue: "var(--tri-blue)", red: "var(--tri-red)", white: "var(--foreground)" } as const;

/** Carte en verre avec halo lumineux ; le halo suit le pointeur quand `interactive`. */
export function GlowCard({ children, className, glow = "blue", interactive = true, onPointerMove, ...rest }: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    const el = ref.current;
    if (!interactive || !el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      style={{ "--glow-color": GLOW_VAR[glow] } as React.CSSProperties}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card/80 p-5 sm:p-6 shadow-md",
        "backdrop-blur-sm transition-[border-color,box-shadow,transform] duration-300 hover:border-primary/40 hover:shadow-lg",
        className,
      )}
      {...rest}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
        style={{
          background:
            "radial-gradient(320px circle at var(--mx, 50%) var(--my, 0%), hsl(var(--glow-color) / 0.16), transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export default GlowCard;
