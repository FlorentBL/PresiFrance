import { useState } from "react";
import { Download, Link2, Share2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { renderShareCardBlob, shareFilename, type ShareCardData } from "@/lib/communeShare";

const btn =
  "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-accent disabled:opacity-60";

interface Props {
  url: string;
  title: string;
  text: string;
  card: ShareCardData | null;
}

/** Web Share API (si disponible), copie du lien et image PNG générée dans le navigateur. */
export function CommuneShare({ url, title, text, card }: Props) {
  const [busy, setBusy] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié dans le presse-papier");
    } catch {
      toast.error("Copie impossible : sélectionnez le lien dans la barre d'adresse.");
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title, text, url });
    } catch (e) {
      if ((e as DOMException)?.name !== "AbortError") void copy();
    }
  };

  const download = async () => {
    if (!card) return;
    setBusy(true);
    try {
      const blob = await renderShareCardBlob(card);
      if (!blob) throw new Error("canvas");
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = shareFilename(card.commune, card.year);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch {
      toast.error("Impossible de générer l'image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {canShare && (
        <button type="button" onClick={share} className={btn}>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Partager
        </button>
      )}
      <button type="button" onClick={copy} className={btn}>
        <Link2 className="h-4 w-4" aria-hidden="true" />
        Copier le lien
      </button>
      <button type="button" onClick={download} disabled={!card || busy} className={btn}>
        <Download className="h-4 w-4" aria-hidden="true" />
        Image de partage
      </button>
    </>
  );
}

export default CommuneShare;
