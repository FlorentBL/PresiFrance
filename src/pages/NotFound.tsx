import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { PageHero } from "@/components/design";

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="Page introuvable" description="La page demandée n'existe pas." path={pathname} />
      <SiteHeader />
      <main className="flex-1">
        <PageHero
          eyebrow="Erreur 404"
          title="Oups ! Cette page n'existe pas."
          description="Le lien est peut-être périmé. Retournez à l'accueil pour explorer les résultats."
          actions={
            <Link to="/">
              <Button size="lg" className="gap-2">
                <Home className="h-4 w-4" />
                Retour à l'accueil
              </Button>
            </Link>
          }
        />
      </main>
      <SiteFooter />
    </div>
  );
}
