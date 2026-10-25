import { useState } from "react";
import { getCandidatePhotoUrl } from "@/lib/candidatePhotos";
import { cn } from "@/lib/utils";

interface CandidateAvatarProps {
  prenom: string;
  nom: string;
  /** Couleur de contour/repli (ex. getCandidateColor). */
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-xl",
  xl: "h-32 w-32 text-3xl",
} as const;

function initials(prenom: string, nom: string): string {
  const a = prenom.trim().charAt(0);
  const b = nom.trim().charAt(0);
  return `${a}${b}`.toUpperCase() || "?";
}

/** Photo du candidat (src/lib/candidatePhotos) avec repli sur les initiales si absente ou en erreur. */
export function CandidateAvatar({ prenom, nom, color, size = "md", className }: CandidateAvatarProps) {
  const [failed, setFailed] = useState(false);
  const url = getCandidatePhotoUrl(prenom, nom);
  const showPhoto = url && !failed;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-heading font-semibold text-foreground ring-2 ring-offset-2 ring-offset-background",
        SIZES[size],
        className,
      )}
      style={color ? ({ "--tw-ring-color": color } as React.CSSProperties) : undefined}
      role="img"
      aria-label={`${prenom} ${nom}`}
    >
      {showPhoto ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <span aria-hidden="true">{initials(prenom, nom)}</span>
      )}
    </span>
  );
}

export default CandidateAvatar;
