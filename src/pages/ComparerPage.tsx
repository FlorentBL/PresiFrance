import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Users, Vote, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { PageHero, Section, SegmentedControl, GlowCard, Reveal } from "@/components/design";
import { CommuneSlot } from "@/components/compare/CommuneSlot";
import { VersusStat } from "@/components/compare/VersusStat";
import { MirrorBars } from "@/components/compare/MirrorBars";
import { getCommuneByCode, GeoCommune } from "@/lib/api/geoApi";
import { getCommuneResults } from "@/lib/api/resultsApi";
import { DEFAULT_YEAR, PRESIDENTIAL_YEARS_DESC } from "@/lib/elections";
import { toast } from "@/components/ui/sonner";

const ROUNDS = [
  { value: 1 as const, label: "1er tour" },
  { value: 2 as const, label: "2nd tour" },
];

const ComparerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [round, setRound] = useState<1 | 2>(1);

  const yearParam = searchParams.get("year");
  const codeA = searchParams.get("a");
  const codeB = searchParams.get("b");
  const year = (yearParam ? Number(yearParam) : DEFAULT_YEAR) as (typeof PRESIDENTIAL_YEARS_DESC)[number];

  const { data: communeA } = useQuery({
    queryKey: ["geo", codeA],
    queryFn: () => getCommuneByCode(codeA!),
    enabled: !!codeA,
  });
  const { data: communeB } = useQuery({
    queryKey: ["geo", codeB],
    queryFn: () => getCommuneByCode(codeB!),
    enabled: !!codeB,
  });

  const { data: resultsA, isLoading: loadingA } = useQuery({
    queryKey: ["results", communeA?.code, round, year],
    queryFn: () => getCommuneResults(communeA!.code, round, year),
    enabled: !!communeA?.code,
  });
  const { data: resultsB, isLoading: loadingB } = useQuery({
    queryKey: ["results", communeB?.code, round, year],
    queryFn: () => getCommuneResults(communeB!.code, round, year),
    enabled: !!communeB?.code,
  });

  const setParam = (key: "a" | "b", value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const bothSelected = communeA && communeB;
  const isLoading = loadingA || loadingB;
  const hasResults = resultsA && resultsB;
  const fr = (n: number) => n.toLocaleString("fr-FR");

  const shareButton = bothSelected ? (
    <button
      type="button"
      onClick={() => {
        const url = `${window.location.origin}/comparer?a=${codeA}&b=${codeB}&year=${year}`;
        navigator.clipboard.writeText(url).then(() => toast.success("Lien copié dans le presse-papier"));
      }}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card/60 px-5 text-sm font-medium hover:border-primary/50"
    >
      <Share2 className="h-4 w-4" aria-hidden="true" />
      Copier le lien
    </button>
  ) : undefined;

  const heroActions = (
    <>
      <Link
        to="/"
        className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card/60 px-5 text-sm font-medium hover:border-primary/50"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour à l'accueil
      </Link>
      {shareButton}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Comparer des communes"
        description="Comparez les résultats présidentiels de deux communes françaises côte à côte."
        path="/comparer"
      />
      <JsonLd path="/comparer" breadcrumbs={[{ name: "Comparer des communes", path: "/comparer" }]} />
      <SiteHeader />

      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
        <PageHero
          eyebrow="Face-à-face"
          title="Comparer des communes"
          description="Comparez les résultats électoraux de deux communes côte à côte : participation, scores des candidats, etc."
          actions={heroActions}
        />

        <Section className="!pb-6">
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_auto_1fr]">
            <CommuneSlot
              side="a"
              label="Première commune"
              commune={communeA as GeoCommune | undefined}
              year={year}
              onSelect={(c) => setParam("a", c.code)}
              onClear={() => setParam("a", null)}
            />
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card font-heading text-sm font-extrabold md:mt-7"
              aria-hidden="true"
            >
              VS
            </div>
            <CommuneSlot
              side="b"
              label="Deuxième commune"
              commune={communeB as GeoCommune | undefined}
              year={year}
              onSelect={(c) => setParam("b", c.code)}
              onClear={() => setParam("b", null)}
            />
          </div>
        </Section>

        {bothSelected && (
          <Section className="!pt-6">
            <SegmentedControl<1 | 2> label="Tour de l'élection" options={ROUNDS} value={round} onChange={setRound} className="mb-8" />

            {isLoading && !hasResults ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Chargement" />
              </div>
            ) : hasResults ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Reveal>
                    <VersusStat
                      title="Participation"
                      icon={<Users className="h-3.5 w-3.5" />}
                      nameA={communeA.nom}
                      nameB={communeB.nom}
                      valueA={resultsA.votantsPourcent}
                      valueB={resultsB.votantsPourcent}
                      subA={`${fr(resultsA.votants)} / ${fr(resultsA.inscrits)}`}
                      subB={`${fr(resultsB.votants)} / ${fr(resultsB.inscrits)}`}
                    />
                  </Reveal>
                  <Reveal delay={0.1}>
                    <VersusStat
                      title="Abstention"
                      icon={<Vote className="h-3.5 w-3.5" />}
                      nameA={communeA.nom}
                      nameB={communeB.nom}
                      valueA={resultsA.abstentionsPourcent}
                      valueB={resultsB.abstentionsPourcent}
                      subA={fr(resultsA.abstentions)}
                      subB={fr(resultsB.abstentions)}
                    />
                  </Reveal>
                </div>

                <Reveal>
                  <GlowCard glow="white" interactive={false}>
                    <h2 className="mb-6 font-heading text-2xl font-bold">Résultats par candidat</h2>
                    <MirrorBars
                      candidatesA={resultsA.candidates}
                      candidatesB={resultsB.candidates}
                      nameA={communeA.nom}
                      nameB={communeB.nom}
                    />
                  </GlowCard>
                </Reveal>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p>Résultats introuvables pour une ou plusieurs communes.</p>
                <p className="mt-2 text-sm">Vérifiez que les données existent pour l'année {year}.</p>
              </div>
            )}
          </Section>
        )}

        {!bothSelected && (
          <Section className="!pt-6">
            <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
              <p>Sélectionnez deux communes pour les comparer.</p>
            </div>
          </Section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
};

export default ComparerPage;
