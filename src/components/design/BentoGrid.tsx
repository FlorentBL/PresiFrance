import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Grille bento 1 col (mobile) → 2 cols (sm) → 6 cols (lg). Les enfants choisissent leur emprise avec BentoItem. */
export function BentoGrid({ children, className, ...rest }: BentoGridProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:gap-5", className)} {...rest}>
      {children}
    </div>
  );
}

interface BentoItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Colonnes occupées sur lg (sur 6). */
  span?: 2 | 3 | 4 | 6;
  /** Lignes occupées sur lg. */
  rows?: 1 | 2;
}

const SPAN = { 2: "lg:col-span-2", 3: "lg:col-span-3", 4: "lg:col-span-4", 6: "lg:col-span-6" } as const;
const ROWS = { 1: "", 2: "lg:row-span-2" } as const;

export function BentoItem({ children, span = 2, rows = 1, className, ...rest }: BentoItemProps) {
  return (
    <div className={cn(SPAN[span], ROWS[rows], span >= 4 && "sm:col-span-2", className)} {...rest}>
      {children}
    </div>
  );
}

export default BentoGrid;
