import { SITE_NAME, SITE_URL } from "@/lib/site";

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface JsonLdProps {
  path: string;
  commune?: { nom: string; code: string; codeDepartement: string } | null;
  breadcrumbs?: BreadcrumbItem[];
  /** Questions/réponses en texte brut : émet un FAQPage (le texte doit figurer sur la page). */
  faq?: { q: string; a: string }[];
}

export default function JsonLd({ path, commune, breadcrumbs, faq }: JsonLdProps) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${SITE_URL}${normalizedPath}`;

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Résultats des élections présidentielles françaises par commune : scores, participation et parrainages. Open Data.",
    inLanguage: "fr-FR",
  };

  const breadcrumbItems: { name: string; item: string }[] = [{ name: "Accueil", item: SITE_URL }];

  if (breadcrumbs) {
    breadcrumbs.forEach((b) => {
      const p = b.path.startsWith("/") ? b.path : `/${b.path}`;
      breadcrumbItems.push({ name: b.name, item: `${SITE_URL}${p}` });
    });
  } else if (commune) {
    breadcrumbItems.push({ name: commune.nom, item: url });
  }

  const breadcrumbSchema =
    breadcrumbItems.length > 1
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbItems.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            item: item.item,
          })),
        }
      : null;

  const faqSchema =
    faq && faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  if (!commune) {
    return (
      <>
        {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        {breadcrumbSchema && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        )}
      </>
    );
  }

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Résultats des élections — ${commune.nom}`,
    description: `Résultats électoraux de la commune de ${commune.nom} (département ${commune.codeDepartement}) : présidentielles, législatives, européennes et municipales.`,
    url,
    license: "https://www.etalab.gouv.fr/licence-ouverte-open-licence/",
    creator: {
      "@type": "Organization",
      name: "Ministère de l'Intérieur",
      url: "https://www.data.gouv.fr",
    },
    isBasedOn: "https://www.data.gouv.fr",
    spatialCoverage: {
      "@type": "Place",
      name: commune.nom,
      address: {
        "@type": "PostalAddress",
        addressCountry: "FR",
      },
    },
  };

  return (
    <>
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />
      {breadcrumbSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      )}
    </>
  );
}
