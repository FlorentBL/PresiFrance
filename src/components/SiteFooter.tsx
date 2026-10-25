import { Link } from "react-router-dom";

const NAV_LINKS = [
  { to: "/", label: "Accueil" },
  { to: "/presidentielle-2027", label: "Présidentielle 2027" },
  { to: "/parrainages?year=2027", label: "Parrainages 2027" },
  { to: "/sondages-presidentielle-2027", label: "Sondages 2027" },
  { to: "/resultats-presidentielle", label: "Résultats présidentielles" },
  { to: "/resultats-presidentielle-par-commune", label: "Résultats par commune" },
  { to: "/carte-presidentielle", label: "Carte présidentielle" },
  { to: "/participation-presidentielle", label: "Participation" },
  { to: "/abstention-presidentielle", label: "Abstention" },
  { to: "/comparer", label: "Comparer des communes" },
  { to: "/explorer", label: "Explorer par commune" },
] as const;

const ARCHIVE_LINKS = [
  { to: "/promesses-bilan", label: "Promesses vs bilan (2017-2022)" },
  { to: "/analyse", label: "Sondages 2022" },
] as const;

export default function SiteFooter() {
  return (
    <footer className="night-bg grain relative isolate overflow-hidden border-t border-border py-14">
      <div className="tricolor-bar absolute inset-x-0 top-0" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <img src="/logo.webp" alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-border" />
              <span className="font-heading text-2xl font-extrabold tracking-tight">
                Prési<span className="text-primary">France</span>
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Une plateforme citoyenne pour explorer les données des élections présidentielles françaises, de l'archive 1965-2022 à la campagne 2027 en toute transparence. Développé avec amour pour la démocratie.
            </p>
          </div>

          <nav aria-label="Pied de page">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Navigation</h2>
            <ul className="space-y-2 text-sm">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-foreground/85 transition-colors hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="mb-4 mt-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Archives</h2>
            <ul className="space-y-2 text-sm">
              {ARCHIVE_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-foreground/85 transition-colors hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Légal</h2>
            <ul className="space-y-2 text-sm">
              <li><Link to="/mentions-legales" className="text-foreground/85 transition-colors hover:text-primary">Mentions Légales</Link></li>
              <li><Link to="/politique-de-confidentialite" className="text-foreground/85 transition-colors hover:text-primary">Confidentialité</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} PrésiFrance. Données d'intérêt public.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span>Propulsé par data.gouv.fr</span>
            <a
              href="https://www.fbldigital.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Réalisation · FBL Digital
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
