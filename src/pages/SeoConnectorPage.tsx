import type { ReactNode } from "react";
import { BarChart3, GitCompare, LucideIcon, MapPin, Search } from "lucide-react";

import { GlowCard, PageHero, Reveal, Section } from "@/components/design";
import JsonLd from "@/components/JsonLd";
import LinkCard from "@/components/seo/LinkCard";
import SEOHead from "@/components/SEOHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

interface ConnectorCard {
  title: string;
  text: string;
  Icon: LucideIcon;
}

interface ConnectorPageProps {
  path: string;
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  answerTitle: string;
  answer: string;
  stepsTitle: string;
  steps: string[];
  faq: Array<{ question: string; answer: string }>;
  cards: ConnectorCard[];
  heroActions?: ReactNode;
}

export default function SeoConnectorPage({
  path,
  eyebrow,
  title,
  description,
  intro,
  answerTitle,
  answer,
  stepsTitle,
  steps,
  faq,
  cards,
  heroActions,
}: ConnectorPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title={title} description={description} path={path} />
      <JsonLd
        path={path}
        breadcrumbs={[
          { name: "Résultats présidentielle", path: "/resultats-presidentielle" },
          { name: title, path },
        ]}
      />
      <SiteHeader />

      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
        <PageHero eyebrow={eyebrow} title={title} description={intro} actions={heroActions} />

        <Section width="narrow" className="pb-0 sm:pb-0">
          <Reveal>
            <GlowCard glow="red" interactive={false}>
              <h2 className="mb-3 font-heading text-2xl font-semibold sm:text-3xl">{answerTitle}</h2>
              <p className="leading-relaxed text-muted-foreground">{answer}</p>
            </GlowCard>
          </Reveal>
        </Section>

        <Section>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {cards.map(({ title: cardTitle, text, Icon }, i) => (
              <Reveal key={cardTitle} delay={i * 0.08}>
                <GlowCard className="h-full">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mb-1.5 text-lg font-semibold">{cardTitle}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
                </GlowCard>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section className="pt-0 sm:pt-0">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <GlowCard interactive={false}>
              <h2 className="mb-5 font-heading text-2xl font-semibold">{stepsTitle}</h2>
              <ol className="space-y-4 text-sm text-muted-foreground">
                {steps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold tabular-nums text-primary">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </GlowCard>
            <GlowCard glow="red" interactive={false}>
              <h2 className="mb-5 font-heading text-2xl font-semibold">Questions fréquentes</h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                {faq.map((item) => (
                  <p key={item.question}>
                    <strong className="text-foreground">{item.question}</strong>
                    <br />
                    {item.answer}
                  </p>
                ))}
              </div>
            </GlowCard>
          </div>
        </Section>

        <Section className="pt-0 sm:pt-0">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <LinkCard to="/resultats-presidentielle" Icon={BarChart3} title="Hub résultats" text="Revenir à l'architecture principale par année, commune et département." />
            <LinkCard to="/resultats-presidentielle-par-commune" Icon={Search} glow="red" title="Par commune" text="Trouver directement une ville ou un village." />
            <LinkCard to="/explorer" Icon={MapPin} glow="white" title="Par département" text="Parcourir les communes depuis une entrée géographique." />
            <LinkCard to="/comparer" Icon={GitCompare} title="Comparer" text="Comparer deux communes côte à côte." />
          </div>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
