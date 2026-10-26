import { useEffect } from "react";
import { GOOGLE_SITE_VERIFICATION, ogImageUrl, SITE_NAME, SITE_URL } from "@/lib/site";

interface Props {
  title?: string;
  description?: string;
  path?: string;
}

const DEFAULT_TITLE = `Élection présidentielle France : 2027 et résultats — ${SITE_NAME}`;
const DEFAULT_DESC =
  "Élection présidentielle en France : suivi de 2027 (candidats, sondages, parrainages) et résultats de toutes les présidentielles depuis 1965, commune par commune.";

const SEOHead = ({ title, description, path }: Props): null => {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESC;
    const url = path ? `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}` : SITE_URL;
    const image = ogImageUrl();

    document.title = fullTitle;

    const updateMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(isProperty ? "property" : "name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    updateMeta("description", desc);
    updateMeta("google-site-verification", GOOGLE_SITE_VERIFICATION);
    updateMeta("og:title", fullTitle, true);
    updateMeta("og:description", desc, true);
    updateMeta("og:url", url, true);
    updateMeta("og:type", "website", true);
    updateMeta("og:image", image, true);
    updateMeta("og:image:width", "1200", true);
    updateMeta("og:image:height", "630", true);
    updateMeta("og:image:alt", `${SITE_NAME} — historique présidentiel français, résultats par commune`, true);
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", fullTitle);
    updateMeta("twitter:description", desc);
    updateMeta("twitter:image", image);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }, [title, description, path]);

  return null;
};

export default SEOHead;
