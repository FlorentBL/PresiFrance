import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

import { GlowCard } from "@/components/design";

interface LinkCardProps {
  to: string;
  title: ReactNode;
  text: ReactNode;
  Icon: LucideIcon;
  glow?: "blue" | "red" | "white";
}

/** Carte-lien en verre : toute la carte est cliquable. */
export default function LinkCard({ to, title, text, Icon, glow = "blue" }: LinkCardProps) {
  return (
    <Link to={to} className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <GlowCard glow={glow} className="h-full transition-transform duration-300 hover:-translate-y-1 motion-reduce:transform-none">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
        </div>
        <h3 className="mb-1.5 text-lg font-semibold">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
      </GlowCard>
    </Link>
  );
}
