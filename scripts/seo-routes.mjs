export const presidentialYears = [2022, 2017, 2012, 2007, 2002, 1995, 1988, 1981, 1974, 1969, 1965];

export const presidentialYearSummaries = [
  { year: 2022, winner: "Emmanuel Macron", runnerUp: "Marine Le Pen" },
  { year: 2017, winner: "Emmanuel Macron", runnerUp: "Marine Le Pen" },
  { year: 2012, winner: "François Hollande", runnerUp: "Nicolas Sarkozy" },
  { year: 2007, winner: "Nicolas Sarkozy", runnerUp: "Ségolène Royal" },
  { year: 2002, winner: "Jacques Chirac", runnerUp: "Jean-Marie Le Pen" },
  { year: 1995, winner: "Jacques Chirac", runnerUp: "Lionel Jospin" },
  { year: 1988, winner: "François Mitterrand", runnerUp: "Jacques Chirac" },
  { year: 1981, winner: "François Mitterrand", runnerUp: "Valéry Giscard d'Estaing" },
  { year: 1974, winner: "Valéry Giscard d'Estaing", runnerUp: "François Mitterrand" },
  { year: 1969, winner: "Georges Pompidou", runnerUp: "Alain Poher" },
  { year: 1965, winner: "Charles de Gaulle", runnerUp: "François Mitterrand" },
];

export const departmentCodes = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "2A",
  "2B", "21", "22", "23", "24", "25", "26", "27", "28", "29",
  "30", "31", "32", "33", "34", "35", "36", "37", "38", "39",
  "40", "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "50", "51", "52", "53", "54", "55", "56", "57", "58", "59",
  "60", "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "70", "71", "72", "73", "74", "75", "76", "77", "78", "79",
  "80", "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "90", "91", "92", "93", "94", "95", "971", "972", "973", "974",
  "976",
];

export const departmentNames = {
  "01": "Ain", "02": "Aisne", "03": "Allier", "04": "Alpes-de-Haute-Provence", "05": "Hautes-Alpes",
  "06": "Alpes-Maritimes", "07": "Ardèche", "08": "Ardennes", "09": "Ariège", "10": "Aube",
  "11": "Aude", "12": "Aveyron", "13": "Bouches-du-Rhône", "14": "Calvados", "15": "Cantal",
  "16": "Charente", "17": "Charente-Maritime", "18": "Cher", "19": "Corrèze", "2A": "Corse-du-Sud",
  "2B": "Haute-Corse", "21": "Côte-d'Or", "22": "Côtes-d'Armor", "23": "Creuse", "24": "Dordogne",
  "25": "Doubs", "26": "Drôme", "27": "Eure", "28": "Eure-et-Loir", "29": "Finistère",
  "30": "Gard", "31": "Haute-Garonne", "32": "Gers", "33": "Gironde", "34": "Hérault",
  "35": "Ille-et-Vilaine", "36": "Indre", "37": "Indre-et-Loire", "38": "Isère", "39": "Jura",
  "40": "Landes", "41": "Loir-et-Cher", "42": "Loire", "43": "Haute-Loire", "44": "Loire-Atlantique",
  "45": "Loiret", "46": "Lot", "47": "Lot-et-Garonne", "48": "Lozère", "49": "Maine-et-Loire",
  "50": "Manche", "51": "Marne", "52": "Haute-Marne", "53": "Mayenne", "54": "Meurthe-et-Moselle",
  "55": "Meuse", "56": "Morbihan", "57": "Moselle", "58": "Nièvre", "59": "Nord",
  "60": "Oise", "61": "Orne", "62": "Pas-de-Calais", "63": "Puy-de-Dôme", "64": "Pyrénées-Atlantiques",
  "65": "Hautes-Pyrénées", "66": "Pyrénées-Orientales", "67": "Bas-Rhin", "68": "Haut-Rhin", "69": "Rhône",
  "70": "Haute-Saône", "71": "Saône-et-Loire", "72": "Sarthe", "73": "Savoie", "74": "Haute-Savoie",
  "75": "Paris", "76": "Seine-Maritime", "77": "Seine-et-Marne", "78": "Yvelines", "79": "Deux-Sèvres",
  "80": "Somme", "81": "Tarn", "82": "Tarn-et-Garonne", "83": "Var", "84": "Vaucluse",
  "85": "Vendée", "86": "Vienne", "87": "Haute-Vienne", "88": "Vosges", "89": "Yonne",
  "90": "Territoire de Belfort", "91": "Essonne", "92": "Hauts-de-Seine", "93": "Seine-Saint-Denis",
  "94": "Val-de-Marne", "95": "Val-d'Oise", "971": "Guadeloupe", "972": "Martinique",
  "973": "Guyane", "974": "La Réunion", "976": "Mayotte",
};

export const presidentialYearRoutes = presidentialYears.map((year) => `/presidentielle-${year}`);
export const departmentRoutes = departmentCodes.map((code) => `/explorer/${code}`);

