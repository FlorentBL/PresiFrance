import { Code2, Database, MapPin, Search } from "lucide-react";

import { Link } from "react-router-dom";

import SeoConnectorPage from "./SeoConnectorPage";

export default function CartePresidentiellePage() {
  return (
    <SeoConnectorPage
      path="/carte-presidentielle"
      eyebrow="Lecture géographique"
      title="Carte présidentielle"
      description="Explorez les résultats de l'élection présidentielle sur une carte : communes, départements, scores locaux et lecture géographique du vote."
      intro="La carte présidentielle permet de comprendre comment le vote varie d'un territoire à l'autre. Elle sert de porte d'entrée vers les communes, les départements et les résultats détaillés."
      answerTitle="À quoi sert une carte présidentielle ?"
      answer="Une carte présidentielle aide à visualiser les écarts de vote entre communes et départements. Elle complète les tableaux de résultats en montrant les dynamiques territoriales : bastions, contrastes voisins, participation et rapports de force locaux."
      cards={[
        { title: "Vision territoriale", text: "Passer d'une liste de résultats à une lecture géographique du scrutin.", Icon: MapPin },
        { title: "Accès local", text: "Descendre rapidement vers les fiches communes et les pages départementales.", Icon: Search },
        { title: "Données ouvertes", text: "S'appuyer sur des données publiques structurées pour explorer le vote.", Icon: Database },
      ]}
      heroActions={
        <Link
          to="/integrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
          Intégrer
        </Link>
      }
      stepsTitle="Comment explorer la carte ?"
      steps={[
        "Choisissez une entrée par commune, département ou année électorale.",
        "Consultez les scores locaux pour comprendre les rapports de force.",
        "Comparez les territoires proches ou les évolutions entre scrutins.",
      ]}
      faq={[
        { question: "La carte remplace-t-elle les résultats par commune ?", answer: "Non. Elle aide à repérer les tendances, puis les fiches communes donnent le détail chiffré." },
        { question: "Peut-on lire plusieurs années ?", answer: "Oui, les pages année et les fiches communes permettent de naviguer entre les scrutins disponibles." },
      ]}
    />
  );
}
