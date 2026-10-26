import { useQuery } from "@tanstack/react-query";

import { getAllNationalResults } from "@/lib/api/nationalResultsApi";
import { hubFaq, yearFaq, type NationalByYear } from "@/lib/yearContent";

export function useNationalAll() {
  return useQuery({ queryKey: ["national-results-all"], queryFn: getAllNationalResults, staleTime: Infinity });
}

/** Questions-réponses de la page (texte brut, partagé avec le JSON-LD FAQPage). */
export function useYearFaq(year: number) {
  const { data } = useNationalAll();
  return data ? yearFaq(year, data as NationalByYear) : [];
}

export function useHubFaq() {
  const { data } = useNationalAll();
  return data ? hubFaq(data as NationalByYear) : [];
}