export const staticRoutes = [
  "/",
  "/resultats-presidentielle",
  "/resultats-presidentielle-par-commune",
  "/carte-presidentielle",
  "/participation-presidentielle",
  "/abstention-presidentielle",
  ...presidentialYearRoutes,
  "/comparer",
  "/parrainages",
  "/analyse",
  "/promesses-bilan",
  "/mentions-legales",
  "/politique-de-confidentialite",
  "/explorer",
  "/integrer",
];

export function getDepartmentName(code) {
  return departmentNames[code] || `département ${code}`;
}

export function getDepartmentIntro(code) {
  const name = getDepartmentName(code);
  return `Cette page regroupe les communes du département ${name} pour accéder rapidement aux résultats des élections présidentielles. Sélectionnez une commune afin de consulter les scores des candidats, la participation, l'abstention et les données disponibles par année. PrésiFrance s'appuie sur des données officielles en open data pour faciliter la comparaison locale et replacer chaque commune dans son contexte départemental.`;
}

const defaultSiteName = "PrésiFrance";

export const seoPrerenderRoutes = [
  {
    path: "/",
    title: `${defaultSiteName} — Élections présidentielles françaises`,
    description: "Explorez les résultats par commune, la participation et les parrainages des élections présidentielles françaises. Données ouvertes.",
  },
  {
    path: "/resultats-presidentielle",
    title: `Résultats des élections présidentielles françaises — ${defaultSiteName}`,
    description: "Tous les résultats des élections présidentielles françaises par année, commune et département : scores, participation, candidats et données officielles.",
  },
  {
    path: "/resultats-presidentielle-par-commune",
    title: `Résultats présidentielle par commune — ${defaultSiteName}`,
    description: "Trouvez les résultats d'une élection présidentielle par commune : scores des candidats, participation, abstention et données officielles locales.",
  },
  {
    path: "/carte-presidentielle",
    title: `Carte présidentielle — ${defaultSiteName}`,
    description: "Explorez les résultats de l'élection présidentielle sur une carte : communes, départements, scores locaux et lecture géographique du vote.",
  },
  {
    path: "/participation-presidentielle",
    title: `Participation présidentielle — ${defaultSiteName}`,
    description: "Analysez la participation à l'élection présidentielle par commune et département : niveaux de mobilisation, comparaison locale et données officielles.",
  },
  {
    path: "/abstention-presidentielle",
    title: `Abstention présidentielle — ${defaultSiteName}`,
    description: "Consultez l'abstention à l'élection présidentielle par commune et département : écarts locaux, participation inverse et données officielles.",
  },
  ...presidentialYearSummaries.map((summary) => ({
    path: `/presidentielle-${summary.year}`,
    title: `Résultats présidentielle ${summary.year} — ${defaultSiteName}`,
    description: `Résultats de l'élection présidentielle ${summary.year} : ${summary.winner} face à ${summary.runnerUp}, scores, participation et accès aux données par commune.`,
  })),
  {
    path: "/explorer",
    title: `Résultats présidentielle par commune — ${defaultSiteName}`,
    description: "Parcourez les résultats électoraux de toutes les communes de France par département et accédez aux données officielles de la présidentielle.",
  },
  ...departmentRoutes.map((path) => {
    const code = path.replace("/explorer/", "");
    const name = getDepartmentName(code);
    return {
      path,
      title: `Résultats présidentielle : ${name} — ${defaultSiteName}`,
      description: `Liste des communes pour le département ${name}. Retrouvez les résultats de l'élection présidentielle par ville, village et commune.`,
    };
  }),
  {
    path: "/parrainages",
    title: `Parrainages présidentiels — ${defaultSiteName}`,
    description: "Parrainages validés par le Conseil constitutionnel : recherche par département, candidat et année.",
  },
  {
    path: "/comparer",
    title: `Comparer des communes — ${defaultSiteName}`,
    description: "Comparez les résultats présidentiels de deux communes françaises côte à côte : participation, candidats, scores et écarts.",
  },
  {
    path: "/analyse",
    title: `Sondages présidentielle 2022 — 1er tour — ${defaultSiteName}`,
    description: "Chronologie des intentions de vote au 1er tour de la présidentielle 2022, avec courbes lissées et méthodologie.",
  },
  {
    path: "/promesses-bilan",
    title: `Promesses 2017 vs bilan 2017-2022 — ${defaultSiteName}`,
    description: "Synthèse pédagogique des engagements de campagne 2017 et de leur mise en œuvre sur le premier quinquennat d'Emmanuel Macron.",
  },
  {
    path: "/integrer",
    title: `Intégrer nos cartes et résultats — ${defaultSiteName}`,
    description: "Médias et blogs locaux : intégrez gratuitement les cartes et résultats de la présidentielle de PrésiFrance avec un code iframe.",
  },
];
