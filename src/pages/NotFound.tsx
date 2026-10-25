import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Home, Search, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { PageHero } from "@/components/design";

/** Urne vide stylisée : le bulletin « 404 » n'a trouvé aucune urne. */
function EmptyBallotBox() {
  const reduce = useReducedMotion();
  return (
    <svg
      viewBox="0 0 200 200"
      className="h-56 w-56"
      role="img"
      aria-label="Urne vide dont le bulletin 404 flotte au-dessus"
    >
      <motion.g
        animate={reduce ? undefined : { y: [0, -10, 0], rotate: [-4, 3, -4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 60px" }}
      >
        <rect
          x="62"
          y="14"
          width="76"
          height="52"
          rx="6"
          fill="hsl(var(--card))"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />
        <text
          x="100"
          y="48"
          textAnchor="middle"
          fontSize="26"
          fontWeight="800"
          fill="hsl(var(--tri-red))"
          fontFamily="Fraunces, serif"
        >
          404
        </text>
      </motion.g>
      <rect
        x="40"
        y="96"
        width="120"
        height="84"
        rx="10"
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth="2"
      />
      <rect
        x="40"
        y="96"
        width="120"
        height="10"
        rx="5"
        fill="hsl(var(--primary))"
        opacity="0.85"
      />
      <rect
        x="76"
        y="100"
        width="48"
        height="4"
        rx="2"
        fill="hsl(var(--background))"
      />
      <rect
        x="40"
        y="168"
        width="120"
        height="12"
        rx="6"
        fill="hsl(var(--tri-red))"
        opacity="0.85"
      />
      <rect
        x="40"
        y="138"
        width="120"
        height="30"
        fill="hsl(var(--foreground))"
        opacity="0.06"
      />
    </svg>
  );
}

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Page introuvable"
        description="La page demandée n'existe pas."
        path={pathname}
      />
      <SiteHeader />
      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
        <PageHero
          eyebrow="Erreur 404 · bulletin nul"
          title={
            <>
              Aucun résultat pour{" "}
              <span className="text-gradient-tricolor">cette page</span>.
            </>
          }
          description="Dépouillement terminé : l'adresse demandée n'a recueilli aucune voix. Le lien est peut-être périmé — retournez à l'accueil ou explorez les résultats."
          aside={<EmptyBallotBox />}
          actions={
            <>
              <Link to="/">
                <Button size="lg" className="gap-2">
                  <Home className="h-4 w-4" />
                  Retour à l'accueil
                </Button>
              </Link>
              <Link to="/resultats-presidentielle">
                <Button size="lg" variant="outline" className="gap-2">
                  <Vote className="h-4 w-4" />
                  Voir les résultats
                </Button>
              </Link>
              <Link to="/explorer">
                <Button size="lg" variant="ghost" className="gap-2">
                  <Search className="h-4 w-4" />
                  Explorer
                </Button>
              </Link>
            </>
          }
        />
      </main>
      <SiteFooter />
    </div>
  );
}
