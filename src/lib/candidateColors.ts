/**
 * Couleurs par candidat (clé = nom complet ou nom seul selon les jeux de données).
 * Construit via `Map` : en cas de clés répétées entre années, la dernière occurrence l’emporte (comme un littéral d’objet JS).
 */
const CANDIDATE_COLOR_ENTRIES: [string, string][] = [
  // 2022
  ["Emmanuel MACRON", "#3aa0ff"],
  ["Marine LE PEN", "#6f63f0"],
  ["Jean-Luc MÉLENCHON", "#e8365d"],
  ["Éric ZEMMOUR", "#9aa3b2"],
  ["Valérie PÉCRESSE", "#14b8b0"],
  ["Yannick JADOT", "#34c759"],
  ["Jean LASSALLE", "#d4a72c"],
  ["Fabien ROUSSEL", "#d92d20"],
  ["Nicolas DUPONT-AIGNAN", "#a56cd6"],
  ["Anne HIDALGO", "#ff8a3d"],
  ["Philippe POUTOU", "#ff7b9c"],
  ["Nathalie ARTHAUD", "#b4234f"],
  // 2027
  ["Édouard PHILIPPE", "#2f7de1"],
  ["Gabriel ATTAL", "#5cc8ff"],
  ["Raphaël GLUCKSMANN", "#c026a8"],
  ["Marine TONDELIER", "#2fbf71"],
  ["Bruno RETAILLEAU", "#0e4a9e"],
  ["François RUFFIN", "#e0662c"],
  ["Olivier FAURE", "#d1477a"],
  ["Laurent WAUQUIEZ", "#1f3a93"],
  ["Dominique de VILLEPIN", "#7c8ba1"],
  ["David LISNARD", "#8b5a2b"],
  ["Jordan BARDELLA", "#3b2fb5"],
  ["Sarah KNAFO", "#a0522d"],
  ["Bernard CAZENEUVE", "#ff6b6b"],
  ["Karim BOUAMRANE", "#b0405a"],
  ["Bruno LE MAIRE", "#0891b2"],
  ["Xavier BERTRAND", "#2b6cb0"],
  ["Natacha POLONY", "#8e6bbf"],
  // 2017
  ["François FILLON", "#0066cc"],
  ["Benoît HAMON", "#ff6b35"],
  // 1974 (CDSP circ, NOM only)
  ["GISCARD D'ESTAING", "#0066cc"],
  ["MITTERRAND", "#cc2443"],
  ["CHABAN-DELMAS", "#0066cc"],
  ["ROYER", "#9aa3b2"],
  ["LAGUILLER", "#8b0000"],
  ["DUMONT", "#00c000"],
  ["LE PEN", "#004494"],
  ["MULLER", "#cc2443"],
  ["KRIVINE", "#dd0000"],
  ["RENOUVIN", "#8b93a3"],
  ["SEBAG", "#8b93a3"],
  ["HERAUD", "#8b93a3"],
  // 1969 (CDSP circ)
  ["POHER", "#0066cc"],
  ["DE GAULLE", "#0066cc"],
  ["DUCLOS", "#dd0000"],
  ["ROCHER", "#9aa3b2"],
  // 1965 (CDSP circ)
  ["DE GAULLE", "#0066cc"],
  ["MITTERRAND", "#cc2443"],
  ["LECANUET", "#0066cc"],
  ["MARCILHACY", "#9aa3b2"],
  ["TIXIER-VIGNANCOUR", "#004494"],
  ["BARBU", "#8b93a3"],
  // 1981 (CDSP commp9000, NOM only)
  ["MITTERRAND", "#cc2443"],
  ["GISCARD D'ESTAING", "#0066cc"],
  ["MARCHAIS", "#dd0000"],
  ["LALONDE", "#00c000"],
  ["CREPEAU", "#cc2443"],
  ["CHIRAC", "#0066cc"],
  ["LAGUILLER", "#8b0000"],
  ["BOUCHARDEAU", "#cc2443"],
  ["DEBRE", "#0066cc"],
  ["GARAUD", "#9aa3b2"],
  // 1988 (CDSP uses NOM only)
  ["MITTERRAND", "#cc2443"],
  ["CHIRAC", "#0066cc"],
  ["BARRE", "#0066cc"],
  ["LE PEN", "#004494"],
  ["LAJOINIE", "#dd0000"],
  ["WAECHTER", "#00c000"],
  ["JUQUIN", "#dd0000"],
  ["LAGUILLER", "#8b0000"],
  ["BOUSSEL", "#8b0000"],
  // 1995
  ["Jacques CHIRAC", "#0066cc"],
  ["Lionel JOSPIN", "#cc2443"],
  ["Édouard BALLADUR", "#0066cc"],
  ["Jean-Marie LE PEN", "#004494"],
  ["Arlette LAGUILLER", "#8b0000"],
  ["Robert HUE", "#dd0000"],
  ["Dominique VOYNET", "#00c000"],
  ["Philippe de VILLIERS", "#0066cc"],
  ["Jacques CHEVENEMENT", "#cc2443"],
  ["Edouard BALLADUR", "#0066cc"],
  // 2002
  ["Jacques CHIRAC", "#0066cc"],
  ["Jean-Marie LE PEN", "#004494"],
  ["Lionel JOSPIN", "#cc2443"],
  ["François BAYROU", "#ffcc00"],
  ["Arlette LAGUILLER", "#8b0000"],
  ["Jean-Pierre CHEVÈNEMENT", "#cc2443"],
  ["Noël MAMÈRE", "#00c000"],
  ["Olivier BESANCENOT", "#dd0000"],
  ["Jean SAINT-JOSSE", "#9aa3b2"],
  ["Alain MADELIN", "#0066cc"],
  ["Robert HUE", "#dd0000"],
  ["Bruno MÉGRET", "#004494"],
  ["Christiane TAUBIRA", "#cc2443"],
  ["Corinne LEPAGE", "#00c000"],
  ["Christine BOUTIN", "#0066cc"],
  ["Daniel GLUCKSTEIN", "#8b0000"],
  // 2007
  ["Nicolas SARKOZY", "#0066cc"],
  ["Ségolène ROYAL", "#cc2443"],
  ["François BAYROU", "#ffcc00"],
  ["Jean-Marie LE PEN", "#004494"],
  ["Olivier BESANCENOT", "#dd0000"],
  ["Philippe de VILLIERS", "#0066cc"],
  ["Marie-George BUFFET", "#dd0000"],
  ["Dominique VOYNET", "#00c000"],
  ["Arlette LAGUILLER", "#8b0000"],
  ["José BOVÉ", "#00c000"],
  ["Frédéric NIHOUS", "#9aa3b2"],
  ["Gérard SCHIVARDI", "#8b93a3"],
  // 2012
  ["Nicolas SARKOZY", "#0066cc"],
  ["François HOLLANDE", "#cc2443"],
  ["François BAYROU", "#ffcc00"],
  ["Eva JOLY", "#00c000"],
  ["Jacques CHEMINADE", "#8b93a3"],
];

export const CANDIDATE_COLORS: Record<string, string> = Object.fromEntries(new Map(CANDIDATE_COLOR_ENTRIES));

const FALLBACK_PALETTE = [
  "#0091ff",
  "#cc2443",
  "#004494",
  "#00c000",
  "#ff6b35",
  "#8b0000",
  "#0066cc",
  "#9aa3b2",
  "#0082c4",
  "#ffcc00",
  "#8b93a3",
  "#ff4000",
  "#bb0000",
];

export function getCandidateColor(prenom: string, nom: string, index: number): string {
  const full = `${prenom} ${nom.toUpperCase()}`;
  const nomOnly = nom.toUpperCase();
  const exact = CANDIDATE_COLORS[full] ?? CANDIDATE_COLORS[nomOnly];
  if (exact) return exact;
  const key = Object.keys(CANDIDATE_COLORS).find((k) => k.toUpperCase() === full.toUpperCase());
  return (key ? CANDIDATE_COLORS[key] : null) ?? FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}
