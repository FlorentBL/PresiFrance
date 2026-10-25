import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/20 py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.webp" alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-border/60" />
              <span className="text-lg font-black tracking-tight">
                Prési<span className="text-primary">France</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Une plateforme citoyenne pour explorer les données des élections présidentielles françaises en toute transparence. Développé avec amour pour la démocratie.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 uppercase text-[10px] tracking-widest text-muted-foreground">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary transition-colors">Accueil</Link></li>
              <li><Link to="/resultats-presidentielle" className="hover:text-primary transition-colors">Résultats présidentielles</Link></li>
              <li><Link to="/resultats-presidentielle-par-commune" className="hover:text-primary transition-colors">Résultats par commune</Link></li>
              <li><Link to="/carte-presidentielle" className="hover:text-primary transition-colors">Carte présidentielle</Link></li>
              <li><Link to="/participation-presidentielle" className="hover:text-primary transition-colors">Participation</Link></li>
              <li><Link to="/abstention-presidentielle" className="hover:text-primary transition-colors">Abstention</Link></li>
              <li><Link to="/comparer" className="hover:text-primary transition-colors">Comparer des communes</Link></li>
              <li><Link to="/explorer" className="hover:text-primary font-bold text-blue-600 transition-colors">Explorer par commune</Link></li>
              <li><Link to="/parrainages" className="hover:text-primary transition-colors">Parrainages</Link></li>
              <li><Link to="/analyse" className="hover:text-primary transition-colors">Sondages 2022 (analyse)</Link></li>
              <li><Link to="/promesses-bilan" className="hover:text-primary transition-colors">Promesses Macron vs bilan</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 uppercase text-[10px] tracking-widest text-muted-foreground">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/mentions-legales" className="hover:text-primary transition-colors">Mentions Légales</Link></li>
              <li><Link to="/politique-de-confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} PrésiFrance. Données d'intérêt public.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span>Propulsé par data.gouv.fr</span>
            <a
              href="https://www.fbldigital.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Réalisation · FBL Digital
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
